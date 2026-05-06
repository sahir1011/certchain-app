"use client";
import { useState, useEffect } from "react";
import { Shield, FileText, Search, Clock, TrendingUp, AlertCircle, Link } from "lucide-react";
import { useWallet } from "@/utils/walletContext";
import { healthCheck, listCertificates } from "@/utils/api";
import type { HealthResponse, CertificateRecord } from "@/utils/api";

type Tab = "dashboard" | "admin" | "verify" | "student";

interface DashboardProps {
  setActiveTab: (tab: Tab) => void;
}

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  sub?: string;
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
  const { isConnected, isCorrectNetwork } = useWallet();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [certs, setCerts] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [h, c] = await Promise.all([healthCheck(), listCertificates()]);
        setHealth(h);
        setCerts(c);
      } catch { }
      setLoading(false);
    };
    fetch();
  }, []);

  const validCount = certs.filter((c) => c.isValid).length;
  const revokedCount = certs.filter((c) => !c.isValid).length;

  const stats: StatCard[] = [
    {
      title: "Total Certificates",
      value: loading ? "…" : certs.length,
      icon: <FileText size={20} />,
      color: "text-primary-600",
      bgColor: "bg-primary-50",
      sub: "issued on-chain",
    },
    {
      title: "Valid Certificates",
      value: loading ? "…" : validCount,
      icon: <Shield size={20} />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      sub: "currently active",
    },
    {
      title: "Revoked",
      value: loading ? "…" : revokedCount,
      icon: <AlertCircle size={20} />,
      color: "text-red-600",
      bgColor: "bg-red-50",
      sub: "no longer valid",
    },
    {
      title: "Network Block",
      value: loading ? "…" : health?.blockNumber ?? "—",
      icon: <TrendingUp size={20} />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      sub: "latest Sepolia block",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center pt-4 pb-2">
        <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-surface-900">
          CertChain
        </h1>
        <p className="text-surface-500 text-lg max-w-2xl mx-auto">
          Issue, verify, and manage student certificates secured by Ethereum Sepolia blockchain.
          Tamper-proof. Instant. Decentralized.
        </p>
      </div>

      {/* Network banner */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* wallet status */}
        {!isConnected ? (
          <div className="flex-1 card p-4 flex items-center gap-3 border-amber-200 bg-amber-50">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
            <p className="text-amber-800 text-sm">Connect your MetaMask wallet for manual transactions, or log in as Admin to issue automatically.</p>
          </div>
        ) : !isCorrectNetwork ? (
          <div className="flex-1 card p-4 flex items-center gap-3 border-red-200 bg-red-50">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm">Wrong network detected. Please switch to Sepolia.</p>
          </div>
        ) : (
          <div className="flex-1 card p-4 flex items-center gap-3 border-emerald-200 bg-emerald-50">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
            <p className="text-emerald-800 text-sm">
              Wallet connected · Sepolia Testnet · Contract: <span className="font-mono text-xs">{health?.contractAddress ? `${health.contractAddress.slice(0, 8)}…` : "…"}</span>
            </p>
          </div>
        )}

        {/* Contract info */}
        <div className="card p-4 flex items-center gap-3 min-w-[220px]">
          <Link size={18} className="text-primary-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-surface-400 uppercase tracking-wide">Smart Contract</p>
            <p className="text-sm font-mono text-surface-700">{health?.contractAddress ? `${health.contractAddress.slice(0, 10)}…${health.contractAddress.slice(-4)}` : "Loading…"}</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.title} className="card-hover p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${s.bgColor} ${s.color}`}>
                {s.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-surface-900">{s.value}</p>
            <p className="text-sm font-medium text-surface-600 mt-0.5">{s.title}</p>
            <p className="text-xs text-surface-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab("admin")}
          className="card-hover p-6 text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition-colors">
              <FileText size={22} />
            </div>
          </div>
          <h3 className="text-base font-semibold text-surface-900">Issue Certificate</h3>
          <p className="text-sm text-surface-500 mt-1">Create and store a new student certificate on the blockchain.</p>
        </button>

        <button
          onClick={() => setActiveTab("verify")}
          className="card-hover p-6 text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <Search size={22} />
            </div>
          </div>
          <h3 className="text-base font-semibold text-surface-900">Verify Certificate</h3>
          <p className="text-sm text-surface-500 mt-1">Validate a certificate hash against the blockchain record.</p>
        </button>

        <button
          onClick={() => setActiveTab("admin")}
          className="card-hover p-6 text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
              <Clock size={22} />
            </div>
          </div>
          <h3 className="text-base font-semibold text-surface-900">Manage Certificates</h3>
          <p className="text-sm text-surface-500 mt-1">Browse and revoke issued certificates from the Admin dashboard.</p>
        </button>
      </div>
    </div>
  );
}
