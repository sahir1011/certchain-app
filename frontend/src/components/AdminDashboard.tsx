"use client";
import { useState } from "react";
import AdminPanel from "./AdminPanel";
import IssueCertificate from "./IssueCertificate";
import History from "./History";
import { PlusCircle, Clock, LayoutDashboard } from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "issue" | "history">("dashboard");

  return (
    <div className="space-y-6">
      {/* Sub-Navigation for Admin */}
      <div className="flex bg-white/5 p-1 rounded-xl w-fit mx-auto border border-white/10">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "dashboard" ? "bg-blue-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
          }`}
        >
          <LayoutDashboard size={18} /> Admin Panel
        </button>
        <button
          onClick={() => setActiveTab("issue")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "issue" ? "bg-primary-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
          }`}
        >
          <PlusCircle size={18} /> Issue Certificate
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "history" ? "bg-purple-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
          }`}
        >
          <Clock size={18} /> Management / History
        </button>
      </div>

      {/* Render the selected component */}
      <div className="mt-6">
        {activeTab === "dashboard" && <AdminPanel />}
        {activeTab === "issue" && <IssueCertificate />}
        {activeTab === "history" && <History />}
      </div>
    </div>
  );
}
