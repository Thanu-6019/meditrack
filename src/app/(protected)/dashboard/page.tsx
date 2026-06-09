import type { Metadata } from "next";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import { dashboardStats, medicines, activityFeed, currentUser } from "@/utils/mockData";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  const todayMeds = medicines.slice(0, 3);
  const upcoming = [
    { doctor: "Dr. Sarah Chen",     spec: "Cardiologist",   date: "Tomorrow",  time: "10:30 AM", init: "SC", bg: "#f0fdf4", color: "var(--success)" },
    { doctor: "Dr. Michael Torres", spec: "Primary Care",   date: "Jun 15",    time: "2:00 PM",  init: "MT", bg: "var(--brand-50)", color: "var(--brand-600)" },
  ];

  return (
    <div className="app-main-inner">
      <Topbar
        title={`Good morning, ${currentUser.name.split(" ")[0]} 👋`}
        subtitle="Here's your health snapshot for today"
      />

      <div className="page-body" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Stat cards ──────────────────────────── */}
        <div className="anim-fade-up d1" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {dashboardStats.map(s => (
            <Link key={s.label} href="/health-metrics" style={{ textDecoration: "none" }}>
              <div className="stat-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div className="stat-icon" style={{ background: s.iconBg }}>{s.icon}</div>
                  <span className="badge badge-slate">{s.unit}</span>
                </div>
                <div>
                  <div className="stat-val">{s.value}</div>
                  <div className="stat-lbl">{s.label}</div>
                </div>
                <div className={`stat-trend ${s.trendDir === "good" ? "trend-good" : "trend-neutral"}`}>
                  {s.trendDir === "good" ? "↑" : "●"} {s.trend}
                  <span style={{ color: "var(--n-400)", fontWeight: 400 }}> · {s.trendNote}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Middle row ──────────────────────────── */}
        <div className="anim-fade-up d2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Today's meds */}
          <div className="card card-p">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)" }}>Today's Medications</h3>
                <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                  {todayMeds.filter(m => m.takenToday).length} of {todayMeds.length} taken
                </p>
              </div>
              <Link href="/medicines"><button className="btn btn-ghost btn-sm">View all →</button></Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {todayMeds.map(med => (
                <div key={med.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "11px 13px",
                  background: med.takenToday ? "var(--success-bg)" : "var(--n-50)",
                  borderRadius: "var(--r-sm)",
                  border: `1px solid ${med.takenToday ? "var(--success-border)" : "var(--border)"}`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, fontSize: 18,
                    background: med.colorBg, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>💊</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--n-800)" }}>{med.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{med.dosage} · {med.times[0]}</div>
                  </div>
                  {med.takenToday
                    ? <span className="badge badge-green">✓ Taken</span>
                    : <button className="btn btn-secondary btn-sm" style={{ fontSize: 12 }}>Mark taken</button>
                  }
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 5 }}>
                <span>Daily adherence</span>
                <span>33%</span>
              </div>
              <div className="progress" style={{ height: 5 }}>
                <div className="progress-bar" style={{ width: "33%", background: "var(--brand-500)" }} />
              </div>
            </div>
          </div>

          {/* Upcoming appointments */}
          <div className="card card-p">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)" }}>Upcoming Appointments</h3>
                <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>Next 30 days</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {upcoming.map(a => (
                <div key={a.doctor} style={{
                  display: "flex", alignItems: "center", gap: 13,
                  padding: "13px 15px", borderRadius: "var(--r-md)",
                  border: "1.5px solid var(--border)", background: "var(--surface)",
                  transition: "border-color .2s",
                }}>
                  <div className="avatar" style={{ width: 42, height: 42, background: a.bg, color: a.color, fontSize: 12 }}>
                    {a.init}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--n-800)" }}>{a.doctor}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{a.spec}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-600)" }}>{a.date}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-secondary" style={{ width: "100%", marginTop: 14 }}>
              + Schedule new appointment
            </button>
          </div>
        </div>

        {/* ── Bottom row ──────────────────────────── */}
        <div className="anim-fade-up d3" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>

          {/* Health trend chart */}
          <div className="card card-p">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)" }}>Health Trends</h3>
                <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>30-day overview</p>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {["7D", "30D", "90D"].map((p, i) => (
                  <button key={p} className={`btn btn-sm ${i === 1 ? "btn-primary" : "btn-ghost"}`}
                    style={{ padding: "4px 11px", fontSize: 12 }}>{p}</button>
                ))}
              </div>
            </div>

            {/* SVG sparkline */}
            <div style={{ height: 150 }}>
              <svg viewBox="0 0 560 130" style={{ width: "100%", height: "100%" }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-500)" stopOpacity=".18" />
                    <stop offset="100%" stopColor="var(--brand-500)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0,32,64,96,128].map(y => (
                  <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="var(--border)" strokeWidth=".8" />
                ))}
                <path
                  d="M0,95 C70,85 140,75 210,70 C280,65 350,55 420,48 C490,41 530,38 560,32"
                  fill="url(#g1)"
                  stroke="none"
                />
                {/* Draw closed path for fill */}
                <path
                  d="M0,95 C70,85 140,75 210,70 C280,65 350,55 420,48 C490,41 530,38 560,32 L560,130 L0,130 Z"
                  fill="url(#g1)"
                />
                <path
                  d="M0,95 C70,85 140,75 210,70 C280,65 350,55 420,48 C490,41 530,38 560,32"
                  fill="none" stroke="var(--brand-500)" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                />
                <path
                  d="M0,78 C70,82 140,73 210,76 C280,79 350,66 420,70 C490,74 530,65 560,60"
                  fill="none" stroke="var(--purple)" strokeWidth="1.8" strokeDasharray="5,3"
                  strokeLinecap="round" opacity=".7"
                />
                {[[210,70],[420,48],[560,32]].map(([x,y]) => (
                  <circle key={`${x}`} cx={x} cy={y} r="4.5" fill="var(--brand-500)" stroke="white" strokeWidth="2" />
                ))}
              </svg>
            </div>

            <div style={{ display: "flex", gap: 18, marginTop: 4 }}>
              {[["var(--brand-500)", false, "Heart Rate"], ["var(--purple)", true, "Blood Pressure"]].map(([c, dashed, l]) => (
                <div key={String(l)} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{
                    width: 22, height: 2, borderRadius: 1,
                    borderTop: dashed ? `2px dashed ${c}` : "none", background: dashed ? "none" : String(c),
                  }} />
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{String(l)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="card card-p">
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)", marginBottom: 18 }}>
              Recent Activity
            </h3>
            <div className="timeline">
              {activityFeed.map((item, i) => (
                <div key={i} className="tl-item">
                  <div className="tl-dot" style={{ background: item.colorBg }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--n-800)", lineHeight: 1.45 }}>
                      {item.text}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--n-400)", marginTop: 2 }}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick alert if refill needed ──────── */}
        <div className="anim-fade-up d4" style={{
          background: "var(--warning-bg)", border: "1px solid var(--warning-border)",
          borderRadius: "var(--r-lg)", padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>Lisinopril refill needed</div>
              <div style={{ fontSize: 13, color: "#b45309" }}>Only 8 pills remaining. Refill by Jun 20 to avoid a gap.</div>
            </div>
          </div>
          <button className="btn btn-sm" style={{ background: "var(--warning)", color: "white", flexShrink: 0 }}>
            Request refill
          </button>
        </div>

      </div>
    </div>
  );
}