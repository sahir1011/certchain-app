"use client";
import { useState, FormEvent, useRef } from "react";
import { FileText, Loader2, CheckCircle, ExternalLink, AlertCircle, Download, Upload, LayoutTemplate, Image as ImageIcon, X, Move } from "lucide-react";
import { useWallet } from "@/utils/walletContext";
import { issueCertificate } from "@/utils/api";
import type { CertificateRecord } from "@/utils/api";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { motion } from "framer-motion";

export default function IssueCertificate() {
  const { isConnected, account, isCorrectNetwork } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<CertificateRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"standard" | "custom" | "bulk">("standard");
  const [customTemplate, setCustomTemplate] = useState<string | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  // Default positions for custom template placeholders
  const [positions, setPositions] = useState({
    studentName: { x: 0, y: -50 },
    courseName: { x: 0, y: 50 },
    details: { x: 0, y: 150 },
    issuanceDate: { x: -200, y: 200 },
    institutionName: { x: 200, y: 200 },
  });

  const [form, setForm] = useState({
    studentName: "",
    studentId: "",
    courseName: "",
    institutionName: "",
    issuanceDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    grade: "",
    studentEmail: "",

  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCustomTemplate(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeTemplate = () => {
    setCustomTemplate(null);
  };

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;
    try {
      const canvas = await html2canvas(certificateRef.current, {
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
      pdf.save(`certificate-${form.studentId || "preview"}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      setError("Failed to generate certificate PDF.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isConnected || !account) {
      setError("Please connect your MetaMask wallet first.");
      return;
    }
    if (!isCorrectNetwork) {
      setError("Please switch to the Sepolia test network.");
      return;
    }
    setLoading(true);
    try {
      // 1. Capture Certificate as Image Blob
      let imageBlob: Blob | null = null;
      if (certificateRef.current) {
        const canvas = await html2canvas(certificateRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff"
        });
        imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      }

      // 2. Prepare FormData
      const formData = new FormData();
      formData.append("studentName", form.studentName);
      formData.append("studentId", form.studentId);
      formData.append("courseName", form.courseName);
      formData.append("institutionName", form.institutionName);
      formData.append("issuanceDate", form.issuanceDate);
      formData.append("expiryDate", form.expiryDate);
      formData.append("grade", form.grade);
      formData.append("studentEmail", form.studentEmail);
      formData.append("issuerAddress", account); // Will be verified on backend too/used for metadata

      if (imageBlob) {
        formData.append("image", imageBlob, "certificate.png");
      }

      // 3. Send to Backend
      const cert = await issueCertificate(formData);
      setIssued(cert);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to issue certificate.");
    }
    setLoading(false);
  };

  const reset = () => {
    setIssued(null);
    setForm({
      studentName: "",
      studentId: "",
      courseName: "",
      institutionName: "",
      issuanceDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      grade: "",
      studentEmail: "",

    });
    setCustomTemplate(null);
    setActiveTab("standard");
  };

  // ── Success receipt ──
  if (issued) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle size={48} className="text-emerald-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Certificate Issued Successfully</h2>
          <p className="text-gray-400">The certificate has been stored on the Ethereum Sepolia blockchain.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Transaction Details</h3>
              <div className="bg-white/[.04] rounded-xl p-5 space-y-3">
                <Row label="Certificate Hash" value={issued.certificateHash} mono />
                <Row label="Transaction Hash" value={issued.txHash} mono />
                <Row label="Block Number" value={String(issued.blockNumber)} />
                <Row label="Student ID" value={issued.studentId} />
                <Row label="Course" value={issued.courseName} />
                {issued.imageIpfsHash && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-gray-500 text-sm">IPFS Image</span>
                    <a href={`https://gateway.pinata.cloud/ipfs/${issued.imageIpfsHash}`} target="_blank" rel="noopener noreferrer" className="text-primary-400 text-xs hover:underline flex items-center gap-1">
                      View on IPFS <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <a
                  href={`https://sepolia.etherscan.io/tx/${issued.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} /> Etherscan
                </a>
                <button onClick={reset} className="btn-primary flex-1">Issue Another</button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4 bg-white/[.02] rounded-xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white w-full text-center border-b border-white/10 pb-2 mb-2">QR Verification</h3>
              <div className="bg-white p-4 rounded-xl">
                <QRCodeCanvas
                  id="cert-qr"
                  value={JSON.stringify({ hash: issued.certificateHash })}
                  size={180}
                  level={"H"}
                  includeMargin={true}
                />
              </div>
              <button
                onClick={() => {
                  const canvas = document.getElementById("cert-qr") as HTMLCanvasElement;
                  if (canvas) {
                    const pngUrl = canvas.toDataURL("image/png");
                    const downloadLink = document.createElement("a");
                    downloadLink.href = pngUrl;
                    downloadLink.download = `qr-${issued.studentId}.png`;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                  }
                }}
                className="btn-secondary text-sm flex items-center gap-2 w-full justify-center"
              >
                <Download size={16} /> Download QR Code
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main UI ──
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary-500/10">
            <FileText size={28} className="text-primary-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Issue Certificate</h2>
            <p className="text-gray-400 text-sm">Fill details and generate certificate.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/5 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("standard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "standard" ? "bg-primary-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
          >
            <LayoutTemplate size={16} /> Standard Template
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "custom" ? "bg-primary-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
          >
            <ImageIcon size={16} /> Custom Template
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "bulk" ? "bg-primary-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
          >
            <Upload size={16} /> Bulk Issue
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Bulk Issue Implementation */}
        {activeTab === "bulk" ? (
          <BulkIssueModule
            isConnected={isConnected}
            isCorrectNetwork={isCorrectNetwork}
            account={account}
            certificateRef={certificateRef}
            setForm={setForm}
          />
        ) : (
          <>
            {/* Left Column: Form */}
            <div className="lg:col-span-4 space-y-6">
              {/* Warning if not connected */}
              {(!isConnected || !isCorrectNetwork) && (
                <div className="glass-card p-4 flex items-center gap-3 border-amber-500/20 bg-amber-500/[.04]">
                  <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
                  <p className="text-amber-300 text-sm">
                    {!isConnected ? "Connect wallet to issue." : "Switch to Sepolia testnet."}
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="glass-card p-4 flex items-center gap-3 border-red-500/20 bg-red-500/[.04]">
                  <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
                <h3 className="text-lg font-medium text-white mb-4">Certificate Details</h3>
                <Field label="Student Name *" name="studentName" value={form.studentName} onChange={handleChange} placeholder="John Doe" required />
                <Field label="Student ID *" name="studentId" value={form.studentId} onChange={handleChange} placeholder="STU-2024-001" required />

                <Field label="Student Email (Optional)" name="studentEmail" type="email" value={form.studentEmail} onChange={handleChange} placeholder="student@example.com" />

                <Field label="Course Name *" name="courseName" value={form.courseName} onChange={handleChange} placeholder="B.Tech Computer Science" required />
                <Field label="Institution *" name="institutionName" value={form.institutionName} onChange={handleChange} placeholder="MIT" required />
                <Field label="Issuance Date *" name="issuanceDate" type="date" value={form.issuanceDate} onChange={handleChange} required />

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Grade</label>
                  <select name="grade" value={form.grade} onChange={handleChange} className="input-field bg-white/[.05]">
                    <option value="" className="bg-blockchain-card">Select grade…</option>
                    {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F", "Pass", "Honors"].map((g) => (
                      <option key={g} value={g} className="bg-blockchain-card">{g}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Template Upload */}
                {activeTab === "custom" && !customTemplate && (
                  <div className="pt-2 border-t border-white/10 mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Upload Template Info</label>
                    <label className="flex items-center justify-center p-4 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-white/5 transition-all group">
                      <input type="file" accept="image/*" onChange={handleTemplateUpload} className="hidden" />
                      <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-primary-400">
                        <Upload size={24} />
                        <span className="text-xs">Click to upload background image</span>
                      </div>
                    </label>
                  </div>
                )}
                {activeTab === "custom" && customTemplate && (
                  <div className="pt-2 border-t border-white/10 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300">Template Active</span>
                      <button type="button" onClick={removeTemplate} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1">
                        <X size={14} /> Remove
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Move size={12} /> Drag text on preview to position.</p>
                  </div>
                )}

                <div className="pt-4 space-y-3">
                  <button type="button" onClick={downloadCertificate} className="btn-secondary w-full flex items-center justify-center gap-2">
                    <Download size={18} /> Download Preview PDF
                  </button>
                  <button type="submit" disabled={loading || !isConnected} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Issuing on Blockchain…</> : "Issue Certificate"}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Right Column: Preview */}
        {/* Hide preview column mostly when in bulk mode, OR show it for the processing step */}
        <div className={`lg:col-span-8 ${activeTab === "bulk" ? "opacity-50 pointer-events-none absolute -z-10 h-0 w-0 overflow-hidden" : ""}`}>
          <div className="glass-card p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Live Preview</h3>
              <span className="text-xs text-gray-500 uppercase tracking-widest">{activeTab} Mode</span>
            </div>

            <div className="flex-1 bg-gray-900/50 rounded-xl border border-white/10 p-4 overflow-auto flex items-center justify-center min-h-[500px]">
              {/* Certificate Container */}
              <div
                ref={certificateRef}
                id="certificate-preview"
                className="relative bg-white text-black shadow-2xl mx-auto overflow-hidden"
                style={{
                  width: "800px",
                  height: "600px",
                  flexShrink: 0,
                  transform: "scale(1)",
                  transformOrigin: "top center",
                  fontFamily: "'Times New Roman', serif"
                }}
              >
                {activeTab === "standard" || activeTab === "bulk" ? ( // Use standard template for bulk too
                  // Standard Template
                  <div className="w-full h-full p-8 border-[16px] border-double border-gray-200 relative bg-white">
                    <div className="w-full h-full border-2 border-gray-800 p-6 flex flex-col justify-between items-center relative overflow-hidden">
                      {/* Watermark-like background */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0">
                        <span className="text-[150px] font-bold rotate-[-15deg]">CERTIFIED</span>
                      </div>

                      {/* Content Container - Flex Column */}
                      <div className="flex flex-col items-center justify-center w-full h-full z-10 space-y-2">

                        {/* Top: Institution */}
                        <div className="text-center mt-4">
                          <div className="flex justify-center mb-2">
                            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg border-4 border-double border-gray-100">
                              {form.institutionName ? form.institutionName.charAt(0) : "U"}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-[0.2em] mb-1">{form.institutionName || "INSTITUTION NAME"}</h2>
                            <h1 className="text-3xl font-black uppercase tracking-widest text-primary-900 font-serif border-b-2 border-gray-200 pb-2 px-8 inline-block">
                              Certificate of Completion
                            </h1>
                          </div>
                        </div>

                        {/* Middle: Student Details */}
                        <div className="text-center space-y-2 py-2 w-full flex-1 flex flex-col justify-center">
                          <p className="text-lg text-gray-500 italic font-serif">This is to certify that</p>

                          <div className="py-1">
                            <h3 className="text-5xl font-script text-primary-700 leading-normal px-8 min-w-[500px]">
                              {form.studentName || "Student Name"}
                            </h3>
                          </div>

                          <p className="text-lg text-gray-500 italic font-serif">has successfully completed the course</p>

                          <div className="py-1">
                            <h4 className="text-2xl font-bold text-gray-900 border-b border-gray-300 inline-block px-12 pb-1">
                              {form.courseName || "Course Name"}
                            </h4>
                          </div>

                          {form.grade && (
                            <p className="text-base text-gray-600 mt-1">
                              with a grade of <span className="font-bold text-gray-900 text-lg">{form.grade}</span>
                            </p>
                          )}
                        </div>

                        {/* Bottom: Signature & Date */}
                        <div className="w-full flex justify-between items-end px-8 pb-4 border-t border-gray-100 w-full pt-4">
                          <div className="text-center">
                            <p className="font-bold text-base text-gray-900">{form.issuanceDate}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Date Issued</p>
                          </div>

                          <div className="text-center px-4 opacity-70">
                            <p className="text-[8px] text-gray-400 font-mono">ID: 0x... (Generated on Issue)</p>
                          </div>

                          <div className="text-center">
                            <div className="font-script text-2xl text-gray-800 mb-1">Administrator</div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest border-t border-gray-400 pt-1 px-4">Signature</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                ) : (
                  // Custom Template
                  <div className="w-full h-full relative bg-gray-100 flex items-center justify-center overflow-hidden group/canvas">
                    {customTemplate ? (
                      <>
                        <img src={customTemplate} alt="Certificate Template" className="w-full h-full object-cover absolute inset-0 pointer-events-none" />

                        {/* Draggable Placeholders */}
                        <div className="absolute inset-0 z-10">
                          <motion.div
                            drag
                            dragMomentum={false}
                            whileHover={{ scale: 1.02 }}
                            whileDrag={{ scale: 1.05 }}
                            className="absolute cursor-move hover:outline hover:outline-2 hover:outline-primary-500 hover:outline-dashed p-2 rounded"
                            style={{ x: 0, y: -50, left: "50%", top: "50%", translateX: "-50%", translateY: "-50%" }}
                          >
                            <h2 className="text-4xl font-bold text-center whitespace-nowrap text-black">{form.studentName || "Student Name"}</h2>
                          </motion.div>

                          <motion.div
                            drag
                            dragMomentum={false}
                            whileHover={{ scale: 1.02 }}
                            whileDrag={{ scale: 1.05 }}
                            className="absolute cursor-move hover:outline hover:outline-2 hover:outline-primary-500 hover:outline-dashed p-2 rounded"
                            style={{ x: 0, y: 50, left: "50%", top: "50%", translateX: "-50%", translateY: "-50%" }}
                          >
                            <h3 className="text-2xl text-center whitespace-nowrap text-black">{form.courseName || "Course Name"}</h3>
                          </motion.div>

                          <motion.div
                            drag
                            dragMomentum={false}
                            whileHover={{ scale: 1.02 }}
                            whileDrag={{ scale: 1.05 }}
                            className="absolute cursor-move hover:outline hover:outline-2 hover:outline-primary-500 hover:outline-dashed p-2 rounded"
                            style={{ x: -200, y: 200, left: "50%", top: "50%", translateX: "-50%", translateY: "-50%" }}
                          >
                            <p className="text-lg whitespace-nowrap text-black">{form.issuanceDate || "Date"}</p>
                          </motion.div>

                          <motion.div
                            drag
                            dragMomentum={false}
                            whileHover={{ scale: 1.02 }}
                            whileDrag={{ scale: 1.05 }}
                            className="absolute cursor-move hover:outline hover:outline-2 hover:outline-primary-500 hover:outline-dashed p-2 rounded"
                            style={{ x: 200, y: 200, left: "50%", top: "50%", translateX: "-50%", translateY: "-50%" }}
                          >
                            <p className="text-lg whitespace-nowrap text-black">{form.institutionName || "Institution"}</p>
                          </motion.div>
                        </div>

                        {/* Remove Button Overlay (visible on hover) */}
                        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover/canvas:opacity-100 transition-opacity">
                          <button
                            onClick={removeTemplate}
                            className="bg-black/50 hover:bg-red-500/80 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                            title="Remove Template"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-400 p-8 border-2 border-dashed border-gray-300 rounded-xl">
                        <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Upload a custom template image from the left panel.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <p className="text-center text-gray-500 text-xs mt-4">
              Preview generates a High Quality PDF. Ensure details are correct before issuing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bulk Issue Component ──
import Papa from "papaparse";

function BulkIssueModule({ isConnected, isCorrectNetwork, account, certificateRef, setForm }: any) {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          setCsvData(results.data);
          setLogs((prev) => [...prev, `Loaded ${results.data.length} records.`]);
        },
        error: (err: any) => {
          setLogs((prev) => [...prev, `Error parsing CSV: ${err.message}`]);
        }
      });
    }
  };

  const processBatch = async () => {
    if (!isConnected || !isCorrectNetwork) {
      alert("Please connect wallet and switch to Sepolia.");
      return;
    }

    setProcessing(true);
    setLogs([]);
    setProgress(0);

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const { StudentName, StudentID, Course, Institution, Grade, Email } = row;

      if (!StudentName || !StudentID || !Course || !Institution) {
        setLogs((prev) => [...prev, `⚠️ Skipping Row ${i + 1}: Missing fields.`]);
        continue;
      }

      setLogs((prev) => [...prev, `🔄 Processing: ${StudentName} (${StudentID})...`]);

      // 1. Update Form (Triggers React Render)
      setForm({
        studentName: StudentName,
        studentId: StudentID,
        courseName: Course,
        institutionName: Institution,
        issuanceDate: new Date().toISOString().split("T")[0],
        expiryDate: "",
        grade: Grade || "",
        studentEmail: Email || "",
      });

      // 2. Wait for Render
      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        // 3. Capture Image
        if (!certificateRef.current) throw new Error("Certificate preview not ready.");

        const canvas = await html2canvas(certificateRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff"
        });

        const imageBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));

        if (!imageBlob) throw new Error("Failed to generate image.");

        // 4. Submit to API
        const formData = new FormData();
        formData.append("studentName", StudentName);
        formData.append("studentId", StudentID);
        formData.append("courseName", Course);
        formData.append("institutionName", Institution);
        formData.append("issuanceDate", new Date().toISOString().split("T")[0]);
        formData.append("expiryDate", "");
        formData.append("grade", Grade || "");
        formData.append("studentEmail", Email || "");
        formData.append("issuerAddress", account);
        formData.append("image", imageBlob, "certificate.png");

        await issueCertificate(formData);

        setLogs((prev) => [...prev, `✅ Issued: ${StudentName}`]);
      } catch (err: any) {
        console.error(err);
        setLogs((prev) => [...prev, `❌ Failed: ${StudentName} - ${err.message || "Unknown error"}`]);
      }

      setProgress(((i + 1) / csvData.length) * 100);
    }

    setProcessing(false);
    setLogs((prev) => [...prev, "🎉 Batch processing complete."]);
  };

  return (
    <div className="lg:col-span-12 glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Bulk Issuance</h3>
        <a href="#" onClick={(e) => {
          e.preventDefault();
          const csvContent = "StudentName,StudentID,Course,Institution,Grade,Email\nAlice Smith,STU001,Math 101,MIT,A,alice@example.com\nBob Jones,STU002,Physics,Harvard,B+,bob@example.com";
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = "sample_students.csv";
          a.click();
        }} className="text-primary-400 text-sm hover:underline flex items-center gap-1">
          <Download size={14} /> Download Sample CSV
        </a>
      </div>

      {!csvData.length ? (
        <div className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center hover:bg-white/5 transition">
          <Upload size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-300">Drag and drop your CSV file here, or click to browse</p>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-500 file:text-white hover:file:bg-primary-600 mt-4 cursor-pointer" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-300">Loaded <strong>{csvData.length}</strong> records from CSV.</p>
            <button onClick={() => setCsvData([])} className="text-red-400 text-sm hover:underline" disabled={processing}>Clear / Upload New</button>
          </div>

          <div className="bg-black/20 rounded-lg p-4 max-h-[200px] overflow-y-auto">
            <table className="w-full text-left text-xs text-gray-400">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-2">Student Name</th>
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Course</th>
                  <th className="pb-2">Institution</th>
                  <th className="pb-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {csvData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="py-1">{row.StudentName}</td>
                    <td className="py-1">{row.StudentID}</td>
                    <td className="py-1">{row.Course}</td>
                    <td className="py-1">{row.Institution}</td>
                    <td className="py-1">{row.Email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>

          {logs.length > 0 && (
            <div className="bg-black/40 rounded-lg p-4 font-mono text-xs h-[150px] overflow-y-auto space-y-1">
              {logs.map((log, i) => (
                <div key={i} className={log.includes("❌") ? "text-red-400" : log.includes("✅") ? "text-green-400" : "text-gray-400"}>
                  {log}
                </div>
              ))}
            </div>
          )}

          <button onClick={processBatch} disabled={processing} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {processing ? <><Loader2 size={18} className="animate-spin" /> Processing Batch...</> : `Issue ${csvData.length} Certificates`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──
function Field({ label, name, value, onChange, placeholder, type = "text", required }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="input-field"
      />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className={`text-gray-200 text-sm ${mono ? "font-mono break-all text-xs" : ""}`}>{value}</span>
    </div>
  );
}
