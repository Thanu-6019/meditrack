"use client";
// src/components/Sidebar.tsx
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { currentUser } from "@/utils/mockData";

const mainNav = [
  { href: "/dashboard",       icon: "⊞", label: "Dashboard" },
  { href: "/medicines",       icon: "💊", label: "Medicines",     badge: 1 },
  { href: "/health-metrics",  icon: "📊", label: "Health Metrics" },
  { href: "/ai-assistant",    icon: "✦",  label: "AI Assistant" },
  { href: "/scanner",         icon: "⬡",  label: "Scanner" },
  { href: "/notifications",   icon: "🔔", label: "Notifications", badge: 3 },
];

const accountNav = [
  { href: "/profile", icon: "◉", label: "Profile" },
];

export default function Sidebar() {
  const path   = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      // Always redirect to login, even if the fetch fails for some reason.
      router.push("/login");
    }
  }

  return (
    <aside className="sidebar anim-slide-in">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">✚</div>
        <span className="logo-name">Medi<em>Track</em></span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-group-lbl">Overview</div>
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${path === item.href ? "active" : ""}`}
          >
            <span className="nav-icon-wrap">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
          </Link>
        ))}

        <div className="nav-group-lbl" style={{ marginTop: 14 }}>Account</div>
        {accountNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${path === item.href ? "active" : ""}`}
          >
            <span className="nav-icon-wrap">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Health score widget */}
      <div className="sidebar-score">
        <div style={{
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: ".08em", opacity: .7, marginBottom: 8,
        }}>
          Health Score
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 32, lineHeight: 1 }}>
            {currentUser.healthScore}
          </span>
          <span style={{ fontSize: 12, opacity: .7 }}>/100 · Excellent</span>
        </div>
        <div className="progress" style={{ height: 5 }}>
          <div
            className="progress-bar"
            style={{ width: `${currentUser.healthScore}%`, background: "rgba(255,255,255,.8)" }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="nav-link" style={{ gap: 10, padding: "10px" }}>
          <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
            {currentUser.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: "var(--n-800)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {currentUser.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--n-400)" }}>Patient</div>
          </div>
        </div>

        {/* Sign out — calls the API to clear the HTTP-only cookie */}
        <button
          onClick={handleSignOut}
          className="nav-link"
          style={{ color: "var(--danger)", marginTop: 2, width: "100%", background: "none", border: "none", cursor: "pointer" }}
        >
          <span className="nav-icon-wrap">⏻</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}