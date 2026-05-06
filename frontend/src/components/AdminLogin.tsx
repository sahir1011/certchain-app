"use client";
import { useState, FormEvent } from "react";
import { useAdmin } from "@/utils/adminContext";
import { Shield, Loader2, AlertCircle, Lock, User } from "lucide-react";

export default function AdminLogin() {
    const { login, isAuthenticated } = useAdmin();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(username, password);
        } catch (err: any) {
            setError(err.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (isAuthenticated) return null;

    return (
        <div className="max-w-md mx-auto mt-12">
            <div className="card p-8 space-y-6">
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="p-3 rounded-xl bg-primary-600">
                            <Shield size={28} className="text-white" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-surface-900">Admin Login</h2>
                    <p className="text-surface-500 text-sm">Sign in to issue and manage certificates</p>
                </div>

                {error && (
                    <div className="p-3 flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={16} className="text-surface-400" />
                            </div>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" required className="input-field pl-10" autoComplete="username" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={16} className="text-surface-400" />
                            </div>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required className="input-field pl-10" autoComplete="current-password" />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? (<><Loader2 size={16} className="animate-spin" /> Signing in...</>) : (<><Shield size={16} /> Sign In</>)}
                    </button>
                </form>
            </div>
        </div>
    );
}
