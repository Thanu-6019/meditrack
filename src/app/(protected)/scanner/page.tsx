"use client";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { currentUser } from "@/utils/mockData";

/* ─── Types ────────────────────────────────────────────────── */
type ScanStep = "idle" | "scanning" | "reviewing" | "success";

interface ParsedMedicine {
  name: string;
  dosage: string;
  frequency: string;
  prescriber: string;
  instructions: string;
  refillDate: string;
}

const EMPTY_PARSED: ParsedMedicine = {
  name: "",
  dosage: "",
  frequency: "",
  prescriber: "",
  instructions: "",
  refillDate: "",
};

/* ─── Helpers ──────────────────────────────────────────────── */
function extractField(text: string, patterns: RegExp[]): string {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1]?.trim() ?? m[0]?.trim() ?? "";
  }
  return "";
}

function parsePrescriptionText(raw: string): ParsedMedicine {
  const t = raw.replace(/\n+/g, " ");
  return {
    name: extractField(t, [
      /(?:drug|medication|medicine|rx|prescription)[:\s]+([A-Za-z][A-Za-z\s\-]+?)(?:\s+\d|\s+mg|\s+ml|,)/i,
      /\b([A-Z][a-z]{3,}(?:\s[A-Z][a-z]{2,})?)\s+(?:\d+\s*mg|\d+\s*ml)/,
    ]),
    dosage: extractField(t, [
      /(\d+\.?\d*\s*(?:mg|ml|mcg|g|iu|units?))/i,
      /dose[:\s]+([^\s,]+)/i,
    ]),
    frequency: extractField(t, [
      /(once|twice|three times?|four times?)\s+(?:a\s+)?(?:daily|day|week|month)/i,
      /(\d+\s*times?\s*(?:per|a|\/)\s*(?:day|week|month))/i,
      /(every\s+\d+\s+hours?)/i,
      /(?:sig|directions?)[:\s]+([^.]+)/i,
    ]),
    prescriber: extractField(t, [
      /(?:dr\.?|doctor|physician|prescribed by)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i,
      /(?:prescriber)[:\s]+([^\n,]+)/i,
    ]),
    instructions: extractField(t, [
      /(?:take|use|apply)\s+([^.]{10,60}[.]?)/i,
      /(?:sig|directions?)[:\s]+([^.]+\.)/i,
    ]),
    refillDate: extractField(t, [
      /refill(?:\s+(?:by|date|until))?[:\s]+(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})/i,
      /(?:expires?|expiry)[:\s]+(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})/i,
    ]),
  };
}

const FREQUENCY_OPTS = [
  { value: "once_daily", label: "Once daily" },
  { value: "twice_daily", label: "Twice daily" },
  { value: "three_times_daily", label: "Three times daily" },
  { value: "four_times_daily", label: "Four times daily" },
  { value: "every_other_day", label: "Every other day" },
  { value: "weekly", label: "Weekly" },
  { value: "as_needed", label: "As needed" },
];

const RECENT_SCANS = [
  { name: "Lisinopril 10mg", date: "Jun 7", confidence: 94, status: "added" },
  { name: "Metformin 500mg", date: "Jun 1", confidence: 89, status: "added" },
  { name: "Vitamin D3 2000IU", date: "May 28", confidence: 97, status: "added" },
];

/* ─── Component ─────────────────────────────────────────────── */
export default function ScannerPage() {
  const [step, setStep] = useState<ScanStep>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("Preparing OCR engine…");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedMedicine>(EMPTY_PARSED);
  const [confidence, setConfidence] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState<ParsedMedicine>(EMPTY_PARSED);
  const [activeTab, setActiveTab] = useState<"upload" | "camera">("upload");
  const [showRaw, setShowRaw] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<unknown>(null);

  const TIPS = [
    "Lay the prescription flat and ensure the text is fully visible",
    "Good lighting helps — avoid shadows across the label",
    "Photos taken in landscape mode scan more accurately",
    "Make sure the drug name, dosage, and sig lines are in frame",
  ];

  /* ── OCR via Tesseract.js ─────────────────────────────────── */
  const runOCR = useCallback(async (file: File) => {
    setStep("scanning");
    setProgress(0);
    setProgressMsg("Loading OCR engine…");

    try {
      const { createWorker } = await import("tesseract.js");

      const worker = await createWorker("eng", 1, {
        logger: (m: { status: string; progress?: number }) => {
          if (m.status === "loading tesseract core") {
            setProgressMsg("Loading OCR core…");
            setProgress(10);
          } else if (m.status === "initializing tesseract") {
            setProgressMsg("Initialising engine…");
            setProgress(25);
          } else if (m.status === "loading language traineddata") {
            setProgressMsg("Loading English language model…");
            setProgress(40);
          } else if (m.status === "initializing api") {
            setProgressMsg("Setting up recognition API…");
            setProgress(55);
          } else if (m.status === "recognizing text") {
            const pct = Math.round((m.progress ?? 0) * 100);
            setProgressMsg(`Recognising text… ${pct}%`);
            setProgress(55 + Math.round(pct * 0.4));
          }
        },
      });

      workerRef.current = worker;

      setProgressMsg("Analysing prescription…");
      setProgress(80);

      const { data } = await (worker as { recognize: (f: File) => Promise<{ data: { text: string; confidence: number } }> }).recognize(file);

      setProgressMsg("Extracting fields…");
      setProgress(95);

      const text = data.text;
      const conf = Math.round(data.confidence);
      const fields = parsePrescriptionText(text);

      setRawText(text);
      setConfidence(conf);
      setParsed(fields);
      setEditFields(fields);
      setProgress(100);

      await (worker as unknown as { terminate: () => Promise<void> }).terminate();

      setTimeout(() => {
        setStep("reviewing");
        setTipIdx(Math.floor(Math.random() * TIPS.length));
      }, 400);
    } catch {
      setStep("idle");
      setProgressMsg("OCR failed. Please try again.");
    }
  }, [TIPS]);

  /* ── File handling ────────────────────────────────────────── */
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    runOCR(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setStep("idle");
    setImagePreview(null);
    setRawText("");
    setParsed(EMPTY_PARSED);
    setEditFields(EMPTY_PARSED);
    setConfidence(0);
    setProgress(0);
    setEditMode(false);
    setShowRaw(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmAdd = () => {
    setStep("success");
  };

  const fieldChange = (k: keyof ParsedMedicine, v: string) => {
    setEditFields((f) => ({ ...f, [k]: v }));
  };

  /* ── Confidence badge ─────────────────────────────────────── */
  const confBadge = confidence >= 85
    ? { cls: "badge-green", label: `${confidence}% confident`, icon: "✓" }
    : confidence >= 60
    ? { cls: "badge-yellow", label: `${confidence}% — review carefully`, icon: "⚠" }
    : { cls: "badge-red", label: `${confidence}% — low quality`, icon: "✕" };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="app-main-inner">
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-date">
          <span className="live-dot" />
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <div className="topbar-actions">
          <Link href="/notifications">
            <button className="btn btn-ghost btn-icon" style={{ position: "relative" }}>
              🔔
              <span style={{
                position: "absolute", top: 5, right: 5,
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--danger)", border: "1.5px solid white",
              }} />
            </button>
          </Link>
          <Link href="/profile">
            <div className="avatar" style={{ width: 34, height: 34, cursor: "pointer", fontSize: 12 }}>
              {currentUser.initials}
            </div>
          </Link>
        </div>
      </div>

      {/* Page header */}
      <div className="page-hd anim-fade-up">
        <div>
          <h1 className="page-title">Prescription Scanner</h1>
          <p className="page-sub">
            Scan or photograph a prescription label to add a medicine automatically
          </p>
        </div>
        {step !== "idle" && step !== "scanning" && (
          <button className="btn btn-secondary" onClick={reset}>
            ↩ Scan another
          </button>
        )}
      </div>

      <div className="page-body" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── IDLE: Upload UI ───────────────────────────────────── */}
        {step === "idle" && (
          <div className="anim-fade-up d1" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>

            {/* Left: main upload */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, padding: "3px", background: "var(--n-100)", borderRadius: "var(--r-sm)", width: "fit-content" }}>
                {(["upload", "camera"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className="btn btn-sm"
                    style={{
                      background: activeTab === t ? "white" : "transparent",
                      color: activeTab === t ? "var(--n-900)" : "var(--n-500)",
                      boxShadow: activeTab === t ? "var(--shadow-xs)" : "none",
                      fontWeight: activeTab === t ? 700 : 500,
                      padding: "6px 16px",
                      transition: "all .2s",
                    }}
                  >
                    {t === "upload" ? "📁 Upload image" : "📷 Use camera"}
                  </button>
                ))}
              </div>

              {activeTab === "upload" ? (
                /* Drop zone */
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? "var(--brand-400)" : "var(--border)"}`,
                    borderRadius: "var(--r-lg)",
                    background: isDragging ? "var(--brand-50)" : "var(--surface-2)",
                    padding: "56px 40px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 14,
                    cursor: "pointer",
                    transition: "all .2s",
                  }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: 18,
                    background: isDragging ? "var(--brand-100)" : "var(--n-100)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 30, transition: "all .2s",
                  }}>
                    {isDragging ? "📥" : "🖼"}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "var(--n-800)", marginBottom: 4 }}>
                      {isDragging ? "Drop to scan" : "Drop prescription image here"}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--muted)" }}>
                      or click to browse · JPG, PNG, PDF supported
                    </p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    Choose file
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: "none" }}
                    onChange={onFileChange}
                  />
                </div>
              ) : (
                /* Camera placeholder */
                <div className="scanner-viewport" style={{ borderRadius: "var(--r-lg)", minHeight: 320 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                    <div className="scanner-crosshair">
                      <div className="scanner-line" />
                    </div>
                    <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13, textAlign: "center", maxWidth: 260 }}>
                      Camera access is required. Allow camera permission in your browser settings to use live scanning.
                    </p>
                    <button
                      className="btn btn-sm"
                      style={{ background: "rgba(255,255,255,.15)", color: "white", border: "1px solid rgba(255,255,255,.25)" }}
                      onClick={() => setActiveTab("upload")}
                    >
                      Use file upload instead
                    </button>
                  </div>
                </div>
              )}

              {/* Tips */}
              <div style={{
                padding: "14px 18px",
                background: "var(--brand-50)",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--brand-100)",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--brand-700)", marginBottom: 2 }}>
                    Scanning tip
                  </div>
                  <p style={{ fontSize: 13, color: "var(--brand-600)", lineHeight: 1.5, margin: 0 }}>
                    {TIPS[tipIdx]}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: recent scans + info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Stats */}
              <div className="card card-p">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--n-900)", marginBottom: 14 }}>
                  Scanner stats
                </h3>
                {[
                  { label: "Prescriptions scanned", value: "12", icon: "📋" },
                  { label: "Medicines added via scan", value: "11", icon: "💊" },
                  { label: "Avg. confidence", value: "93%", icon: "🎯" },
                ].map((s) => (
                  <div key={s.label} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <span style={{ flex: 1, fontSize: 13, color: "var(--n-700)" }}>{s.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)", fontFamily: "var(--font-display)" }}>
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Recent scans */}
              <div className="card card-p">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--n-900)", marginBottom: 14 }}>
                  Recent scans
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {RECENT_SCANS.map((s) => (
                    <div key={s.name} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 12px",
                      background: "var(--n-50)",
                      borderRadius: "var(--r-sm)",
                      border: "1px solid var(--border-subtle)",
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, background: "var(--success-bg)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
                      }}>💊</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--n-800)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{s.date} · {s.confidence}% confidence</div>
                      </div>
                      <span className="badge badge-green" style={{ fontSize: 10.5, flexShrink: 0 }}>✓ Added</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supported formats */}
              <div className="card card-p" style={{ background: "var(--n-50)" }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--n-600)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".07em" }}>
                  Supported formats
                </p>
                {[
                  ["JPG / PNG", "Camera photos, screenshots"],
                  ["PDF", "Digital prescriptions"],
                  ["WEBP / HEIC", "Modern phone formats"],
                ].map(([fmt, desc]) => (
                  <div key={fmt} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                    <span className="badge badge-brand" style={{ fontSize: 11, flexShrink: 0 }}>{fmt}</span>
                    <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SCANNING: Progress ────────────────────────────────── */}
        {step === "scanning" && (
          <div className="anim-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Image preview */}
              {imagePreview && (
                <div style={{
                  borderRadius: "var(--r-lg)",
                  overflow: "hidden",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--n-900)",
                  maxHeight: 340,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Prescription" style={{ maxWidth: "100%", maxHeight: 340, objectFit: "contain" }} />
                </div>
              )}

              {/* Progress card */}
              <div className="card card-p">
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "var(--brand-50)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22,
                    animation: "spin 2s linear infinite",
                  }}>
                    🔬
                  </div>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--n-900)" }}>
                      Reading prescription…
                    </div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                      {progressMsg}
                    </div>
                  </div>
                  <div style={{
                    marginLeft: "auto",
                    fontFamily: "var(--font-display)",
                    fontSize: 22,
                    color: "var(--brand-600)",
                    minWidth: 48,
                    textAlign: "right",
                  }}>
                    {progress}%
                  </div>
                </div>

                <div className="progress" style={{ height: 8 }}>
                  <div
                    className="progress-bar"
                    style={{
                      width: `${progress}%`,
                      background: "linear-gradient(90deg, var(--brand-400), var(--brand-600))",
                      transition: "width .4s ease",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                  {["Loading engine", "Preprocessing image", "Recognising text", "Extracting fields"].map((stage, i) => {
                    const done = progress >= [15, 50, 90, 98][i];
                    const active = progress >= [0, 15, 50, 90][i] && !done;
                    return (
                      <div key={stage} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "5px 11px",
                        borderRadius: "var(--r-full)",
                        background: done ? "var(--success-bg)" : active ? "var(--brand-50)" : "var(--n-100)",
                        border: `1px solid ${done ? "var(--success-border)" : active ? "var(--brand-200)" : "var(--border)"}`,
                        fontSize: 12,
                        fontWeight: done || active ? 600 : 400,
                        color: done ? "var(--success)" : active ? "var(--brand-600)" : "var(--n-400)",
                      }}>
                        {done ? "✓ " : active ? <span style={{ animation: "pulse-dot 1s infinite", display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--brand-500)", marginRight: 2 }} /> : ""}
                        {stage}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: tip panel */}
            <div className="card card-p" style={{ background: "linear-gradient(160deg, var(--brand-700), var(--brand-900))", border: "none" }}>
              <div style={{ color: "white" }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>🩺</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 10, lineHeight: 1.3 }}>
                  While we scan…
                </h3>
                <p style={{ fontSize: 13.5, opacity: .75, lineHeight: 1.7, marginBottom: 20 }}>
                  Our OCR engine reads every character on the label and maps it to the correct medicine field. Review the results before confirming.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {["Drug name & strength", "Dosage schedule (SIG)", "Prescribing doctor", "Refill date"].map((f) => (
                    <div key={f} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px",
                      background: "rgba(255,255,255,.08)",
                      borderRadius: "var(--r-sm)",
                      fontSize: 13, color: "rgba(255,255,255,.8)",
                    }}>
                      <span style={{ fontSize: 15 }}>→</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── REVIEWING: Parsed fields ──────────────────────────── */}
        {step === "reviewing" && (
          <div className="anim-fade-up" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>

            {/* Left: fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Header bar */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px",
                background: confidence >= 85 ? "var(--success-bg)" : confidence >= 60 ? "var(--warning-bg)" : "var(--danger-bg)",
                borderRadius: "var(--r-md)",
                border: `1px solid ${confidence >= 85 ? "var(--success-border)" : confidence >= 60 ? "var(--warning-border)" : "var(--danger-border)"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{confidence >= 85 ? "✅" : confidence >= 60 ? "⚠️" : "❌"}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--n-800)" }}>
                      Scan complete — {confBadge.label}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                      Review each field before adding to your medicines
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? "✓ Done editing" : "✏ Edit fields"}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 12 }}
                    onClick={() => setShowRaw(!showRaw)}
                  >
                    {showRaw ? "Hide" : "Show"} raw text
                  </button>
                </div>
              </div>

              {/* Fields card */}
              <div className="card card-p">
                <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--n-900)", marginBottom: 20 }}>
                  Extracted prescription data
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {(
                    [
                      { key: "name" as const, label: "Medicine name", icon: "💊", placeholder: "e.g. Lisinopril", required: true },
                      { key: "dosage" as const, label: "Dosage", icon: "⚖", placeholder: "e.g. 10 mg", required: true },
                      { key: "frequency" as const, label: "Frequency", icon: "🔁", placeholder: "e.g. Once daily", isSelect: true },
                      { key: "prescriber" as const, label: "Prescribing doctor", icon: "👨‍⚕️", placeholder: "e.g. Dr. Sarah Chen" },
                      { key: "instructions" as const, label: "Instructions (SIG)", icon: "📋", placeholder: "e.g. Take with food in the morning" },
                      { key: "refillDate" as const, label: "Refill date", icon: "📅", placeholder: "e.g. 07/20/2024" },
                    ] as Array<{
                      key: keyof ParsedMedicine;
                      label: string;
                      icon: string;
                      placeholder: string;
                      required?: boolean;
                      isSelect?: boolean;
                    }>
                  ).map(({ key, label, icon, placeholder, required, isSelect }) => {
                    const value = editMode ? editFields[key] : parsed[key];
                    const isEmpty = !value;

                    return (
                      <div key={key} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: isEmpty ? "var(--n-100)" : "var(--brand-50)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 17, flexShrink: 0, marginTop: 1,
                        }}>
                          {icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--n-500)", textTransform: "uppercase", letterSpacing: ".07em" }}>
                              {label}
                            </span>
                            {required && <span className="badge badge-brand" style={{ fontSize: 10 }}>Required</span>}
                            {isEmpty && !editMode && (
                              <span className="badge badge-yellow" style={{ fontSize: 10 }}>Not detected</span>
                            )}
                          </div>

                          {editMode ? (
                            isSelect ? (
                              <select
                                className="input"
                                value={editFields[key]}
                                onChange={(e) => fieldChange(key, e.target.value)}
                                style={{ fontSize: 14 }}
                              >
                                <option value="">Select frequency…</option>
                                {FREQUENCY_OPTS.map((o) => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                className="input"
                                value={editFields[key]}
                                onChange={(e) => fieldChange(key, e.target.value)}
                                placeholder={placeholder}
                                style={{ fontSize: 14 }}
                              />
                            )
                          ) : (
                            <div style={{
                              fontSize: 14.5,
                              fontWeight: isEmpty ? 400 : 600,
                              color: isEmpty ? "var(--n-400)" : "var(--n-800)",
                              padding: "8px 12px",
                              background: isEmpty ? "var(--n-50)" : "transparent",
                              borderRadius: isEmpty ? "var(--r-sm)" : 0,
                              fontStyle: isEmpty ? "italic" : "normal",
                              border: isEmpty ? "1px dashed var(--border)" : "none",
                            }}>
                              {isEmpty ? `${placeholder} — not detected` : value}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Raw text toggle */}
              {showRaw && (
                <div className="card card-p anim-fade-in">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--n-700)" }}>Raw OCR output</h4>
                    <span className={`badge ${confBadge.cls}`}>{confBadge.label}</span>
                  </div>
                  <pre style={{
                    fontSize: 12,
                    color: "var(--n-600)",
                    background: "var(--n-50)",
                    padding: "14px 16px",
                    borderRadius: "var(--r-sm)",
                    border: "1px solid var(--border-subtle)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    lineHeight: 1.6,
                    maxHeight: 220,
                    overflowY: "auto",
                    margin: 0,
                    fontFamily: "ui-monospace, monospace",
                  }}>
                    {rawText || "No text extracted."}
                  </pre>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-secondary" onClick={reset} style={{ flex: "0 0 auto" }}>
                  ↩ Rescan
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={confirmAdd}
                  disabled={!((editMode ? editFields : parsed).name)}
                >
                  ✓ Add to My Medicines
                </button>
              </div>
            </div>

            {/* Right: image + summary */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Image */}
              {imagePreview && (
                <div style={{
                  borderRadius: "var(--r-lg)",
                  overflow: "hidden",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "var(--shadow-md)",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Prescription" style={{ width: "100%", display: "block" }} />
                </div>
              )}

              {/* Confidence breakdown */}
              <div className="card card-p">
                <h4 style={{ fontSize: 13.5, fontWeight: 700, color: "var(--n-900)", marginBottom: 14 }}>
                  Detection summary
                </h4>
                {(["name", "dosage", "frequency", "prescriber", "instructions", "refillDate"] as const).map((k) => {
                  const v = parsed[k];
                  const label = { name: "Medicine name", dosage: "Dosage", frequency: "Frequency", prescriber: "Prescriber", instructions: "Instructions", refillDate: "Refill date" }[k];
                  return (
                    <div key={k} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "7px 0",
                      borderBottom: "1px solid var(--border-subtle)",
                      fontSize: 12.5,
                    }}>
                      <span style={{ color: "var(--n-600)" }}>{label}</span>
                      {v
                        ? <span className="badge badge-green" style={{ fontSize: 10.5 }}>✓ Found</span>
                        : <span className="badge badge-slate" style={{ fontSize: 10.5 }}>Not found</span>
                      }
                    </div>
                  );
                })}
              </div>

              {/* Privacy note */}
              <div style={{
                padding: "12px 14px",
                background: "var(--brand-50)",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--brand-100)",
                fontSize: 12.5,
                color: "var(--brand-700)",
                lineHeight: 1.55,
                display: "flex",
                gap: 10,
              }}>
                <span style={{ flexShrink: 0 }}>🔐</span>
                <span>Your scan is processed locally and never uploaded to our servers.</span>
              </div>
            </div>
          </div>
        )}

        {/* ── SUCCESS ────────────────────────────────────────────── */}
        {step === "success" && (
          <div className="anim-scale-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "40px 0" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "var(--success-bg)",
              border: "3px solid var(--success-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 38,
            }}>✅</div>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--n-900)", marginBottom: 8 }}>
                Medicine added successfully
              </h2>
              <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 400, lineHeight: 1.6 }}>
                <strong style={{ color: "var(--n-800)" }}>
                  {(editMode ? editFields : parsed).name || "Your medicine"}
                </strong>{" "}
                {(editMode ? editFields : parsed).dosage ? `(${(editMode ? editFields : parsed).dosage})` : ""} has been added to your medicine list.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-secondary" onClick={reset}>
                Scan another prescription
              </button>
              <Link href="/medicines">
                <button className="btn btn-primary">View my medicines →</button>
              </Link>
            </div>
            <div style={{
              padding: "20px 28px",
              background: "var(--n-50)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--border-subtle)",
              width: "100%",
              maxWidth: 480,
            }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--n-700)", marginBottom: 12 }}>What happens next</h4>
              {[
                "Your medicine is now tracked in your daily schedule",
                "You'll receive reminders at your scheduled dose times",
                "Adherence data will begin building from tomorrow",
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13.5, color: "var(--n-700)" }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "var(--brand-100)", color: "var(--brand-700)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}