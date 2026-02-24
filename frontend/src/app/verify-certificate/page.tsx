"use client";
import React, { useState } from "react";
import Navbar, { Tab } from "@/components/Navbar";
import VerifyCertificate from "@/components/VerifyCertificate";
import Background from "@/components/Background";
import { WalletProvider } from "@/utils/walletContext";
import { AdminProvider } from "@/utils/adminContext";
import { StudentProvider } from "@/utils/studentContext";

export default function VerifyPage() {
    // We force the active tab to be "verify"
    // If the user clicks another tab, we redirect them to the home page
    const handleTabChange = (tab: Tab) => {
        if (tab !== "verify") {
            window.location.href = "/";
        }
    };

    return (
        <WalletProvider>
            <AdminProvider>
                <StudentProvider>
                    <div className="min-h-screen relative overflow-x-hidden">
                        <Background />
                        <div className="relative z-10">
                            <Navbar activeTab="verify" setActiveTab={handleTabChange} />
                            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                <VerifyCertificate />
                            </main>
                        </div>
                    </div>
                </StudentProvider>
            </AdminProvider>
        </WalletProvider>
    );
}
