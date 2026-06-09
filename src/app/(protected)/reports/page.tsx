"use client";
import { useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PolarAngleAxis, Cell,
} from "recharts";
import { currentUser, medicines, metricsHistory } from "@/utils/mockData";

/* ─── Mock report data ──────────────────────────────────────── */
const ADHERENCE_BY_DAY = [
  { day: "Mon", rate: 100, taken: 4, missed: 0 },
  { day: "Tue", rate: 75,  taken: 3, missed: 1 },
  { day: "Wed", rate: 100, taken: 4, missed: 0 },
  { day: "Thu", rate: 50,  taken: 2, missed: 2 },
  { day: "Fri", rate: 100, taken: 4, missed: 0 },
  { day: "Sat", rate: 75,  taken: 3, missed: 1 },
  { day: "Sun", rate: 100, taken: 4, missed: 0 },
];

const ADHERENCE_BY_WEEK = [
  { week: "May 6",  rate: 86, taken: 24, missed: 4 },
  { week: "May 13", rate: 93, taken: 26, missed: 2 },
  { week: "May 20", rate: 79, taken: 22, missed: 6 },
  { week: "May 27", rate: 96, taken: 27, missed: 1 },
  { week: "Jun 3",  rate: 89, taken: 25, missed: 3 },
  { week: "Jun 10", rate: 93, taken: 26, missed: 2 },
];

const ADHERENCE_BY_MED = medicines.map((m, i) => ({
  name: m.name,
  rate: [91, 78, 95, 100][i] ?? 88,
  taken: [39, 33, 41, 43][i] ?? 38,
  missed: [4, 9, 2, 0][i] ?? 5,
  color: [
    "var(--brand-500)", "var(--purple)", "var(--success)", "var(--info)"
  ][i] ?? "var(--brand-500)",
  colorBg: m.colorBg,
}));

const RADIAL_DATA = [{ name: "Overall", value: 91, fill: "var(--brand-500)" }];

const HEALTH_TREND = metricsHistory.map((d) => ({
  date: d.date,
  heartRate: d.hr,
  systolic: d.sbp,
  glucose: d.glucose,
  weight: d.weight,
}));

const DOSE_TIMES = [
  { hour: "6 AM", doses: 1, missed: 0 },
  { hour: "8 AM", doses: 2, missed: 0 },
  { hour: "12 PM", doses: 1, missed: 1 },
  { hour: "6 PM", doses: 0, missed: 0 },
  { hour: "8 PM", doses: 2, missed: 1 },
];

const MISS_REASONS = [
  { reason: "Forgot",        count: 5, pct: 42 },
  { reason: "Away from home",count: 4, pct: 33 },
  { reason: "Ran out",       count: 2, pct: 17 },
  { reason: "Side effects",  count: 1, pct: 8  },
];

type Period = "7d" | "30d" | "90d";

/* ─── Custom Tooltip ─────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--r-sm)",
      padding: "10px 14px",
      boxShadow: "var(--shadow-md)",
      fontSize: 13,
    }}>
      <p style={{ fontWeight: 700, color: "var(--n-800)", marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span style={{ color: "var(--n-600)" }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: "var(--n-900)" }}>{p.value}{p.name === "rate" ? "%" : ""}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Section header ──────────────────────────────────────────── */
function SectionHeader({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)" }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────────── */
export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [activeTab, setActiveTab] = useState<"adherence" | "health" | "insights">("adherence");

  const adherenceData = (period === "7d" ? ADHERENCE_BY_DAY : ADHERENCE_BY_WEEK).map(item => ({
    ...item,
    displayDate: "day" in item ? item.day : item.week
  }));
  const xKey = period === "7d" ? "day" : "week";
  const overallAdherence = 91;

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

      <div className="page-hd anim-fade-up">
        <div>
          <h1 className="page-title">Reports &amp; Analytics</h1>
          <p className="page-sub">Adherence trends, health metrics, and personalised insights</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Period selector */}
          <div style={{ display: "flex", gap: 3, padding: "3px", background: "var(--n-100)", borderRadius: "var(--r-sm)" }}>
            {(["7d", "30d", "90d"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="btn btn-sm"
                style={{
                  background: period === p ? "white" : "transparent",
                  color: period === p ? "var(--n-900)" : "var(--n-500)",
                  boxShadow: period === p ? "var(--shadow-xs)" : "none",
                  fontWeight: period === p ? 700 : 500,
                  padding: "5px 13px",
                  fontSize: 12.5,
                  transition: "all .18s",
                }}
              >
                {p === "7d" ? "7 days" : p === "30d" ? "30 days" : "90 days"}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary">📤 Export PDF</button>
        </div>
      </div>

      <div className="page-body" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Summary stats ─────────────────────────────────────── */}
        <div className="anim-fade-up d1" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {[
            { icon: "📊", iconBg: "var(--brand-50)", val: `${overallAdherence}%`, lbl: "Overall adherence", trend: "+3% vs last period", dir: "good" as const },
            { icon: "✅", iconBg: "var(--success-bg)", val: "147",   lbl: "Doses taken on time",  trend: "Last 30 days", dir: "neutral" as const },
            { icon: "⚠️", iconBg: "var(--warning-bg)", val: "12",    lbl: "Doses missed",          trend: "7.5% miss rate", dir: "warn" as const },
            { icon: "🔥", iconBg: "var(--purple-bg)",  val: "11",    lbl: "Day streak",             trend: "Personal best: 18d", dir: "good" as const },
          ].map((s) => (
            <div key={s.lbl} className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="stat-icon" style={{ background: s.iconBg }}>{s.icon}</div>
              </div>
              <div>
                <div className="stat-val">{s.val}</div>
                <div className="stat-lbl">{s.lbl}</div>
              </div>
              <div className={`stat-trend ${s.dir === "good" ? "trend-good" : s.dir === "warn" ? "trend-warn" : "trend-neutral"}`}>
                {s.dir === "good" ? "↑" : s.dir === "warn" ? "↓" : "●"} {s.trend}
              </div>
            </div>
          ))}
        </div>

        {/* ── Tab bar ────────────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: 2,
          borderBottom: "1px solid var(--border-subtle)",
        }} className="anim-fade-up d2">
          {(["adherence", "health", "insights"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: "11px 22px",
                fontSize: 13.5,
                fontWeight: activeTab === t ? 700 : 500,
                color: activeTab === t ? "var(--brand-600)" : "var(--n-500)",
                borderBottom: activeTab === t ? "2.5px solid var(--brand-500)" : "2.5px solid transparent",
                background: "none",
                cursor: "pointer",
                transition: "all .15s",
                marginBottom: -1,
                textTransform: "capitalize",
              }}
            >
              {t === "adherence" ? "💊 Adherence" : t === "health" ? "📈 Health Trends" : "💡 Insights"}
            </button>
          ))}
        </div>

        {/* ══ ADHERENCE TAB ════════════════════════════════════════ */}
        {activeTab === "adherence" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="anim-fade-in">

            {/* Row 1: Radial gauge + trend chart */}
            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>

              {/* Radial gauge */}
              <div className="card card-p" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--n-900)", alignSelf: "flex-start" }}>
                  Overall score
                </h3>
                <div style={{ position: "relative", width: 180, height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%" cy="50%"
                      innerRadius="72%" outerRadius="95%"
                      startAngle={225} endAngle={-45}
                      data={RADIAL_DATA}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar background={{ fill: "var(--n-100)" }} dataKey="value" cornerRadius={8}>
                        <Cell fill="var(--brand-500)" />
                      </RadialBar>
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    pointerEvents: "none",
                  }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 36, color: "var(--n-900)", lineHeight: 1 }}>
                      {overallAdherence}%
                    </span>
                    <span style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>adherence</span>
                  </div>
                </div>
                <div style={{
                  padding: "10px 16px",
                  background: "var(--success-bg)",
                  borderRadius: "var(--r-sm)",
                  border: "1px solid var(--success-border)",
                  width: "100%",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--success)" }}>Excellent</div>
                  <div style={{ fontSize: 12, color: "var(--success)", opacity: .8 }}>Top 15% of patients</div>
                </div>
              </div>

              {/* Adherence trend */}
              <div className="card card-p">
                <SectionHeader
                  title={`Adherence rate — ${period === "7d" ? "this week" : period === "30d" ? "last 30 days" : "last 90 days"}`}
                  subtitle={`Doses taken on time vs. scheduled (${period})`}
                />
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={adherenceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="adherGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand-500)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="var(--brand-500)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "var(--n-400)" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--n-400)" }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      name="rate"
                      stroke="var(--brand-500)"
                      strokeWidth={2.5}
                      fill="url(#adherGrad)"
                      dot={{ r: 4, fill: "var(--brand-500)", stroke: "white", strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 2: Per-medicine breakdown */}
            <div className="card card-p">
              <SectionHeader title="By medication" subtitle="Individual adherence for each active prescription" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
                {ADHERENCE_BY_MED.map((m) => (
                  <div key={m.name} style={{
                    padding: "16px 18px",
                    background: "var(--n-50)",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, background: m.colorBg,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
                      }}>💊</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--n-800)" }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          {m.taken} taken · {m.missed} missed
                        </div>
                      </div>
                      <div style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 22,
                        color: m.rate >= 90 ? "var(--success)" : m.rate >= 75 ? "var(--warning)" : "var(--danger)",
                      }}>
                        {m.rate}%
                      </div>
                    </div>
                    <div className="progress" style={{ height: 6 }}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${m.rate}%`,
                          background: m.rate >= 90 ? "var(--success)" : m.rate >= 75 ? "var(--warning)" : "var(--danger)",
                          transition: "width .8s ease",
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      <span className={`badge ${m.rate >= 90 ? "badge-green" : m.rate >= 75 ? "badge-yellow" : "badge-red"}`} style={{ fontSize: 11 }}>
                        {m.rate >= 90 ? "✓ Excellent" : m.rate >= 75 ? "⚠ Good" : "✕ Needs attention"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 3: Taken vs missed bar + dose timing */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              {/* Taken vs missed stacked bar */}
              <div className="card card-p">
                <SectionHeader title="Doses taken vs missed" subtitle="Weekly breakdown" />
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={ADHERENCE_BY_WEEK} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--n-400)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--n-400)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="taken" name="taken" stackId="a" fill="var(--brand-400)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="missed" name="missed" stackId="a" fill="var(--danger-bg)" stroke="var(--danger-border)" strokeWidth={1} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                  {[["var(--brand-400)", "Taken"], ["var(--danger)", "Missed"]].map(([c, l]) => (
                    <div key={String(l)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: String(c) }} />
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{String(l)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dose timing heatmap */}
              <div className="card card-p">
                <SectionHeader title="Dose timing" subtitle="When you typically take your medicines" />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {DOSE_TIMES.map((t) => {
                    const total = t.doses + t.missed;
                    const pct = total ? (t.doses / total) * 100 : 0;
                    return (
                      <div key={t.hour} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--n-600)", width: 48, flexShrink: 0 }}>{t.hour}</span>
                        <div style={{ flex: 1, position: "relative" }}>
                          <div className="progress" style={{ height: 22, borderRadius: "var(--r-sm)" }}>
                            <div
                              className="progress-bar"
                              style={{
                                width: total ? `${pct}%` : "0%",
                                background: pct >= 90 ? "var(--success)" : pct >= 60 ? "var(--brand-400)" : "var(--warning)",
                                borderRadius: "var(--r-sm)",
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)", width: 52, textAlign: "right", flexShrink: 0 }}>
                          {t.doses}/{total || "–"} doses
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Row 4: Miss reasons */}
            <div className="card card-p">
              <SectionHeader title="Why doses were missed" subtitle={`Based on ${MISS_REASONS.reduce((a, b) => a + b.count, 0)} missed doses in the last 30 days`} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                {MISS_REASONS.map((r) => (
                  <div key={r.reason} style={{
                    padding: "16px",
                    background: "var(--n-50)",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--n-900)", lineHeight: 1, marginBottom: 4 }}>
                      {r.pct}%
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--n-700)", marginBottom: 6 }}>{r.reason}</div>
                    <div className="progress" style={{ height: 4 }}>
                      <div className="progress-bar" style={{ width: `${r.pct}%`, background: "var(--brand-400)" }} />
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>{r.count} times</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ HEALTH TRENDS TAB ════════════════════════════════════ */}
        {activeTab === "health" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="anim-fade-in">

            {/* Latest readings strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
              {[
                { icon: "♥", iconBg: "#fff1f2", val: "72", unit: "bpm", lbl: "Heart Rate", status: "normal", delta: "+2" },
                { icon: "🩺", iconBg: "#f0fdf4", val: "118/76", unit: "mmHg", lbl: "Blood Pressure", status: "normal", delta: "−4" },
                { icon: "🩸", iconBg: "#fffbeb", val: "94", unit: "mg/dL", lbl: "Blood Glucose", status: "normal", delta: "−3" },
                { icon: "⚖", iconBg: "#f5f3ff", val: "71.2", unit: "kg", lbl: "Weight", status: "normal", delta: "−0.3" },
              ].map((s) => (
                <div key={s.lbl} className="stat-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div className="stat-icon" style={{ background: s.iconBg }}>{s.icon}</div>
                    <span className="badge badge-green" style={{ fontSize: 10.5 }}>● Normal</span>
                  </div>
                  <div>
                    <div className="stat-val">{s.val} <span style={{ fontSize: 14, color: "var(--muted)", fontFamily: "var(--font-body)", fontWeight: 400 }}>{s.unit}</span></div>
                    <div className="stat-lbl">{s.lbl}</div>
                  </div>
                  <div className="stat-trend trend-good">↗ {s.delta} this period</div>
                </div>
              ))}
            </div>

            {/* Multi-metric line chart */}
            <div className="card card-p">
              <SectionHeader
                title="Vitals over time"
                subtitle={`Heart rate, blood pressure, and blood glucose — ${period}`}
                action={
                  <div style={{ display: "flex", gap: 16 }}>
                    {[
                      ["var(--brand-500)", "Heart Rate"],
                      ["#7c3aed", "Systolic BP"],
                      ["#2563eb", "Blood Glucose"],
                    ].map(([c, l]) => (
                      <div key={String(l)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 22, height: 2.5, borderRadius: 2, background: String(c) }} />
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>{String(l)}</span>
                      </div>
                    ))}
                  </div>
                }
              />
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={HEALTH_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--n-400)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--n-400)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="heartRate" name="heartRate" stroke="var(--brand-500)" strokeWidth={2.5}
                    dot={{ r: 4, fill: "var(--brand-500)", stroke: "white", strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="systolic" name="systolic" stroke="#7c3aed" strokeWidth={2}
                    strokeDasharray="5 3" dot={false} />
                  <Line type="monotone" dataKey="glucose" name="glucose" stroke="#2563eb" strokeWidth={2}
                    dot={{ r: 3, fill: "#2563eb", stroke: "white", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Weight trend + HbA1c */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="card card-p">
                <SectionHeader title="Weight trend" subtitle="Daily readings (kg)" />
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={HEALTH_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--n-400)" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[70, 73]} tick={{ fontSize: 10, fill: "var(--n-400)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="weight" name="weight" stroke="#7c3aed" strokeWidth={2} fill="url(#wGrad)"
                      dot={{ r: 3, fill: "#7c3aed", stroke: "white", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* HbA1c progress */}
              <div className="card card-p">
                <SectionHeader title="HbA1c trend" subtitle="Quarterly lab results" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { quarter: "Q2 2023", val: 7.2, status: "high" },
                    { quarter: "Q3 2023", val: 6.1, status: "warn" },
                    { quarter: "Q4 2023", val: 5.7, status: "good" },
                    { quarter: "Q1 2024", val: 5.4, status: "good" },
                  ].map((q) => (
                    <div key={q.quarter} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--n-600)", width: 72, flexShrink: 0 }}>{q.quarter}</span>
                      <div style={{ flex: 1 }}>
                        <div className="progress" style={{ height: 16, borderRadius: "var(--r-sm)" }}>
                          <div className="progress-bar" style={{
                            width: `${(q.val / 10) * 100}%`,
                            background: q.status === "good" ? "var(--success)" : q.status === "warn" ? "var(--warning)" : "var(--danger)",
                            borderRadius: "var(--r-sm)",
                          }} />
                        </div>
                      </div>
                      <span style={{
                        fontSize: 13.5, fontWeight: 700,
                        color: q.status === "good" ? "var(--success)" : q.status === "warn" ? "var(--warning)" : "var(--danger)",
                        width: 36, textAlign: "right", flexShrink: 0,
                      }}>
                        {q.val}%
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, padding: "10px 13px", background: "var(--success-bg)", borderRadius: "var(--r-sm)", border: "1px solid var(--success-border)", fontSize: 13, color: "var(--success)" }}>
                  ↓ 1.8% improvement over the last year — excellent progress!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ INSIGHTS TAB ═════════════════════════════════════════ */}
        {activeTab === "insights" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="anim-fade-in">

            {/* AI insight cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                {
                  type: "positive" as const,
                  icon: "🎯",
                  iconBg: "var(--success-bg)",
                  borderColor: "var(--success-border)",
                  textColor: "var(--success)",
                  tag: "Strength",
                  title: "Strong evening adherence",
                  body: "You take your 8 PM doses on time 98% of the time. Your evening routine is your most reliable window — consider scheduling any new medicines then.",
                },
                {
                  type: "warn" as const,
                  icon: "⚠️",
                  iconBg: "var(--warning-bg)",
                  borderColor: "var(--warning-border)",
                  textColor: "var(--warning)",
                  tag: "Watch",
                  title: "Lunchtime doses are your weak spot",
                  body: "Lisinopril (12 PM) is missed 22% of the time — 3× more than your other medications. Consider setting a calendar alert or moving the dose to breakfast.",
                },
                {
                  type: "positive" as const,
                  icon: "📈",
                  iconBg: "var(--brand-50)",
                  borderColor: "var(--brand-100)",
                  textColor: "var(--brand-600)",
                  tag: "Trend",
                  title: "HbA1c responding to treatment",
                  body: "Your blood sugar control has improved from 7.2% to 5.4% over 12 months — well within the normal range. This correlates with your Metformin adherence staying above 90%.",
                },
                {
                  type: "positive" as const,
                  icon: "🏆",
                  iconBg: "var(--purple-bg)",
                  borderColor: "var(--purple-border)",
                  textColor: "var(--purple)",
                  tag: "Milestone",
                  title: "11-day streak achieved",
                  body: "You've taken all scheduled doses for 11 consecutive days — your second-longest streak. Your previous best was 18 days in February.",
                },
              ].map((ins) => (
                <div key={ins.title} style={{
                  padding: "20px",
                  background: ins.iconBg,
                  borderRadius: "var(--r-lg)",
                  border: `1px solid ${ins.borderColor}`,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: "white",
                      border: `1px solid ${ins.borderColor}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, flexShrink: 0,
                    }}>
                      {ins.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, textTransform: "uppercase",
                          letterSpacing: ".08em", color: ins.textColor,
                          background: "white",
                          padding: "2px 8px", borderRadius: "var(--r-full)",
                          border: `1px solid ${ins.borderColor}`,
                        }}>
                          {ins.tag}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--n-900)", marginBottom: 6, lineHeight: 1.35 }}>
                        {ins.title}
                      </div>
                      <p style={{ fontSize: 13, color: "var(--n-600)", lineHeight: 1.6, margin: 0 }}>
                        {ins.body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className="card card-p">
              <SectionHeader title="Personalised recommendations" subtitle="Based on your last 30 days of data" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: "⏰", priority: "High", text: "Set a 12 PM alarm specifically for Lisinopril — your most-missed dose.", action: "Set reminder" },
                  { icon: "💊", priority: "Medium", text: "Your Lisinopril supply runs out in 8 days. Request a refill to avoid a gap.", action: "Request refill" },
                  { icon: "🩺", priority: "Medium", text: "Your next HbA1c test is overdue. Schedule a lab visit with Dr. Chen.", action: "Book appointment" },
                  { icon: "📊", priority: "Low", text: "Log your weight daily this week to complete your 30-day trend baseline.", action: "Log weight" },
                ].map((r) => (
                  <div key={r.text} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px",
                    background: "var(--n-50)",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <span className={`badge ${r.priority === "High" ? "badge-red" : r.priority === "Medium" ? "badge-yellow" : "badge-slate"}`} style={{ fontSize: 10.5, marginBottom: 4, display: "inline-flex" }}>
                        {r.priority}
                      </span>
                      <p style={{ fontSize: 13.5, color: "var(--n-700)", margin: 0, lineHeight: 1.5 }}>{r.text}</p>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>{r.action}</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Export section */}
            <div style={{
              background: "linear-gradient(135deg, var(--brand-600), var(--brand-800))",
              borderRadius: "var(--r-lg)", padding: "24px 28px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
            }}>
              <div style={{ color: "white" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 19, marginBottom: 5 }}>
                  Share your report with your doctor
                </div>
                <p style={{ fontSize: 13.5, opacity: .7, margin: 0 }}>
                  Generate a printable summary of your adherence and health metrics for your next appointment.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                <button className="btn" style={{ background: "rgba(255,255,255,.15)", color: "white", border: "1px solid rgba(255,255,255,.25)" }}>
                  📋 Copy link
                </button>
                <button className="btn" style={{ background: "white", color: "var(--brand-700)" }}>
                  📄 Export PDF
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}