"use client";
import { useState, useEffect, useRef } from "react";
import { FileText, ExternalLink, CheckCircle, XCircle, Loader2, Award, Calendar, Building, GraduationCap, LogOut, Download } from "lucide-react";
import { useStudent } from "@/utils/studentContext";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";

const BASE_URL = process.env.BACKEND_URL || "http://localhost:3001";

interface Certificate {
    certificateHash: string;
    studentName: string;
    studentId: string;
    courseName: string;
    institutionName: string;
    issuanceDate: string;
    expiryDate?: string;
    grade?: string;
    isValid: boolean;
    issuerAddress: string;
    txHash: string;
    blockNumber: number;
    timestamp: number;
}

export default function StudentDashboard() {
    const { studentId, logout } = useStudent();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // PDF Generation State
    const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const certificateRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (studentId) {
            fetchCertificates();
        }
    }, [studentId]);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            if (!studentId) {
                setError("Student ID not found");
                return;
            }
            const response = await axios.get(`${BASE_URL}/api/certificates/student/${studentId}`, {
                withCredentials: true,
            });
            setCertificates(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch certificates");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    // Handle PDF Download
    useEffect(() => {
        if (selectedCert && certificateRef.current) {
            const generatePDF = async () => {
                setIsGeneratingPdf(true);
                try {
                    // Small delay to ensure DOM is rendered
                    await new Promise(resolve => setTimeout(resolve, 500));

                    const canvas = await html2canvas(certificateRef.current!, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        backgroundColor: "#ffffff"
                    });

                    const imgData = canvas.toDataURL("image/png");
                    const pdf = new jsPDF({
                        orientation: "landscape",
                        unit: "mm",
                        format: "a4",
                    });

                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`certificate-${selectedCert.studentId}-${selectedCert.courseName}.pdf`);
                } catch (err) {
                    console.error("PDF Generation failed", err);
                    alert("Failed to generate PDF");
                } finally {
                    setIsGeneratingPdf(false);
                    setSelectedCert(null);
                }
            };

            generatePDF();
        }
    }, [selectedCert]);

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">My Certificates</h1>
                        <p className="text-gray-300">
                            Welcome back, <span className="font-semibold text-purple-400">{studentId}</span>
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center">
                        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <p className="text-red-200">{error}</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && certificates.length === 0 && (
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">No Certificates Found</h3>
                        <p className="text-gray-300">
                            You don't have any certificates yet. Contact your institution if you believe this is an error.
                        </p>
                    </div>
                )}

                {/* Certificates Grid */}
                {!loading && !error && certificates.length > 0 && (
                    <div className="grid gap-6">
                        {certificates.map((cert) => (
                            <div
                                key={cert.certificateHash}
                                className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:bg-white/15 transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                            <Award className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white mb-1">{cert.courseName}</h3>
                                            <p className="text-gray-300">{cert.studentName}</p>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${cert.isValid
                                        ? "bg-emerald-500/20 border border-emerald-500/50"
                                        : "bg-red-500/20 border border-red-500/50"
                                        }`}>
                                        {cert.isValid ? (
                                            <>
                                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                <span className="text-emerald-300 font-semibold text-sm">Valid</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4 text-red-400" />
                                                <span className="text-red-300 font-semibold text-sm">Revoked</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Certificate Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Building className="w-5 h-5 text-purple-400" />
                                        <div>
                                            <p className="text-xs text-gray-400">Institution</p>
                                            <p className="font-medium">{cert.institutionName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Calendar className="w-5 h-5 text-purple-400" />
                                        <div>
                                            <p className="text-xs text-gray-400">Issued On</p>
                                            <p className="font-medium">{new Date(cert.issuanceDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    {cert.grade && (
                                        <div className="flex items-center gap-3 text-gray-300">
                                            <GraduationCap className="w-5 h-5 text-purple-400" />
                                            <div>
                                                <p className="text-xs text-gray-400">Grade</p>
                                                <p className="font-medium">{cert.grade}</p>
                                            </div>
                                        </div>
                                    )}

                                    {cert.expiryDate && (
                                        <div className="flex items-center gap-3 text-gray-300">
                                            <Calendar className="w-5 h-5 text-purple-400" />
                                            <div>
                                                <p className="text-xs text-gray-400">Expires On</p>
                                                <p className="font-medium">{new Date(cert.expiryDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Certificate Hash */}
                                <div className="mb-4 p-3 bg-black/20 rounded-xl">
                                    <p className="text-xs text-gray-400 mb-1">Certificate Hash</p>
                                    <p className="text-sm text-gray-300 font-mono break-all">{cert.certificateHash}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSelectedCert(cert)}
                                        disabled={isGeneratingPdf}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded-xl text-emerald-300 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGeneratingPdf && selectedCert?.certificateHash === cert.certificateHash ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Download className="w-4 h-4" />
                                        )}
                                        Download PDF
                                    </button>
                                    <a
                                        href={`https://sepolia.etherscan.io/tx/${cert.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-xl text-purple-300 transition-all text-sm font-medium"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        View on Etherscan
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary */}
                {!loading && !error && certificates.length > 0 && (
                    <div className="mt-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div>
                                <p className="text-3xl font-bold text-white mb-1">{certificates.length}</p>
                                <p className="text-gray-300">Total Certificates</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-emerald-400 mb-1">
                                    {certificates.filter(c => c.isValid).length}
                                </p>
                                <p className="text-gray-300">Valid</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-red-400 mb-1">
                                    {certificates.filter(c => !c.isValid).length}
                                </p>
                                <p className="text-gray-300">Revoked</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden Certificate for PDF Generation */}
            {selectedCert && (
                <div style={{ position: "fixed", left: "-10000px", top: 0 }}>
                    <div
                        ref={certificateRef}
                        className="relative bg-white text-black shadow-2xl mx-auto overflow-hidden"
                        style={{
                            width: "800px",
                            height: "600px",
                            flexShrink: 0,
                            fontFamily: "'Times New Roman', serif"
                        }}
                    >
                        <div className="w-full h-full p-12 border-[20px] border-double border-gray-200 relative bg-white">
                            <div className="w-full h-full border-2 border-gray-800 p-8 flex flex-col justify-between items-center relative overflow-hidden">
                                {/* Watermark */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0">
                                    <span className="text-[150px] font-bold rotate-[-15deg]">CERTIFIED</span>
                                </div>

                                {/* Content Container - Flex Column */}
                                <div className="flex flex-col items-center justify-center w-full h-full z-10 space-y-6">

                                    {/* Top: Institution */}
                                    <div className="text-center">
                                        <div className="flex justify-center mb-4">
                                            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg border-4 border-double border-gray-100">
                                                {selectedCert.institutionName ? selectedCert.institutionName.charAt(0) : "U"}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-[0.2em] mb-2">{selectedCert.institutionName || "INSTITUTION NAME"}</h2>
                                            <h1 className="text-4xl font-black uppercase tracking-widest text-primary-900 font-serif border-b-2 border-gray-200 pb-4 px-8 inline-block">
                                                Certificate of Completion
                                            </h1>
                                        </div>
                                    </div>

                                    {/* Middle: Student Details */}
                                    <div className="text-center space-y-4 py-4 w-full">
                                        <p className="text-xl text-gray-500 italic font-serif">This is to certify that</p>

                                        <div className="py-2">
                                            <h3 className="text-6xl font-script text-primary-700 leading-normal px-8 min-w-[500px]">
                                                {selectedCert.studentName}
                                            </h3>
                                        </div>

                                        <p className="text-xl text-gray-500 italic font-serif">has successfully completed the course</p>

                                        <div className="py-2">
                                            <h4 className="text-3xl font-bold text-gray-900 border-b border-gray-300 inline-block px-12 pb-2">
                                                {selectedCert.courseName}
                                            </h4>
                                        </div>

                                        {selectedCert.grade && (
                                            <p className="text-lg text-gray-600 mt-2">
                                                with a grade of <span className="font-bold text-gray-900 text-xl">{selectedCert.grade}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Bottom: Signature & Date */}
                                    <div className="w-full flex justify-between items-end mt-auto px-12 pt-8 border-t border-gray-100 w-full">
                                        <div className="text-center">
                                            <p className="font-bold text-lg text-gray-900">{new Date(selectedCert.issuanceDate).toLocaleDateString()}</p>
                                            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Date Issued</p>
                                        </div>

                                        {/* QR Code on Certificate */}
                                        <div className="flex flex-col items-center opacity-80">
                                            <QRCodeCanvas
                                                value={JSON.stringify({ hash: selectedCert.certificateHash })}
                                                size={64}
                                                level={"M"}
                                            />
                                            <p className="text-[9px] text-gray-400 mt-1 font-mono">{selectedCert.certificateHash.substring(0, 10)}...</p>
                                        </div>

                                        <div className="text-center">
                                            <div className="font-script text-3xl text-gray-800 mb-1">Administrator</div>
                                            <p className="text-xs text-gray-500 uppercase tracking-widest border-t border-gray-400 pt-1 px-4">Signature</p>
                                        </div>
                                    </div>

                                    {/* Hash ID Display (Absolute for corner anchor) */}
                                    <div className="absolute left-4 bottom-1 text-[8px] text-gray-300 font-mono">
                                        ID: {selectedCert.certificateHash}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
