"use client";
import { useState, useEffect } from "react";
import { registerAdmin, listCertificates, healthCheck } from "@/utils/api";
import type { CertificateRecord, HealthResponse } from "@/utils/api";
import { Shield, Users, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function AdminPanel() {
  const [certs, setCerts] = useState<CertificateRecord[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
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
      <div>
        <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
          <Shield size={20} className="text-primary-600" /> Platform Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5 border-t-2 border-primary-500">
            <div className="flex items-center gap-2 text-surface-500 mb-2 text-sm">
              <FileText size={16} /> Total Issued
            </div>
            <p className="text-3xl font-bold text-surface-900">{loading ? "..." : certs.length}</p>
          </div>
          <div className="card p-5 border-t-2 border-emerald-500">
            <div className="flex items-center gap-2 text-surface-500 mb-2 text-sm">
              <CheckCircle size={16} /> Valid Certificates
            </div>
            <p className="text-3xl font-bold text-surface-900">{loading ? "..." : validCount}</p>
          </div>
          <div className="card p-5 border-t-2 border-red-500">
            <div className="flex items-center gap-2 text-surface-500 mb-2 text-sm">
              <AlertCircle size={16} /> Revoked
            </div>
            <p className="text-3xl font-bold text-surface-900">{loading ? "..." : revokedCount}</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-surface-900 mb-1 flex items-center gap-2">
          <Users size={20} className="text-purple-600" /> Create Admin Account
        </h3>
        <p className="text-sm text-surface-500 mb-6">Create additional administrator accounts to manage the platform.</p>

        {message && (
          <div className={`p-3 mb-6 rounded-lg flex items-center gap-3 text-sm ${
            message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Username</label>
            <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Enter new admin username" className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter secure password" className="input-field" required minLength={6} />
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={formLoading} className="btn-primary flex items-center justify-center gap-2 px-6">
              {formLoading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
              Create Admin User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
