"use client";
import { useState, useEffect, useMemo } from "react";
import { Clock, Loader2, ExternalLink, Search, Trash2, AlertCircle } from "lucide-react";
import { listCertificates, revokeCertificate } from "@/utils/api";
import { useWallet } from "@/utils/walletContext";
import { useAdmin } from "@/utils/adminContext";
import type { CertificateRecord } from "@/utils/api";

export default function History() {
  const { account } = useWallet();
  const { isAuthenticated: isAdminAuthenticated } = useAdmin();
  const [certs, setCerts] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCerts = async () => {
    setLoading(true);
    try {
      const data = await listCertificates();
      setCerts(data);
    } catch {
      setError("Failed to load certificates.");
    }
    setLoading(false);
  };

  useEffect(() => { fetchCerts(); }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return certs.filter(
      (c) =>
        c.studentName.toLowerCase().includes(q) ||
        c.studentId.toLowerCase().includes(q) ||
        c.courseName.toLowerCase().includes(q) ||
        c.institutionName.toLowerCase().includes(q) ||
        c.certificateHash.toLowerCase().includes(q)
    );
  }, [certs, searchTerm]);

  const handleRevoke = async (cert: CertificateRecord) => {
    if (!isAdminAuthenticated) return alert("Admin access required to revoke.");
    if (!confirm(`Revoke certificate for ${cert.studentName}? This cannot be undone.`)) return;
    setRevoking(cert.certificateHash);
    setError(null);
    try {
      await revokeCertificate(cert.certificateHash, account);
      await fetchCerts();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Revocation failed.");
    }
    setRevoking(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-purple-50">
          <Clock size={22} className="text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-surface-900">Certificate History</h2>
          <p className="text-surface-500 text-sm">All certificates issued on-chain. You can search and revoke here.</p>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, ID, course, institution, or hash…" className="input-field pl-10" />
      </div>

      {error && (
        <div className="p-3 flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-surface-500">No certificates found.</div>
      ) : (
        <>
          <div className="hidden lg:block card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-surface-500 uppercase text-xs tracking-wider bg-surface-50">
                  <th className="text-left p-4 font-semibold">Student</th>
                  <th className="text-left p-4 font-semibold">Course</th>
                  <th className="text-left p-4 font-semibold">Institution</th>
                  <th className="text-left p-4 font-semibold">Grade</th>
                  <th className="text-left p-4 font-semibold">Date</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.certificateHash} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                    <td className="p-4">
                      <p className="text-surface-900 font-medium">{c.studentName}</p>
                      <p className="text-surface-400 text-xs font-mono">{c.studentId}</p>
                    </td>
                    <td className="p-4 text-surface-700">{c.courseName}</td>
                    <td className="p-4 text-surface-700">{c.institutionName}</td>
                    <td className="p-4 text-surface-700">{c.grade || "—"}</td>
                    <td className="p-4 text-surface-500 text-xs">{c.issuanceDate}</td>
                    <td className="p-4">
                      <span className={c.isValid ? "badge-valid" : "badge-invalid"}>
                        {c.isValid ? "✓ Valid" : "✕ Revoked"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 justify-center">
                        <a href={`https://sepolia.etherscan.io/tx/${c.txHash}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 transition-colors">
                          <ExternalLink size={15} />
                        </a>
                        {c.isValid && isAdminAuthenticated && (
                          <button onClick={() => handleRevoke(c)} disabled={revoking === c.certificateHash} className="text-red-500 hover:text-red-600 transition-colors disabled:opacity-50">
                            {revoking === c.certificateHash ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-3">
            {filtered.map((c) => (
              <div key={c.certificateHash} className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-surface-900 font-medium">{c.studentName}</p>
                    <p className="text-surface-400 text-xs font-mono">{c.studentId}</p>
                  </div>
                  <span className={c.isValid ? "badge-valid" : "badge-invalid"}>
                    {c.isValid ? "✓ Valid" : "✕ Revoked"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-surface-400 text-xs">Course</p><p className="text-surface-700">{c.courseName}</p></div>
                  <div><p className="text-surface-400 text-xs">Grade</p><p className="text-surface-700">{c.grade || "—"}</p></div>
                  <div><p className="text-surface-400 text-xs">Institution</p><p className="text-surface-700">{c.institutionName}</p></div>
                  <div><p className="text-surface-400 text-xs">Date</p><p className="text-surface-700">{c.issuanceDate}</p></div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-surface-100">
                  <p className="text-surface-400 text-xs font-mono truncate mr-2">{c.certificateHash.slice(0, 20)}…</p>
                  <div className="flex gap-2">
                    <a href={`https://sepolia.etherscan.io/tx/${c.txHash}`} target="_blank" rel="noopener noreferrer" className="text-primary-600">
                      <ExternalLink size={15} />
                    </a>
                    {c.isValid && isAdminAuthenticated && (
                      <button onClick={() => handleRevoke(c)} disabled={revoking === c.certificateHash} className="text-red-500 disabled:opacity-50">
                        {revoking === c.certificateHash ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-surface-400 text-sm text-center">Showing {filtered.length} of {certs.length} certificates</p>
        </>
      )}
    </div>
  );
}
