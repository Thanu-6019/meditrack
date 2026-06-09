"use client";
import { useState } from "react";
import Link from "next/link";
import { healthMetrics, metricsHistory, currentUser } from "@/utils/mockData";

const metricCards = [
  {
    key: "heartRate",
    label: "Heart Rate",
    icon: "♥",
    iconBg: "#fff1f2",
    iconColor: "#e11d48",
    value: "72",
    unit: "bpm",
    status: "normal",
    ref: "60–100 bpm",
    trend: "+2 vs last week",
    trendDir: "neutral",
    history: [68, 70, 72, 69, 74, 71, 72],
  },
  {
    key: "bloodPressure",
    label: "Blood Pressure",
    icon: "🩺",
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
    value: "118/76",
    unit: "mmHg",
    status: "normal",
    ref: "<120/80 mmHg",
    trend: "Optimal",
    trendDir: "good",
    history: [122, 120, 119, 118, 121, 118, 118],
  },
  {
    key: "bloodGlucose",
    label: "Blood Glucose",
    icon: "🩸",
    iconBg: "#fffbeb",
    iconColor: "#d97706",
    value: "94",
    unit: "mg/dL",
    status: "normal",
    ref: "70–99 mg/dL",
    trend: "−3 vs yesterday",
    trendDir: "good",
    history: [99, 97, 95, 98, 94, 93, 94],
  },
  {
    key: "oxygenSat",
    label: "Oxygen Saturation",
    icon: "💨",
    iconBg: "#eff6ff",
    iconColor: "#2563eb",
    value: "98",
    unit: "%",
    status: "normal",
    ref: "95–100%",
    trend: "Stable",
    trendDir: "good",
    history: [97, 98, 98, 97, 99, 98, 98],
  },
  {
    key: "weight",
    label: "Weight",
    icon: "⚖",
    iconBg: "#f5f3ff",
    iconColor: "#7c3aed",
    value: "71.2",
    unit: "kg",
    status: "normal",
    ref: "68–78 kg",
    trend: "−0.3 kg this month",
    trendDir: "good",
    history: [72.1, 71.9, 71.8, 71.6, 71.5, 71.4, 71.2],
  },
  {
    key: "cholesterol",
    label: "Cholesterol",
    icon: "🧬",
    iconBg: "#fff7ed",
    iconColor: "#ea580c",
    value: "182",
    unit: "mg/dL",
    status: "normal",
    ref: "<200 mg/dL",
    trend: "−8 since last test",
    trendDir: "good",
    history: [198, 195, 190, 188, 185, 183, 182],
  },
  {
    key: "bmi",
    label: "BMI",
    icon: "📐",
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
    value: "22.4",
    unit: "kg/m²",
    status: "normal",
    ref: "18.5–24.9",
    trend: "Healthy range",
    trendDir: "good",
    history: [22.8, 22.7, 22.6, 22.6, 22.5, 22.5, 22.4],
  },
  {
    key: "hba1c",
    label: "HbA1c",
    icon: "🔬",
    iconBg: "#faf5ff",
    iconColor: "#7c3aed",
    value: "5.4",
    unit: "%",
    status: "normal",
    ref: "<5.7%",
    trend: "Stable",
    trendDir: "good",
    history: [5.6, 5.5, 5.5, 5.4, 5.4, 5.4, 5.4],
  },
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 32;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ overflow: "visible" }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <circle
        cx={(data.length - 1) * (w / (data.length - 1))}
        cy={h - ((data[data.length - 1] - min) / range) * (h - 4) - 2}
        r="3"
        fill={color}
      />
    </svg>
  );
}

type LogEntry = {
  date: string;
  hr: number;
  sbp: number;
  dbp: number;
  glucose: number;
  weight: number;
  o2: number;
};

const statusColor: Record<string, string> = {
  normal: "var(--success)",
  low: "var(--warning)",
  high: "var(--danger)",
};
const statusBg: Record<string, string> = {
  normal: "var(--success-bg)",
  low: "var(--warning-bg)",
  high: "var(--danger-bg)",
};

export default function HealthMetricsPage() {
  const [activeRange, setActiveRange] = useState("7D");
  const [showAddModal, setShowAddModal] = useState(false);

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
          <h1 className="page-title">Health Metrics</h1>
          <p className="page-sub">Monitor your vitals and track trends over time</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary">📤 Export Report</button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Log Reading
          </button>
        </div>
      </div>

      <div className="page-body" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Summary strip */}
        <div className="anim-fade-up d1" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {[
            { label: "Metrics tracked", value: "8", icon: "📊", bg: "var(--brand-50)", color: "var(--brand-600)" },
            { label: "All in normal range", value: "8/8", icon: "✅", bg: "var(--success-bg)", color: "var(--success)" },
            { label: "Last logged", value: "Today", icon: "🕐", bg: "var(--info-bg)", color: "var(--info)" },
            { label: "Health Score", value: `${currentUser.healthScore}`, icon: "⭐", bg: "var(--warning-bg)", color: "var(--warning)" },
          ].map((s) => (
            <div key={s.label} className="card card-p" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 26, lineHeight: 1, color: "var(--n-900)" }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Metric cards grid */}
        <div className="anim-fade-up d2">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)" }}>Latest Readings</h3>
            <div style={{ display: "flex", gap: 4 }}>
              {["7D", "30D", "90D"].map((r) => (
                <button
                  key={r}
                  onClick={() => setActiveRange(r)}
                  className={`btn btn-sm ${activeRange === r ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "4px 12px", fontSize: 12 }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {metricCards.map((m) => (
              <div key={m.key} className="card" style={{ padding: "18px 20px", cursor: "pointer", transition: "all .2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: m.iconBg,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                    {m.icon}
                  </div>
                  <span className="badge" style={{
                    background: statusBg[m.status], color: statusColor[m.status],
                    border: `1px solid ${statusColor[m.status]}30`, fontSize: 10.5, fontWeight: 700,
                  }}>
                    ● {m.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 1, color: "var(--n-900)" }}>
                    {m.value}
                    <span style={{ fontSize: 13, color: "var(--muted)", fontFamily: "var(--font-body)", fontWeight: 400, marginLeft: 4 }}>
                      {m.unit}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--n-700)", marginTop: 3 }}>{m.label}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>Ref: {m.ref}</div>
                </div>

                <Sparkline data={m.history} color={m.iconColor} />

                <div style={{ marginTop: 8, fontSize: 11.5, color: m.trendDir === "good" ? "var(--success)" : "var(--muted)", fontWeight: 600 }}>
                  {m.trendDir === "good" ? "↗ " : "→ "}{m.trend}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History chart */}
        <div className="anim-fade-up d3 card card-p">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)" }}>Trends Over Time</h3>
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>Heart rate & blood pressure — {activeRange} view</p>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { color: "var(--brand-500)", label: "Heart Rate", dashed: false },
                { color: "#7c3aed", label: "Systolic BP", dashed: true },
                { color: "#2563eb", label: "Blood Glucose", dashed: false },
              ].map(({ color, label, dashed }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{
                    width: 24, height: 2, borderRadius: 1,
                    borderTop: dashed ? `2px dashed ${color}` : "none",
                    background: dashed ? "none" : color,
                  }} />
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-line chart */}
          <div style={{ height: 200, position: "relative" }}>
            <svg viewBox="0 0 700 180" style={{ width: "100%", height: "100%" }}>
              <defs>
                <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-500)" stopOpacity=".15" />
                  <stop offset="100%" stopColor="var(--brand-500)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 36, 72, 108, 144].map((y) => (
                <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="var(--border)" strokeWidth=".7" />
              ))}
              {/* Y labels */}
              {[
                { y: 10, label: "130" },
                { y: 46, label: "100" },
                { y: 82, label: "80" },
                { y: 118, label: "70" },
                { y: 154, label: "60" },
              ].map(({ y, label }) => (
                <text key={y} x="0" y={y} fontSize="10" fill="var(--n-400)">{label}</text>
              ))}

              {/* X labels */}
              {metricsHistory.map((d, i) => (
                <text key={d.date} x={30 + i * 100} y="175" fontSize="10" fill="var(--n-400)" textAnchor="middle">
                  {d.date}
                </text>
              ))}

              {/* Heart Rate line */}
              <path
                d={`M ${metricsHistory.map((d, i) => `${30 + i * 100},${180 - ((d.hr - 60) / 40) * 140}`).join(" L ")}`}
                fill="none" stroke="var(--brand-500)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              />
              {metricsHistory.map((d, i) => (
                <circle key={i} cx={30 + i * 100} cy={180 - ((d.hr - 60) / 40) * 140}
                  r="4" fill="var(--brand-500)" stroke="white" strokeWidth="2" />
              ))}

              {/* Systolic BP line */}
              <path
                d={`M ${metricsHistory.map((d, i) => `${30 + i * 100},${180 - ((d.sbp - 100) / 40) * 140}`).join(" L ")}`}
                fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="5,3" strokeLinecap="round"
              />

              {/* Glucose line */}
              <path
                d={`M ${metricsHistory.map((d, i) => `${30 + i * 100},${180 - ((d.glucose - 80) / 30) * 100}`).join(" L ")}`}
                fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* History table */}
        <div className="anim-fade-up d4 card">
          <div style={{ padding: "18px 22px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)" }}>Measurement History</h3>
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>Complete log of all recorded readings</p>
            </div>
            <button className="btn btn-secondary btn-sm">Filter ▼</button>
          </div>
          <div className="tbl-wrap" style={{ borderRadius: 0, borderLeft: "none", borderRight: "none", borderBottom: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Heart Rate</th>
                  <th>Blood Pressure</th>
                  <th>Blood Glucose</th>
                  <th>Weight</th>
                  <th>O₂ Sat</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {metricsHistory.map((row) => (
                  <tr key={row.date}>
                    <td><span style={{ fontWeight: 600, color: "var(--n-800)" }}>{row.date}</span></td>
                    <td>{row.hr} bpm</td>
                    <td>{row.sbp}/{row.dbp} mmHg</td>
                    <td>{row.glucose} mg/dL</td>
                    <td>{row.weight} kg</td>
                    <td>{row.o2}%</td>
                    <td><span className="badge badge-green">Normal</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, padding: "4px 8px" }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reference ranges */}
        <div className="anim-fade-up d5 card card-p">
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)", marginBottom: 4 }}>Reference Ranges</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>Normal values for your age group (36–45)</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {metricCards.map((m) => {
              const pct = m.key === "heartRate" ? ((72 - 60) / 40) * 100
                : m.key === "bloodGlucose" ? ((94 - 70) / 30) * 100
                : m.key === "oxygenSat" ? ((98 - 95) / 5) * 100
                : 65;
              return (
                <div key={m.key} style={{ padding: "12px 14px", background: "var(--n-50)", borderRadius: "var(--r-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 16 }}>{m.icon}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--n-700)" }}>{m.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Range: {m.ref}</div>
                  <div className="progress" style={{ height: 6 }}>
                    <div className="progress-bar" style={{ width: `${Math.min(pct, 100)}%`, background: "var(--success)" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--success)", fontWeight: 600, marginTop: 5 }}>● In normal range</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Reading Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 20,
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: "white", borderRadius: "var(--r-xl)", padding: "32px", width: "100%", maxWidth: 480,
            boxShadow: "var(--shadow-xl)",
          }} onClick={(e) => e.stopPropagation()} className="anim-scale-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--n-900)" }}>Log a Reading</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="field">
                <label className="field-label">Metric Type</label>
                <select className="input">
                  <option>Heart Rate</option>
                  <option>Blood Pressure</option>
                  <option>Blood Glucose</option>
                  <option>Oxygen Saturation</option>
                  <option>Weight</option>
                  <option>Cholesterol</option>
                  <option>BMI</option>
                  <option>HbA1c</option>
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label className="field-label">Value</label>
                  <input type="number" className="input" placeholder="72" />
                </div>
                <div className="field">
                  <label className="field-label">Unit</label>
                  <input type="text" className="input" placeholder="bpm" />
                </div>
              </div>
              <div className="field">
                <label className="field-label">Recorded At</label>
                <input type="datetime-local" className="input" />
              </div>
              <div className="field">
                <label className="field-label">Notes (optional)</label>
                <textarea className="input" rows={2} placeholder="Any additional notes..." style={{ resize: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Save Reading</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}