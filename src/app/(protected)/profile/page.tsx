"use client";
import { useState } from "react";
import Link from "next/link";
import { currentUser, medicines, healthMetrics } from "@/utils/mockData";

const conditions = ["Type 2 Diabetes", "Hypertension", "Hyperlipidemia"];
const allergies = ["Penicillin", "Sulfa drugs"];
const vaccinations = [
  { name: "COVID-19 (Moderna)", date: "Nov 2023", status: "up-to-date" },
  { name: "Flu Vaccine", date: "Oct 2023", status: "up-to-date" },
  { name: "Tetanus (Td)", date: "Jan 2020", status: "due-soon" },
  { name: "Hepatitis B", date: "Mar 2015", status: "up-to-date" },
];
const labResults = [
  { name: "HbA1c Panel", date: "Jun 6, 2024", result: "5.4%", status: "normal" },
  { name: "Lipid Panel", date: "May 20, 2024", result: "182 mg/dL", status: "normal" },
  { name: "CBC", date: "May 20, 2024", result: "Normal", status: "normal" },
  { name: "Kidney Function", date: "May 20, 2024", result: "Normal", status: "normal" },
  { name: "Liver Enzymes", date: "Apr 10, 2024", result: "Normal", status: "normal" },
];

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "medical", label: "Medical History" },
    { key: "labs", label: "Lab Results" },
    { key: "insurance", label: "Insurance" },
  ];

  return (
    <div className="app-main-inner">
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-date">
          <span className="live-dot" />
          {new Date().toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric", year: "numeric",
          })}
        </div>
        <div className="topbar-actions">
          <Link href="/notifications">
            <button className="btn btn-ghost btn-icon" style={{ position: "relative" }}>
              🔔
              <span style={{ position: "absolute", top: 5, right: 5, width: 8, height: 8, borderRadius: "50%", background: "var(--danger)", border: "1.5px solid white" }} />
            </button>
          </Link>
          <Link href="/profile">
            <div className="avatar" style={{ width: 34, height: 34, cursor: "pointer", fontSize: 12 }}>
              {currentUser.initials}
            </div>
          </Link>
        </div>
      </div>

      {/* Profile hero */}
      <div style={{
        background: "linear-gradient(135deg, var(--brand-700) 0%, var(--brand-900) 100%)",
        padding: "32px 36px 80px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "rgba(255,255,255,.04)", top: -150, right: -100,
        }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(255,255,255,.2)", border: "3px solid rgba(255,255,255,.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontSize: 30, color: "white", flexShrink: 0,
          }}>
            {currentUser.initials}
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "white", marginBottom: 4 }}>
              {currentUser.name}
            </h1>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[
                `Age ${currentUser.age}`,
                currentUser.bloodType,
                currentUser.height,
                `Member since ${currentUser.memberSince}`,
              ].map((s) => (
                <span key={s} style={{ fontSize: 13, color: "rgba(255,255,255,.65)", display: "flex", alignItems: "center", gap: 4 }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              className="btn"
              style={{ background: "rgba(255,255,255,.15)", color: "white", border: "1px solid rgba(255,255,255,.25)" }}
              onClick={() => setEditing(!editing)}
            >
              {editing ? "✓ Save changes" : "✏ Edit profile"}
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{
          position: "absolute", bottom: 20, left: 36,
          display: "grid", gridTemplateColumns: "repeat(4, 160px)", gap: 12,
          zIndex: 1,
        }}>
          {[
            { label: "Health Score", value: `${currentUser.healthScore}/100`, color: "#fff" },
            { label: "Active Medications", value: medicines.length, color: "#fff" },
            { label: "Adherence Rate", value: "91%", color: "#fff" },
            { label: "BMI", value: "22.4 — Normal", color: "#fff" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "rgba(255,255,255,.1)", borderRadius: "var(--r-md)",
              border: "1px solid rgba(255,255,255,.12)",
              padding: "12px 16px", backdropFilter: "blur(8px)",
            }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "white", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.55)", marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-body" style={{ marginTop: 0, paddingTop: 0 }}>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 2, marginBottom: 24,
          borderBottom: "1px solid var(--border)",
          marginLeft: 0, marginRight: 0,
        }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: "12px 20px",
                fontSize: 13.5, fontWeight: activeTab === t.key ? 700 : 500,
                color: activeTab === t.key ? "var(--brand-600)" : "var(--n-500)",
                borderBottom: activeTab === t.key ? "2px solid var(--brand-500)" : "2px solid transparent",
                background: "none", cursor: "pointer", transition: "all .15s",
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="anim-fade-in">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              {/* Personal info */}
              <div className="card card-p">
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>👤</span> Personal Information
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {editing ? (
                    <>
                      {[
                        { label: "Full Name", value: currentUser.name, type: "text" },
                        { label: "Email", value: currentUser.email, type: "email" },
                        { label: "Phone", value: currentUser.phone, type: "tel" },
                        { label: "Date of Birth", value: "1988-04-12", type: "date" },
                      ].map((f) => (
                        <div key={f.label} className="field">
                          <label className="field-label">{f.label}</label>
                          <input type={f.type} className="input" defaultValue={f.value} />
                        </div>
                      ))}
                    </>
                  ) : (
                    [
                      ["Full Name", currentUser.name],
                      ["Email", currentUser.email],
                      ["Phone", currentUser.phone],
                      ["Date of Birth", "April 12, 1988"],
                      ["Address", currentUser.address],
                    ].map(([l, v]) => (
                      <div key={l} style={{ display: "flex", gap: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--n-400)", textTransform: "uppercase", letterSpacing: ".06em", width: 120, flexShrink: 0, paddingTop: 1 }}>{l}</div>
                        <div style={{ fontSize: 13.5, color: "var(--n-700)" }}>{v}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Medical info */}
              <div className="card card-p">
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🩺</span> Medical Profile
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    ["Blood Type", currentUser.bloodType],
                    ["Height", currentUser.height],
                    ["Weight", currentUser.weight],
                    ["Primary Doctor", currentUser.primaryDoctor],
                    ["Emergency Contact", currentUser.emergencyContact],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", gap: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--n-400)", textTransform: "uppercase", letterSpacing: ".06em", width: 140, flexShrink: 0, paddingTop: 1 }}>{l}</div>
                      <div style={{ fontSize: 13.5, color: "var(--n-700)" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Conditions & Allergies */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="card card-p">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--n-900)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🏥</span> Active Conditions
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {conditions.map((c) => (
                    <div key={c} style={{
                      padding: "10px 13px", background: "var(--info-bg)",
                      borderRadius: "var(--r-sm)", border: "1px solid var(--info-border)",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--info)", flexShrink: 0 }} />
                      <span style={{ fontSize: 13.5, color: "var(--n-700)", fontWeight: 500 }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card card-p">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--n-900)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>⚠️</span> Allergies & Intolerances
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {allergies.map((a) => (
                    <div key={a} style={{
                      padding: "10px 13px", background: "var(--danger-bg)",
                      borderRadius: "var(--r-sm)", border: "1px solid var(--danger-border)",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{ fontSize: 16 }}>🚫</span>
                      <span style={{ fontSize: 13.5, color: "var(--n-700)", fontWeight: 500 }}>{a}</span>
                    </div>
                  ))}
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 4 }}>+ Add allergy</button>
                </div>
              </div>
            </div>

            {/* Current Medications summary */}
            <div className="card card-p">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--n-900)" }}>💊 Current Medications</h3>
                <Link href="/medicines"><button className="btn btn-ghost btn-sm">Manage →</button></Link>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                {medicines.map((m) => (
                  <div key={m.id} style={{
                    padding: "11px 14px", background: "var(--n-50)",
                    borderRadius: "var(--r-md)", border: "1px solid var(--border-subtle)",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: m.colorBg,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💊</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--n-800)" }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{m.dosage} · {m.frequency}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vaccinations */}
            <div className="card card-p">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--n-900)", marginBottom: 16 }}>💉 Vaccination Record</h3>
              <div className="tbl-wrap">
                <table>
                  <thead><tr><th>Vaccine</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {vaccinations.map((v) => (
                      <tr key={v.name}>
                        <td style={{ fontWeight: 500 }}>{v.name}</td>
                        <td>{v.date}</td>
                        <td>
                          <span className={`badge ${v.status === "up-to-date" ? "badge-green" : "badge-yellow"}`}>
                            {v.status === "up-to-date" ? "✓ Up to date" : "⏰ Due soon"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Medical History tab */}
        {activeTab === "medical" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="anim-fade-in">
            <div className="card card-p">
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)", marginBottom: 18 }}>Medical Timeline</h3>
              <div className="timeline">
                {[
                  { date: "2024", title: "HbA1c improved to 5.4%", desc: "Annual diabetes panel — results improved from 5.7% to 5.4%. Doctor noted excellent medication adherence.", icon: "🔬", bg: "#edfaf7" },
                  { date: "2023", title: "Added Atorvastatin for cholesterol", desc: "Dr. Torres prescribed Atorvastatin 20mg after lipid panel showed elevated LDL cholesterol at 148 mg/dL.", icon: "💊", bg: "#fffbeb" },
                  { date: "2023", title: "COVID-19 Booster", desc: "Moderna bivalent booster administered. No adverse reactions.", icon: "💉", bg: "#f0fdf4" },
                  { date: "2022", title: "Hypertension diagnosed", desc: "Dr. Chen diagnosed hypertension after multiple elevated readings. Lisinopril 10mg prescribed.", icon: "🩺", bg: "#eff6ff" },
                  { date: "2021", title: "Type 2 Diabetes diagnosis", desc: "HbA1c of 7.2% led to T2D diagnosis. Metformin initiated, dietary changes recommended.", icon: "🏥", bg: "#fff1f2" },
                ].map((item, i) => (
                  <div key={i} className="tl-item">
                    <div className="tl-dot" style={{ background: item.bg }}>{item.icon}</div>
                    <div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--n-800)" }}>{item.title}</span>
                        <span className="badge badge-slate">{item.date}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lab Results tab */}
        {activeTab === "labs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="anim-fade-in">
            <div className="card">
              <div style={{ padding: "18px 22px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)" }}>Lab Results</h3>
                <button className="btn btn-secondary btn-sm">📤 Export All</button>
              </div>
              <div className="tbl-wrap" style={{ borderRadius: 0, border: "none", borderTop: "1px solid var(--border-subtle)" }}>
                <table>
                  <thead><tr><th>Test Name</th><th>Date</th><th>Result</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {labResults.map((l) => (
                      <tr key={l.name}>
                        <td style={{ fontWeight: 600 }}>{l.name}</td>
                        <td>{l.date}</td>
                        <td style={{ fontWeight: 600, color: "var(--n-800)" }}>{l.result}</td>
                        <td><span className="badge badge-green">✓ Normal</span></td>
                        <td><button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Insurance tab */}
        {activeTab === "insurance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="anim-fade-in">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                {
                  title: "Primary Insurance",
                  icon: "🏦",
                  fields: [
                    ["Provider", "BlueCross BlueShield"],
                    ["Plan", "PPO Gold"],
                    ["Member ID", "#BCB-44821"],
                    ["Group Number", "GRP-88432"],
                    ["Effective Date", "Jan 1, 2024"],
                    ["Expiry", "Dec 31, 2024"],
                  ],
                },
                {
                  title: "Coverage Summary",
                  icon: "📋",
                  fields: [
                    ["Deductible", "$1,500 / $3,000 family"],
                    ["Out-of-Pocket Max", "$6,000"],
                    ["Primary Care Copay", "$25"],
                    ["Specialist Copay", "$50"],
                    ["Prescription (Tier 1)", "$10"],
                    ["Prescription (Tier 2)", "$35"],
                  ],
                },
              ].map((card) => (
                <div key={card.title} className="card card-p">
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--n-900)", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{card.icon}</span> {card.title}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {card.fields.map(([l, v]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid var(--border-subtle)" }}>
                        <span style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>{l}</span>
                        <span style={{ fontSize: 13, color: "var(--n-800)", fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: "var(--brand-50)", borderRadius: "var(--r-lg)", padding: "18px 22px",
              border: "1px solid var(--brand-100)", display: "flex", gap: 16, alignItems: "center",
            }}>
              <span style={{ fontSize: 28 }}>ℹ️</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-800)", marginBottom: 3 }}>Insurance up to date</div>
                <div style={{ fontSize: 13, color: "var(--brand-600)" }}>Your coverage is active and verified. Contact BlueCross BlueShield at 1-800-555-0100 for claims assistance.</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}