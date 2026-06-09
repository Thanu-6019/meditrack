"use client";
import { useState } from "react";
import Link from "next/link";
import { currentUser } from "@/utils/mockData";

const appointments = [
  {
    id: "a1",
    doctor: "Dr. Sarah Chen",
    specialty: "Cardiologist",
    date: "Jun 10, 2024",
    time: "10:30 AM",
    type: "Follow-up",
    location: "Boston Cardiac Center · Suite 302",
    address: "45 Park Ave, Boston, MA 02101",
    status: "upcoming",
    notes: "Bring recent BP logs. Discuss Lisinopril dosage adjustment.",
    init: "SC",
    color: "#f0fdf4",
    textColor: "var(--success)",
    phone: "+1 (617) 555-0191",
  },
  {
    id: "a2",
    doctor: "Dr. Michael Torres",
    specialty: "Primary Care",
    date: "Jun 15, 2024",
    time: "2:00 PM",
    type: "Routine Checkup",
    location: "Boston Medical Group",
    address: "12 Commonwealth Ave, Boston, MA 02116",
    status: "upcoming",
    notes: "Annual physical. Fasting required — no food 8 hours before.",
    init: "MT",
    color: "var(--brand-50)",
    textColor: "var(--brand-600)",
    phone: "+1 (617) 555-0182",
  },
  {
    id: "a3",
    doctor: "Dr. Priya Patel",
    specialty: "Endocrinologist",
    date: "Jun 28, 2024",
    time: "9:00 AM",
    type: "Diabetes Review",
    location: "Joslin Diabetes Center",
    address: "1 Joslin Place, Boston, MA 02215",
    status: "upcoming",
    notes: "3-month HbA1c review. Bring glucose logs from last 30 days.",
    init: "PP",
    color: "var(--warning-bg)",
    textColor: "var(--warning)",
    phone: "+1 (617) 555-0174",
  },
  {
    id: "a4",
    doctor: "Dr. Sarah Chen",
    specialty: "Cardiologist",
    date: "Apr 2, 2024",
    time: "11:00 AM",
    type: "Follow-up",
    location: "Boston Cardiac Center · Suite 302",
    address: "45 Park Ave, Boston, MA 02101",
    status: "completed",
    notes: "BP stable at 118/76. Continue Lisinopril. Next follow-up in 2 months.",
    init: "SC",
    color: "#f0fdf4",
    textColor: "var(--success)",
    phone: "+1 (617) 555-0191",
  },
  {
    id: "a5",
    doctor: "Dr. Michael Torres",
    specialty: "Primary Care",
    date: "Mar 15, 2024",
    time: "9:30 AM",
    type: "Lab Results Review",
    location: "Boston Medical Group",
    address: "12 Commonwealth Ave, Boston, MA 02116",
    status: "completed",
    notes: "HbA1c improved to 5.4%. Lipid panel normal. Excellent progress.",
    init: "MT",
    color: "var(--brand-50)",
    textColor: "var(--brand-600)",
    phone: "+1 (617) 555-0182",
  },
];

const specialists = [
  { name: "Dr. Sarah Chen", spec: "Cardiologist", init: "SC", rating: 4.9, next: "Jun 10", color: "#f0fdf4" },
  { name: "Dr. Michael Torres", spec: "Primary Care", init: "MT", rating: 4.8, next: "Jun 15", color: "var(--brand-50)" },
  { name: "Dr. Priya Patel", spec: "Endocrinologist", init: "PP", rating: 4.9, next: "Jun 28", color: "var(--warning-bg)" },
];

export default function AppointmentsPage() {
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");
  const [showBookModal, setShowBookModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = appointments.filter(
    (a) => filter === "all" || a.status === filter
  );

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

      <div className="page-hd anim-fade-up">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-sub">Manage your medical appointments and care team</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary">📤 Export</button>
          <button className="btn btn-primary" onClick={() => setShowBookModal(true)}>
            + Book Appointment
          </button>
        </div>
      </div>

      <div className="page-body" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Stats */}
        <div className="anim-fade-up d1" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {[
            { label: "Upcoming", value: appointments.filter((a) => a.status === "upcoming").length, icon: "📅", bg: "var(--brand-50)", color: "var(--brand-600)" },
            { label: "This month", value: 3, icon: "🗓", bg: "var(--info-bg)", color: "var(--info)" },
            { label: "Care team", value: specialists.length, icon: "👨‍⚕️", bg: "var(--success-bg)", color: "var(--success)" },
            { label: "Completed this year", value: 8, icon: "✅", bg: "var(--warning-bg)", color: "var(--warning)" },
          ].map((s) => (
            <div key={s.label} className="card card-p" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 26, lineHeight: 1, color: "var(--n-900)" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="anim-fade-up d2" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>

          {/* Left: appointments list */}
          <div>
            {/* Filters */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {(["all", "upcoming", "completed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`}
                  style={{ textTransform: "capitalize" }}
                >
                  {f === "all" ? `All (${appointments.length})` : f === "upcoming" ? `Upcoming (${appointments.filter((a) => a.status === "upcoming").length})` : `Past (${appointments.filter((a) => a.status === "completed").length})`}
                </button>
              ))}
            </div>

            {/* Appointment cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map((appt) => {
                const isExpanded = expandedId === appt.id;
                return (
                  <div key={appt.id} className="card" style={{
                    overflow: "hidden",
                    borderLeft: `4px solid ${appt.textColor}`,
                    transition: "all .2s",
                  }}>
                    <div
                      style={{ padding: "18px 20px", cursor: "pointer" }}
                      onClick={() => setExpandedId(isExpanded ? null : appt.id)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div className="avatar" style={{
                          width: 46, height: 46, background: appt.color,
                          color: appt.textColor, fontSize: 13, flexShrink: 0,
                        }}>
                          {appt.init}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--n-900)" }}>{appt.doctor}</span>
                            <span className="badge badge-slate" style={{ fontSize: 11 }}>{appt.specialty}</span>
                            {appt.status === "upcoming" && (
                              <span className="badge badge-brand" style={{ fontSize: 11 }}>Upcoming</span>
                            )}
                            {appt.status === "completed" && (
                              <span className="badge badge-green" style={{ fontSize: 11 }}>✓ Completed</span>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: "var(--muted)" }}>
                            {appt.type} · {appt.location}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: appt.textColor }}>{appt.date}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>{appt.time}</div>
                        </div>
                        <span style={{ color: "var(--n-400)", marginLeft: 8, transition: "transform .2s", transform: isExpanded ? "rotate(180deg)" : "none" }}>▾</span>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{
                        padding: "0 20px 18px",
                        borderTop: "1px solid var(--border-subtle)",
                        paddingTop: 16,
                      }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                          {[
                            ["📍 Location", appt.address],
                            ["📞 Phone", appt.phone],
                            ["📋 Type", appt.type],
                            ["🕐 Time", appt.time],
                          ].map(([l, v]) => (
                            <div key={l} style={{ padding: "10px 13px", background: "var(--n-50)", borderRadius: "var(--r-sm)" }}>
                              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>{l}</div>
                              <div style={{ fontSize: 13, color: "var(--n-700)", fontWeight: 500 }}>{v}</div>
                            </div>
                          ))}
                        </div>
                        {appt.notes && (
                          <div style={{
                            padding: "12px 14px", background: "var(--info-bg)",
                            borderRadius: "var(--r-sm)", border: "1px solid var(--info-border)",
                            fontSize: 13, color: "var(--info)", marginBottom: 14,
                          }}>
                            📝 {appt.notes}
                          </div>
                        )}
                        {appt.status === "upcoming" && (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn btn-secondary btn-sm">✏ Reschedule</button>
                            <button className="btn btn-secondary btn-sm">📤 Add to Calendar</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", marginLeft: "auto" }}>Cancel</button>
                          </div>
                        )}
                        {appt.status === "completed" && (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn btn-secondary btn-sm">📋 View Notes</button>
                            <button className="btn btn-primary btn-sm">🔄 Book Follow-up</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: care team + calendar mini */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Mini calendar */}
            <div className="card card-p">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--n-900)", marginBottom: 14 }}>June 2024</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
                {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                  <div key={d + Math.random()} style={{ fontSize: 10, fontWeight: 700, color: "var(--n-400)", padding: "4px 0" }}>{d}</div>
                ))}
                {Array.from({ length: 6 }, () => null).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                  const hasAppt = [10, 15, 28].includes(d);
                  const isToday = d === 9;
                  return (
                    <div key={d} style={{
                      padding: "5px 0", fontSize: 12,
                      borderRadius: 6, cursor: hasAppt ? "pointer" : "default",
                      background: isToday ? "var(--brand-500)" : hasAppt ? "var(--brand-100)" : "transparent",
                      color: isToday ? "white" : hasAppt ? "var(--brand-700)" : "var(--n-600)",
                      fontWeight: hasAppt || isToday ? 700 : 400,
                      position: "relative",
                    }}>
                      {d}
                      {hasAppt && !isToday && (
                        <div style={{
                          position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)",
                          width: 4, height: 4, borderRadius: "50%", background: "var(--brand-500)",
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Care team */}
            <div className="card card-p">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--n-900)", marginBottom: 14 }}>Your Care Team</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {specialists.map((s) => (
                  <div key={s.name} style={{
                    padding: "12px 14px", background: "var(--n-50)",
                    borderRadius: "var(--r-md)", border: "1px solid var(--border-subtle)",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div className="avatar" style={{ width: 38, height: 38, background: s.color, fontSize: 11 }}>
                      {s.init}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--n-800)" }}>{s.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{s.spec}</div>
                      <div style={{ fontSize: 11, color: "var(--brand-600)", fontWeight: 600 }}>Next: {s.next}</div>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--n-400)", fontWeight: 600 }}>⭐ {s.rating}</div>
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary" style={{ width: "100%", marginTop: 12 }}>
                + Add a provider
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Book modal */}
      {showBookModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 20,
        }} onClick={() => setShowBookModal(false)}>
          <div style={{
            background: "white", borderRadius: "var(--r-xl)", padding: "32px", width: "100%", maxWidth: 480,
            boxShadow: "var(--shadow-xl)",
          }} onClick={(e) => e.stopPropagation()} className="anim-scale-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--n-900)" }}>Book Appointment</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowBookModal(false)}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="field">
                <label className="field-label">Provider</label>
                <select className="input">
                  <option>Dr. Sarah Chen — Cardiologist</option>
                  <option>Dr. Michael Torres — Primary Care</option>
                  <option>Dr. Priya Patel — Endocrinologist</option>
                  <option>Other provider...</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label">Appointment Type</label>
                <select className="input">
                  <option>Follow-up</option>
                  <option>Routine Checkup</option>
                  <option>Lab Results Review</option>
                  <option>New Concern</option>
                  <option>Urgent Care</option>
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label className="field-label">Preferred Date</label>
                  <input type="date" className="input" />
                </div>
                <div className="field">
                  <label className="field-label">Preferred Time</label>
                  <input type="time" className="input" />
                </div>
              </div>
              <div className="field">
                <label className="field-label">Notes for doctor</label>
                <textarea className="input" rows={3} placeholder="Describe your concern or reason for visit..." style={{ resize: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowBookModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowBookModal(false)}>Request Appointment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}