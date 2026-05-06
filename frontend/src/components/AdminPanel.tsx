"use client";
import { useState, useEffect } from "react";
import { registerAdmin, listCertificates, healthCheck } from "@/utils/api";
import type { CertificateRecord, HealthResponse } from "@/utils/api";
import { Shield, Users, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function AdminPanel() {
  const [certs, setCerts] = useState<CertificateRecord[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [h, c] = await Promise.all([healthCheck(), listCertificates()]);
        setHealth(h);
        setCerts(c);
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const validCount = certs.filter(c => c.isValid).length;
  const revokedCount = certs.filter(c => !c.isValid).length;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage(null);

    try {
      await registerAdmin(newUsername, newPassword);
      setMessage({ text: "Admin account created successfully!", type: "success" });
      setNewUsername("");
      setNewPassword("");
    } catch (err: any) {
      setMessage({ text: err?.response?.data?.message || "Failed to create account.", type: "error" });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Stats Section */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="text-primary-400" /> Platform Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-6 border-t-4 border-primary-500">
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <FileText size={20} /> Total Issued
            </div>
            <p className="text-3xl font-bold text-white">{loading ? "..." : certs.length}</p>
          </div>
          <div className="glass-card p-6 border-t-4 border-emerald-500">
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <CheckCircle size={20} /> Valid Certificates
            </div>
            <p className="text-3xl font-bold text-white">{loading ? "..." : validCount}</p>
          </div>
          <div className="glass-card p-6 border-t-4 border-red-500">
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <AlertCircle size={20} /> Revoked
            </div>
            <p className="text-3xl font-bold text-white">{loading ? "..." : revokedCount}</p>
          </div>
        </div>
      </div>

      {/* Admin Registration Section */}
      <div className="glass-card p-8">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Users className="text-purple-400" /> Create Admin Account
        </h3>
        <p className="text-sm text-gray-400 mb-6">Create additional administrator accounts to manage the platform.</p>

        {message && (
          <div className={`p-4 mb-6 rounded-lg flex items-center gap-3 text-sm ${
            message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter new admin username"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter secure password"
              className="input-field"
              required
              minLength={6}
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={formLoading}
              className="btn-primary flex items-center justify-center gap-2 px-8"
            >
              {formLoading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
              Create Admin User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
