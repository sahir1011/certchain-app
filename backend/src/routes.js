/**
 * routes.js
 * ---------
 * Express router.  All business logic lives here.
 *
 * POST   /api/certificates/issue      – hash payload, store on-chain, cache locally
 * GET    /api/certificates/verify/:hash – read on-chain + local cache
 * GET    /api/certificates/student/:id  – filter local cache
 * GET    /api/certificates              – list all (from cache)
 * POST   /api/certificates/revoke      – revoke on-chain + update cache
 * GET    /api/health                   – liveness / network info
 */

const express = require("express");
const { ethers } = require("ethers");
const crypto = require("crypto");

const blockchain = require("./blockchain");
const store = require("./store");
const { requireAuth, requireStudentAuth } = require("./auth");

const { uploadJSONToIPFS } = require("./utils/ipfs");
const { sendCertificateEmail } = require("./utils/emailService");
const { Student } = require("./models");

const router = express.Router();

// ── helpers ──────────────────────────────────────────────────────────────
function sha256(payload) {
  return "0x" + crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function toBytes32(hexHash) {
  // Ensure the hash is exactly 32 bytes (64 hex chars) with 0x prefix
  return ethers.dataSlice(hexHash, 0, 32);
}

// ── HEALTH ───────────────────────────────────────────────────────────────
router.get("/health", async (req, res) => {
  try {
    const blockNumber = await blockchain.getLatestBlockNumber();
    res.json({
      status: "ok",
      contractAddress: process.env.CONTRACT_ADDRESS,
      network: "sepolia",
      blockNumber,
    });
  } catch (e) {
    res.status(503).json({ status: "error", message: e.message });
  }
});

// ── ISSUE ────────────────────────────────────────────────────────────────
// 🔒 PROTECTED: Requires admin authentication
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { uploadFileToIPFS } = require("./utils/ipfs");

router.post("/certificates/issue", requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { studentName, studentId, courseName, institutionName, issuanceDate, expiryDate, grade, issuerAddress, studentEmail } = req.body;

    // Validate required fields
    if (!studentName || !studentId || !courseName || !institutionName || !issuanceDate) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Build canonical payload (deterministic key order)
    const payload = {
      studentName,
      studentId,
      courseName,
      institutionName,
      issuanceDate,
      expiryDate: expiryDate || "",
      grade: grade || "",
    };

    // SHA-256 → bytes32
    const certHash = sha256(payload);
    const certHashBytes32 = toBytes32(certHash);

    // Check duplicate in local cache (DB)
    const existing = await store.get(certHash);
    if (existing) {
      return res.status(409).json({ message: "A certificate with this exact payload already exists." });
    }

    // ── Upload Image to IPFS ──
    let imageIpfsHash = null;
    if (req.file) {
      const fileName = `cert-${studentId}-${certHash.slice(0, 8)}.png`;
      imageIpfsHash = await uploadFileToIPFS(req.file.buffer, fileName);
    }

    // ── Upload Metadata to IPFS ──
    const ipfsMetadata = {
      ...payload,
      certificateHash: certHash,
      image: imageIpfsHash ? `ipfs://${imageIpfsHash}` : null,
      issuerAddress: issuerAddress || (await blockchain.getSigner()).address,
      generatedAt: new Date().toISOString()
    };

    const ipfsHash = await uploadJSONToIPFS(ipfsMetadata);

    // ── On-chain transaction ──
    const { txHash, blockNumber, issuedAt } = await blockchain.issueCertOnChain(certHashBytes32, studentId);

    // ── Cache locally (Store in DB) ──
    const record = {
      certificateHash: certHash,
      studentName,
      studentId,
      courseName,
      institutionName,
      issuanceDate,
      expiryDate: expiryDate || "",
      grade: grade || "",
      isValid: true,
      issuerAddress: issuerAddress || (await blockchain.getSigner()).address,
      txHash,
      blockNumber,
      timestamp: issuedAt,
      ipfsHash, // Save IPFS hash (Metadata)
      imageIpfsHash, // Save Image IPFS hash
    };

    await store.set(certHash, record);

    // ── Send Email Notification ──
    try {
      let targetEmail = studentEmail;

      if (!targetEmail) {
        // Fallback: lookup student in DB
        const student = await Student.findOne({ where: { studentId } });
        if (student && student.email) {
          targetEmail = student.email;
        }
      }

      if (targetEmail) {
        // Construct certificate URL
        // Adjust the URL based on your actual frontend deployment or local setup
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const certificateUrl = `${frontendUrl}/verify-certificate?hash=${certHash}`;

        // Pass file buffer directly if available
        const attachmentBuffer = req.file ? req.file.buffer : null;

        await sendCertificateEmail(targetEmail, studentName, courseName, certificateUrl, attachmentBuffer);
        console.log(`[Email] Sent to ${targetEmail}`);
      }
    } catch (emailErr) {
      console.error("Failed to send email notif:", emailErr);
      // Don't fail the request if email fails, just log it
    }

    res.status(201).json(record);
  } catch (e) {
    console.error("[issue]", e);
    res.status(500).json({ message: e.message || "Failed to issue certificate." });
  }
});

const axios = require('axios'); // Add axios for proxying IPFS content

// ── VERIFY ───────────────────────────────────────────────────────────────
router.get("/certificates/verify/:hash", async (req, res) => {
  try {
    let hash = req.params.hash.trim();

    // Normalise: accept with or without 0x
    if (!hash.startsWith("0x")) hash = "0x" + hash;

    const certHashBytes32 = toBytes32(hash);

    // ── On-chain check ──
    const onChain = await blockchain.verifyCertOnChain(certHashBytes32);

    if (!onChain.exists) {
      return res.json({
        isValid: false,
        certificate: null,
        message: "Certificate hash not found on-chain.",
      });
    }

    // ── Merge with local cache for the full record ──
    const cached = await store.get(hash);

    // Update validity from chain (in case it was revoked)
    if (cached) cached.isValid = onChain.isValid;

    res.json({
      isValid: onChain.isValid,
      certificate: cached || {
        certificateHash: hash,
        isValid: onChain.isValid,
        issuerAddress: onChain.issuer,
        timestamp: onChain.issuedAt,
        // other fields unknown if not in local cache
      },
      message: onChain.isValid ? "Certificate is valid." : "Certificate has been revoked.",
    });
  } catch (e) {
    console.error("[verify]", e);
    res.status(500).json({ message: e.message || "Verification failed." });
  }
});

// ── DOWNLOAD ─────────────────────────────────────────────────────────────
router.get("/certificates/download/:hash", async (req, res) => {
  try {
    let hash = req.params.hash.trim();
    if (!hash.startsWith("0x")) hash = "0x" + hash;

    const cert = await store.get(hash);

    if (!cert || !cert.imageIpfsHash) {
      return res.status(404).send("Certificate image not found.");
    }

    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${cert.imageIpfsHash}`;

    // Proxy the file from IPFS
    const response = await axios({
      url: ipfsUrl,
      method: 'GET',
      responseType: 'stream'
    });

    res.setHeader('Content-Disposition', `attachment; filename="certificate-${hash.slice(0, 8)}.png"`);
    res.setHeader('Content-Type', response.headers['content-type']);

    response.data.pipe(res);

  } catch (e) {
    console.error("[download]", e);
    res.status(500).send("Failed to download certificate.");
  }
});

// ── BY STUDENT ───────────────────────────────────────────────────────────
router.get("/certificates/student/:studentId", async (req, res) => {
  try {
    const results = await store.getByStudent(req.params.studentId);
    res.json(results);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── MY CERTIFICATES (Student Protected) ──────────────────────────────────
// 🔒 PROTECTED: Requires student authentication
router.get("/certificates/my-certificates", requireStudentAuth, async (req, res) => {
  try {
    const studentId = req.student.studentId;
    const certificates = await store.getByStudent(studentId);
    res.json(certificates);
  } catch (e) {
    console.error("[my-certificates]", e);
    res.status(500).json({ message: e.message || "Failed to fetch certificates." });
  }
});

// ── LIST ALL ─────────────────────────────────────────────────────────────
router.get("/certificates", async (req, res) => {
  try {
    res.json(await store.getAll());
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── REVOKE ───────────────────────────────────────────────────────────────
// 🔒 PROTECTED: Requires admin authentication
router.post("/certificates/revoke", requireAuth, async (req, res) => {
  try {
    const { certificateHash } = req.body;
    if (!certificateHash) {
      return res.status(400).json({ message: "certificateHash is required." });
    }

    let hash = certificateHash.trim();
    if (!hash.startsWith("0x")) hash = "0x" + hash;

    const certHashBytes32 = toBytes32(hash);

    // On-chain revoke
    let txHash = null;
    try {
      const result = await blockchain.revokeCertOnChain(certHashBytes32);
      txHash = result.txHash;
    } catch (chainErr) {
      const errMsg = (chainErr.reason || chainErr.message || "").toLowerCase();
      if (errMsg.includes("already revoked")) {
        console.log(`[revoke] Certificate ${hash} is already revoked on-chain. Syncing local DB.`);
      } else {
        throw chainErr;
      }
    }

    // Update local cache
    await store.revoke(hash);

    res.json({ txHash, message: "Certificate revoked." });
  } catch (e) {
    console.error("[revoke]", e);
    res.status(500).json({ message: e.message || "Revocation failed." });
  }
});

module.exports = router;
