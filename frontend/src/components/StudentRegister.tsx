"use client";
import { useState, FormEvent } from "react";
import { User, Lock, Mail, Loader2, AlertCircle, UserPlus, CheckCircle } from "lucide-react";
import { useStudent } from "@/utils/studentContext";

interface StudentRegisterProps {
    onSwitchToLogin: () => void;
}

export default function StudentRegister({ onSwitchToLogin }: StudentRegisterProps) {
    const { register } = useStudent();
    const [username, setUsername] = useState("");
    const [studentId, setStudentId] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (password !== confirmPassword) { setError("Passwords do not match"); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
        setLoading(true);
        try {
            await register(username, password, studentId, email);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[500px] flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="card p-8">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-purple-600 mb-4">
                            <UserPlus className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-surface-900 mb-1">Student Registration</h2>
                        <p className="text-surface-500 text-sm">Create your account</p>
                    </div>

                    <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-0.5">Registration Requirements:</p>
                            <p>You must have certificates issued to your Student ID to register.</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">Username <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="input-field pl-10" placeholder="Choose a username" required pattern="[a-zA-Z0-9_]{3,20}" title="3-20 alphanumeric characters" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">Student ID <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="input-field pl-10" placeholder="Enter your Student ID" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">Email <span className="text-surface-400 text-xs">(optional)</span></label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="your.email@example.com" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-10" placeholder="Create a password" required minLength={6} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field pl-10" placeholder="Confirm your password" required minLength={6} />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>) : (<><UserPlus className="w-4 h-4" /> Register</>)}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-surface-500 text-sm">
                            Already have an account?{" "}
                            <button onClick={onSwitchToLogin} className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">Login here</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
