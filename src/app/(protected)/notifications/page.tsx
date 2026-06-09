"use client";
import { useState } from "react";
import Link from "next/link";
import { notifications, currentUser } from "@/utils/mockData";

const typeIcon: Record<string, string> = {
  medication: "💊",
  appointment: "📅",
  refill: "⚠️",
  lab: "🔬",
  health: "📊",
  system: "⚙️",
};
const typeBg: Record<string, string> = {
  medication: "var(--brand-50)",
  appointment: "var(--info-bg)",
  refill: "var(--warning-bg)",
  lab: "var(--purple-bg)",
  health: "var(--success-bg)",
  system: "var(--n-100)",
};
const typeColor: Record<string, string> = {
  medication: "var(--brand-600)",
  appointment: "var(--info)",
  refill: "var(--warning)",
  lab: "var(--purple)",
  health: "var(--success)",
  system: "var(--n-600)",
};
const priorityBadge: Record<string, { cls: string; label: string }> = {
  high: { cls: "badge-red", label: "High" },
  medium: { cls: "badge-yellow", label: "Medium" },
  low: { cls: "badge-slate", label: "Low" },
};

const allNotifs = [
  ...notifications,
  {
    id: "n7",
    type: "system",
    title: "App updated to v2.4",
    body: "New features: OCR prescription scanner, dark mode support, and medication interaction checker.",
    time: "10:00 AM",
    date: "Jun 5",
    read: true,
    priority: "low",
  },
  {
    id: "n8",
    type: "appointment",
    title: "Appointment reminder",
    body: "Annual physical with Dr. Torres on Jun 28 at 9:00 AM — confirmed.",
    time: "9:00 AM",
    date: "Jun 4",
    read: true,
    priority: "medium",
  },
  {
    id: "n9",
    type: "medication",
    title: "Missed dose alert",
    body: "You missed your Atorvastatin 20mg evening dose yesterday at 8:00 PM.",
    time: "9:02 PM",
    date: "Jun 7",
    read: true,
    priority: "high",
  },
];

export default function NotificationsPage() {
  const [filter, setFilter] = useState("all");
  const [readState, setReadState] = useState<Record<string, boolean>>(
    Object.fromEntries(allNotifs.map((n) => [n.id, n.read]))
  );

  const filters = [
    { key: "all", label: "All", count: allNotifs.length },
    { key: "unread", label: "Unread", count: allNotifs.filter((n) => !n.read).length },
    { key: "medication", label: "Medications", count: allNotifs.filter((n) => n.type === "medication").length },
    { key: "appointment", label: "Appointments", count: allNotifs.filter((n) => n.type === "appointment").length },
    { key: "refill", label: "Refills", count: allNotifs.filter((n) => n.type === "refill").length },
  ];

  const filtered = allNotifs.filter((n) => {
    if (filter === "unread") return !readState[n.id];
    if (filter === "all") return true;
    return n.type === filter;
  });

  const markAll = () =>
    setReadState(Object.fromEntries(allNotifs.map((n) => [n.id, true])));

  const markOne = (id: string) =>
    setReadState((s) => ({ ...s, [id]: true }));

  const unreadCount = allNotifs.filter((n) => !readState[n.id]).length;

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
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: 5, right: 5,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "var(--danger)", border: "1.5px solid white",
                }} />
              )}
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
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {unreadCount > 0 && (
            <button className="btn btn-secondary" onClick={markAll}>
              ✓ Mark all read
            </button>
          )}
          <button className="btn btn-secondary">⚙ Preferences</button>
        </div>
      </div>

      <div className="page-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Stats */}
        <div className="anim-fade-up d1" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {[
            { label: "Total", value: allNotifs.length, icon: "🔔", bg: "var(--brand-50)", color: "var(--brand-600)" },
            { label: "Unread", value: unreadCount, icon: "●", bg: unreadCount > 0 ? "var(--danger-bg)" : "var(--success-bg)", color: unreadCount > 0 ? "var(--danger)" : "var(--success)" },
            { label: "High priority", value: allNotifs.filter((n) => n.priority === "high").length, icon: "⚡", bg: "var(--warning-bg)", color: "var(--warning)" },
            { label: "This week", value: allNotifs.filter((n) => n.date.includes("Today") || n.date.includes("Yesterday") || n.date.includes("Jun")).length, icon: "📅", bg: "var(--info-bg)", color: "var(--info)" },
          ].map((s) => (
            <div key={s.label} className="card card-p" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 26, lineHeight: 1, color: "var(--n-900)" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="anim-fade-up d2" style={{ display: "flex", gap: 6, padding: "2px 0" }}>
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`btn btn-sm ${filter === f.key ? "btn-primary" : "btn-secondary"}`}
              style={{ gap: 7 }}
            >
              {f.label}
              <span style={{
                minWidth: 20, height: 20, borderRadius: "99px",
                background: filter === f.key ? "rgba(255,255,255,.25)" : "var(--n-200)",
                color: filter === f.key ? "white" : "var(--n-600)",
                fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
              }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="anim-fade-up d3 card" style={{ overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--n-700)", marginBottom: 6 }}>All caught up!</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>No notifications in this category.</div>
            </div>
          ) : (
            filtered.map((notif, i) => {
              const isUnread = !readState[notif.id];
              return (
                <div
                  key={notif.id}
                  className={`notif-row ${isUnread ? "unread" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => markOne(notif.id)}
                >
                  {/* Icon */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                    background: typeBg[notif.type] || "var(--n-100)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20,
                  }}>
                    {typeIcon[notif.type] || "🔔"}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 13.5, fontWeight: isUnread ? 700 : 500,
                        color: "var(--n-900)",
                      }}>
                        {notif.title}
                      </span>
                      {isUnread && (
                        <span style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: "var(--brand-500)", flexShrink: 0,
                        }} />
                      )}
                      <span className={`badge ${priorityBadge[notif.priority]?.cls || "badge-slate"}`}>
                        {priorityBadge[notif.priority]?.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>
                      {notif.body}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--n-400)" }}>{notif.date} · {notif.time}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em",
                        color: typeColor[notif.type] || "var(--n-500)",
                        background: typeBg[notif.type] || "var(--n-100)",
                        padding: "2px 7px", borderRadius: 99,
                      }}>
                        {notif.type}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                    {isUnread ? (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 12, color: "var(--brand-600)" }}
                        onClick={(e) => { e.stopPropagation(); markOne(notif.id); }}
                      >
                        Mark read
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--n-400)" }}>Read</span>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 12, color: "var(--danger)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Notification preferences CTA */}
        <div className="anim-fade-up d4" style={{
          background: "linear-gradient(135deg, var(--brand-600) 0%, var(--brand-800) 100%)",
          borderRadius: "var(--r-lg)", padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
        }}>
          <div style={{ color: "white" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 4 }}>
              Customize your alerts
            </div>
            <div style={{ fontSize: 13, opacity: .75 }}>
              Control when and how you receive medication reminders, health alerts, and appointment notifications.
            </div>
          </div>
          <Link href="/settings">
            <button className="btn" style={{ background: "rgba(255,255,255,.15)", color: "white", border: "1px solid rgba(255,255,255,.25)", flexShrink: 0 }}>
              ⚙ Notification settings →
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}