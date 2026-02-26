"use client";
import { useState, FormEvent, useEffect } from "react";
import { useRef } from "react";
import { Search, Loader2, CheckCircle, XCircle, ExternalLink, FileText, Upload } from "lucide-react";
import { verifyCertificate, getCertificateByStudent } from "@/utils/api";
import type { VerifyResponse, CertificateRecord } from "@/utils/api";
import jsQR from "jsqr";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";

export default function VerifyCertificate() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hashInput, setHashInput] = useState("");
  const [studentInput, setStudentInput] = useState("");
  const [mode, setMode] = useState<"hash" | "student">("hash");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [studentResults, setStudentResults] = useState<CertificateRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  // PDF Generation State
  const [selectedCert, setSelectedCert] = useState<CertificateRecord | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-verify if hash present in URL
    const params = new URLSearchParams(window.location.search);
    const hashParam = params.get("hash");
    if (hashParam) {
      verifyHash(hashParam);
    }
  }, []);

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

  const handleHashVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!hashInput.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await verifyCertificate(hashInput.trim());
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Verification failed.");
    }
    setLoading(false);
  };

  const handleStudentSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!studentInput.trim()) return;
    setLoading(true);
    setStudentResults([]);
    setError(null);
    try {
      const res = await getCertificateByStudent(studentInput.trim());
      setStudentResults(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Search failed.");
    }
    setLoading(false);
  };

  const verifyHash = async (hash: string) => {
    setHashInput(hash);
    setMode("hash");
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await verifyCertificate(hash);
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Verification failed.");
    }
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          let hash = code.data;
          try {
            const data = JSON.parse(code.data);
            if (data.hash) hash = data.hash;
          } catch (e) {
            // Ignore, use raw string
          }
          verifyHash(hash);
        } else {
          setError("No QR code found in image.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-emerald-500/10">
          <Search size={28} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Verify Certificate</h2>
          <p className="text-gray-400 text-sm">Enter a certificate hash or student ID to check its blockchain status.</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 bg-white/[.04] rounded-xl p-1">
        <button
          onClick={() => { setMode("hash"); setResult(null); setStudentResults([]); setError(null); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "hash" ? "bg-primary-600 text-white shadow" : "text-gray-400 hover:text-white"}`}
        >
          By Certificate Hash
        </button>
        <button
          onClick={() => { setMode("student"); setResult(null); setStudentResults([]); setError(null); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "student" ? "bg-primary-600 text-white shadow" : "text-gray-400 hover:text-white"}`}
        >
          By Student ID
        </button>
      </div>

      {/* Form */}
      <form onSubmit={mode === "hash" ? handleHashVerify : handleStudentSearch} className="glass-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            {mode === "hash" ? "Certificate Hash" : "Student ID"}
          </label>
          <input
            type="text"
            value={mode === "hash" ? hashInput : studentInput}
            onChange={(e) => mode === "hash" ? setHashInput(e.target.value) : setStudentInput(e.target.value)}
            placeholder={mode === "hash" ? "0x abc123…" : "STU-2024-001"}
            className="input-field font-mono text-sm"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying…</> : "Verify"}
        </button>

        {mode === "hash" && (
          <div className="pt-2 border-t border-white/10">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
            >
              <Upload size={16} /> Upload QR Code Image
            </button>
          </div>
        )}
      </form>

      {/* Error */}
      {
        error && (
          <div className="glass-card p-4 border-red-500/20 bg-red-500/[.04]">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )
      }

      {/* Result — hash mode */}
      {
        result && mode === "hash" && (
          <div className={`glass-card p-6 space-y-4 border-${result.isValid ? "emerald" : "red"}-500/20 bg-${result.isValid ? "emerald" : "red"}-500/[.04]`}>
            <div className="flex items-center gap-3">
              {result.isValid ? (
                <CheckCircle size={28} className="text-emerald-400" />
              ) : (
                <XCircle size={28} className="text-red-400" />
              )}
              <h3 className={`text-lg font-bold ${result.isValid ? "text-emerald-400" : "text-red-400"}`}>
                {result.isValid ? "Certificate is VALID" : "Certificate is INVALID / Revoked"}
              </h3>
            </div>

            {/* Certificate Card to be captured */}
            <div id="certificate-card">
              {result.certificate && <CertCard cert={result.certificate} />}
            </div>

            <p className="text-gray-400 text-sm">{result.message}</p>

            {/* Download Button */}
            {result.isValid && result.certificate && (
              <button
                onClick={() => setSelectedCert(result.certificate!)}
                disabled={isGeneratingPdf}
                className="btn-secondary w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {isGeneratingPdf && selectedCert?.certificateHash === result.certificate.certificateHash ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <FileText size={18} />
                )}
                Download PDF
              </button>
            )}
          </div>
        )
      }

      {/* Result — student mode */}
      {
        studentResults.length > 0 && mode === "student" && (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">{studentResults.length} certificate(s) found.</p>
            {studentResults.map((c) => (
              <div key={c.certificateHash} className="glass-card p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className={c.isValid ? "badge-valid" : "badge-invalid"}>
                    {c.isValid ? "✓ Valid" : "✕ Revoked"}
                  </span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${c.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 text-xs hover:underline flex items-center gap-1"
                  >
                    <ExternalLink size={12} /> Etherscan
                  </a>
                </div>
                <div id={`cert-${c.certificateHash}`}>
                  <CertCard cert={c} />
                </div>
                {/* Download Button for list items */}
                {c.isValid && (
                  <button
                    onClick={() => setSelectedCert(c)}
                    disabled={isGeneratingPdf}
                    className="text-gray-400 hover:text-white text-xs flex items-center gap-1 mt-2 disabled:opacity-50"
                  >
                    {isGeneratingPdf && selectedCert?.certificateHash === c.certificateHash ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <FileText size={12} />
                    )}
                    Download PDF
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      }

      {
        studentResults.length === 0 && !loading && studentInput && mode === "student" && !error && (
          <div className="glass-card p-6 text-center text-gray-400">No certificates found for this student ID.</div>
        )
      }

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
                  <div className="w-full flex justify-between items-end mt-auto px-12 pt-8 border-t border-gray-100">
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
    </div >

  );
}

function CertCard({ cert }: { cert: CertificateRecord }) {
  return (
    <div className="bg-white/[.03] rounded-xl p-4 space-y-2">
      <Row label="Student" value={`${cert.studentName} · ${cert.studentId}`} />
      <Row label="Course" value={cert.courseName} />
      <Row label="Institution" value={cert.institutionName} />
      <Row label="Grade" value={cert.grade || "N/A"} />
      <Row label="Issued" value={cert.issuanceDate} />
      {cert.expiryDate && <Row label="Expires" value={cert.expiryDate} />}
      <Row label="Cert Hash" value={cert.certificateHash} mono />
      <Row label="Tx Hash" value={cert.txHash} mono />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
      <span className="text-gray-500 text-xs uppercase tracking-wide">{label}</span>
      <span className={`text-gray-300 text-sm ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</span>
    </div>
  );
}
