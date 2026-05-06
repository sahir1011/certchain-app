"use client";
import { useState, FormEvent } from "react";
import { User, Lock, Loader2, AlertCircle, LogIn } from "lucide-react";
import { useStudent } from "@/utils/studentContext";

interface StudentLoginProps {
    onSwitchToRegister: () => void;
}

export default function StudentLogin({ onSwitchToRegister }: StudentLoginProps) {
    const { login } = useStudent();
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
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[500px] flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="card p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-purple-600 mb-4">
                            <User className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-surface-900 mb-1">Student Login</h2>
                        <p className="text-surface-500 text-sm">Access your certificates</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="input-field pl-10" placeholder="Enter your username" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-10" placeholder="Enter your password" required />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>) : (<><LogIn className="w-4 h-4" /> Sign In</>)}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-surface-500 text-sm">
                            Don't have an account?{" "}
                            <button onClick={onSwitchToRegister} className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">Register here</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
