"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@/utils/walletContext";
import { useAdmin } from "@/utils/adminContext";
import { useStudent } from "@/utils/studentContext";
import { Shield, Wallet, X, Menu, LogOut, UserCircle, GraduationCap } from "lucide-react";

export type Tab = "dashboard" | "issue" | "verify" | "admin" | "student";

interface NavbarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "admin", label: "Admin" },
  { id: "student", label: "Student" },
  { id: "verify", label: "Verify" },
];

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { account, connectWallet, disconnectWallet, isConnected } = useWallet();
  const { isAuthenticated: isAdminAuthenticated, username, logout: adminLogout } = useAdmin();
  const { isAuthenticated: isStudentAuthenticated, studentId, logout: studentLogout } = useStudent();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shortAddr = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "";

  const handleAdminLogout = async () => {
    await adminLogout();
    if (activeTab === "admin") {
      setActiveTab("dashboard");
    }
  };

  const handleStudentLogout = async () => {
    await studentLogout();
    if (activeTab === "student") {
      setActiveTab("dashboard");
    }
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-200 bg-[#1e293b] ${scrolled ? "shadow-lg" : ""
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-500 rounded-lg">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">CertChain</span>
              <p className="text-[10px] text-slate-400 -mt-0.5 tracking-wider uppercase">Blockchain Certificates</p>
            </div>
          </div>

          {/* Desktop tabs */}
          <div className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${activeTab === tab.id
                  ? "bg-white/15 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
              >
                {tab.label}
                {tab.id === "admin" && isAdminAuthenticated && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
                )}
                {tab.id === "student" && isStudentAuthenticated && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-500" />
                )}
              </button>
            ))}
          </div>

          {/* Wallet button + admin/student status + mobile menu toggle */}
          <div className="flex items-center gap-2">
            {/* Admin status */}
            {isAdminAuthenticated && (
              <div className="hidden sm:flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg px-3 py-1.5">
                <UserCircle size={14} className="text-emerald-400" />
                <span className="text-emerald-300 text-sm font-medium">{username}</span>
                <button
                  onClick={handleAdminLogout}
                  className="ml-1 text-emerald-400 hover:text-emerald-200 transition-colors"
                  title="Logout"
                >
                  <LogOut size={13} />
                </button>
              </div>
            )}

            {/* Student status */}
            {isStudentAuthenticated && (
              <div className="hidden sm:flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 rounded-lg px-3 py-1.5">
                <GraduationCap size={14} className="text-purple-400" />
                <span className="text-purple-300 text-sm font-medium">{studentId}</span>
                <button
                  onClick={handleStudentLogout}
                  className="ml-1 text-purple-400 hover:text-purple-200 transition-colors"
                  title="Logout"
                >
                  <LogOut size={13} />
                </button>
              </div>
            )}

            {/* Wallet */}
            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 bg-blue-500/15 border border-blue-500/30 rounded-lg px-3 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-blue-300 text-sm font-medium font-mono">{shortAddr}</span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="!px-2.5 !py-1.5 text-sm text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button onClick={connectWallet} className="bg-primary-500 hover:bg-primary-400 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors">
                <Wallet size={14} />
                Connect Wallet
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden text-slate-300 hover:text-white border border-white/20 rounded-lg px-2.5 py-1.5 hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#1e293b]">
          <div className="px-4 py-3 flex flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMenuOpen(false); }}
                className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                  ? "bg-white/15 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
