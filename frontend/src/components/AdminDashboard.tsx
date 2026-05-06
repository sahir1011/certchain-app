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
      <div className="flex bg-surface-100 p-1 rounded-lg w-fit mx-auto border border-surface-200">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "dashboard" ? "bg-white text-primary-700 shadow-sm" : "text-surface-500 hover:text-surface-800"
          }`}
        >
          <LayoutDashboard size={16} /> Admin Panel
        </button>
        <button
          onClick={() => setActiveTab("issue")}
          className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "issue" ? "bg-white text-primary-700 shadow-sm" : "text-surface-500 hover:text-surface-800"
          }`}
        >
          <PlusCircle size={16} /> Issue Certificate
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "history" ? "bg-white text-primary-700 shadow-sm" : "text-surface-500 hover:text-surface-800"
          }`}
        >
          <Clock size={16} /> Management / History
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "dashboard" && <AdminPanel />}
        {activeTab === "issue" && <IssueCertificate />}
        {activeTab === "history" && <History />}
      </div>
    </div>
  );
}
