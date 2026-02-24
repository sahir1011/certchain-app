/**
 * auth.js
 * -------
 * Authentication system with session management using PostgreSQL.
 */

const express = require("express");
const crypto = require("crypto");
const { Op } = require("sequelize");
const { User, Student, Session } = require("./models");

const router = express.Router();

// Session expiry: 24 hours
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// ── Helper: Generate session token ───────────────────────────────────
function generateSessionToken() {
    return crypto.randomBytes(32).toString("hex");
}

// ── Helper: Generate salt ────────────────────────────────────────────
function generateSalt() {
    return crypto.randomBytes(16).toString("hex");
}

// ── Helper: Hash password ────────────────────────────────────────────
function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

// ── Helper: Clean expired sessions ───────────────────────────────────
async function cleanExpiredSessions() {
    try {
        await Session.destroy({
            where: {
                expiresAt: {
                    [Op.lt]: new Date()
                }
            }
        });
    } catch (e) {
        console.error("Failed to clean expired sessions:", e);
    }
}

// Clean expired sessions every hour
setInterval(cleanExpiredSessions, 60 * 60 * 1000);

// ══════════════════════════════════════════════════════════════════════
// ADMIN AUTHENTICATION
// ══════════════════════════════════════════════════════════════════════

// ── ADMIN LOGIN ──────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required." });
        }

        // 1. Check DB for Admin User
        let user = await User.findOne({ where: { username } });

        // 2. Check Environment Variables (Legacy/Fallback Admin)
        const ENV_ADMIN = process.env.ADMIN_USERNAME || "admin";
        const ENV_PASS = process.env.ADMIN_PASSWORD || "admin123";

        let isValid = false;

        if (user) {
            // TODO: Implement password hashing for Admin in DB. 
            // For now, if DB has user, we assume it stores hashed password, 
            // but we need a way to create that first. 
            // To keep it simple for this migration: 
            // We will STILL check env vars if the DB user matches the env user, 
            // or we can implement a seed script later.
            // Let's stick to Env Vars for the default 'admin' account validation 
            // but store the session in DB.
            if (username === ENV_ADMIN && password === ENV_PASS) {
                isValid = true;
            } else {
                // If we had real DB auth for admins, we'd check hash here.
                // For now, fail if not env admin.
                // Implementation Plan didn't specify Admin Registration, so we rely on Env Admin.
                if (user.passwordHash && user.passwordHash === hashPassword(password, user.salt || "")) {
                    isValid = true;
                }
            }
        } else {
            // If not in DB, check Env and create DB record if matches
            if (username === ENV_ADMIN && password === ENV_PASS) {
                isValid = true;
                // Auto-create admin in DB for FK constraints if needed
                try {
                    user = await User.create({
                        username: ENV_ADMIN,
                        passwordHash: "env-managed",
                        role: "admin"
                    });
                } catch (err) {
                    // Ignore if created concurrently
                    user = await User.findOne({ where: { username: ENV_ADMIN } });
                }
            }
        }

        if (!isValid) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Create session
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + SESSION_DURATION);

        await Session.create({
            token: sessionToken,
            userId: user.id || "env-admin", // Use DB ID or fallback
            username: username,
            role: "admin",
            expiresAt
        });

        // Set session cookie
        res.cookie("sessionToken", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: SESSION_DURATION,
        });

        res.json({
            success: true,
            message: "Login successful.",
            user: { username },
        });
    } catch (e) {
        console.error("[auth/login]", e);
        res.status(500).json({ message: "Login failed." });
    }
});

// ── ADMIN LOGOUT ─────────────────────────────────────────────────────
router.post("/logout", async (req, res) => {
    try {
        const sessionToken = req.cookies?.sessionToken;

        if (sessionToken) {
            await Session.destroy({ where: { token: sessionToken } });
        }

        res.clearCookie("sessionToken");
        res.json({ success: true, message: "Logout successful." });
    } catch (e) {
        console.error("[auth/logout]", e);
        res.status(500).json({ message: "Logout failed." });
    }
});

// ── ADMIN VERIFY ─────────────────────────────────────────────────────
router.get("/verify", async (req, res) => {
    try {
        const sessionToken = req.cookies?.sessionToken;

        if (!sessionToken) {
            return res.status(401).json({ authenticated: false, message: "No session found." });
        }

        const session = await Session.findOne({
            where: {
                token: sessionToken,
                role: 'admin',
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!session) {
            res.clearCookie("sessionToken");
            return res.status(401).json({ authenticated: false, message: "Invalid or expired session." });
        }

        res.json({
            authenticated: true,
            user: { username: session.username },
        });
    } catch (e) {
        console.error("[auth/verify]", e);
        res.status(500).json({ message: "Verification failed." });
    }
});

// ══════════════════════════════════════════════════════════════════════
// STUDENT AUTHENTICATION
// ══════════════════════════════════════════════════════════════════════

// ── STUDENT REGISTER ─────────────────────────────────────────────────
router.post("/student/register", async (req, res) => {
    try {
        const { username, password, studentId, email } = req.body;

        if (!username || !password || !studentId) {
            return res.status(400).json({ message: "Username, password, and student ID are required." });
        }

        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            return res.status(400).json({ message: "Username must be 3-20 alphanumeric characters." });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long." });
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: "Invalid email format." });
        }

        // Check if username already exists
        const existingStudent = await Student.findOne({ where: { username } });
        if (existingStudent) {
            return res.status(409).json({ message: "Username already exists." });
        }

        // Check if studentId already exists
        const existingId = await Student.findOne({ where: { studentId } });
        if (existingId) {
            return res.status(409).json({ message: "Student ID already registered." });
        }

        // Hash password
        const salt = generateSalt();
        const passwordHash = hashPassword(password, salt);

        // Store student account
        const newStudent = await Student.create({
            username,
            studentId,
            email, // Add email
            passwordHash,
            salt
        });

        res.status(201).json({
            success: true,
            message: "Student account created successfully.",
            user: { username, studentId },
        });
    } catch (e) {
        console.error("[auth/student/register]", e);
        res.status(500).json({ message: "Registration failed." });
    }
});

// ── STUDENT LOGIN ────────────────────────────────────────────────────
router.post("/student/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required." });
        }

        // Get student account
        const student = await Student.findOne({ where: { username } });

        if (!student) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Verify password
        const passwordHash = hashPassword(password, student.salt);
        if (passwordHash !== student.passwordHash) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Create session
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + SESSION_DURATION);

        await Session.create({
            token: sessionToken,
            userId: student.studentId, // Use Student ID for easier reference
            username: student.username,
            role: "student",
            expiresAt
        });

        // Set session cookie
        res.cookie("studentSessionToken", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: SESSION_DURATION,
        });

        res.json({
            success: true,
            message: "Login successful.",
            user: { username, studentId: student.studentId },
        });
    } catch (e) {
        console.error("[auth/student/login]", e);
        res.status(500).json({ message: "Login failed." });
    }
});

// ── STUDENT LOGOUT ───────────────────────────────────────────────────
router.post("/student/logout", async (req, res) => {
    try {
        const sessionToken = req.cookies?.studentSessionToken;

        if (sessionToken) {
            await Session.destroy({ where: { token: sessionToken } });
        }

        res.clearCookie("studentSessionToken");
        res.json({ success: true, message: "Logout successful." });
    } catch (e) {
        console.error("[auth/student/logout]", e);
        res.status(500).json({ message: "Logout failed." });
    }
});

// ── STUDENT VERIFY ───────────────────────────────────────────────────
router.get("/student/verify", async (req, res) => {
    try {
        const sessionToken = req.cookies?.studentSessionToken;

        if (!sessionToken) {
            return res.status(401).json({ authenticated: false, message: "No session found." });
        }

        const session = await Session.findOne({
            where: {
                token: sessionToken,
                role: 'student',
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!session) {
            res.clearCookie("studentSessionToken");
            return res.status(401).json({ authenticated: false, message: "Invalid or expired session." });
        }

        res.json({
            authenticated: true,
            user: { username: session.username, studentId: session.userId },
        });
    } catch (e) {
        console.error("[auth/student/verify]", e);
        res.status(500).json({ message: "Verification failed." });
    }
});

// ══════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ══════════════════════════════════════════════════════════════════════

// ── MIDDLEWARE: Require Admin Authentication ────────────────────────
async function requireAuth(req, res, next) {
    const sessionToken = req.cookies?.sessionToken;

    if (!sessionToken) {
        return res.status(401).json({ message: "Authentication required." });
    }

    try {
        const session = await Session.findOne({
            where: {
                token: sessionToken,
                role: 'admin',
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!session) {
            res.clearCookie("sessionToken");
            return res.status(401).json({ message: "Invalid or expired session." });
        }

        // Attach user info to request
        req.user = { username: session.username, role: 'admin' };
        next();
    } catch (e) {
        console.error("Auth Middleware Error:", e);
        res.status(500).json({ message: "Internal server error during authentication." });
    }
}

// ── MIDDLEWARE: Require Student Authentication ──────────────────────
async function requireStudentAuth(req, res, next) {
    const sessionToken = req.cookies?.studentSessionToken;

    if (!sessionToken) {
        return res.status(401).json({ message: "Student authentication required." });
    }

    try {
        const session = await Session.findOne({
            where: {
                token: sessionToken,
                role: 'student',
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!session) {
            res.clearCookie("studentSessionToken");
            return res.status(401).json({ message: "Invalid or expired session." });
        }

        // Attach student info to request
        req.student = { username: session.username, studentId: session.userId };
        next();
    } catch (e) {
        console.error("Student Auth Middleware Error:", e);
        res.status(500).json({ message: "Internal server error during authentication." });
    }
}

module.exports = { router, requireAuth, requireStudentAuth };
