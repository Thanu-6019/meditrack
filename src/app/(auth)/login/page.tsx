"use client";
// src/app/(auth)/login/page.tsx
//
// KEY CHANGES FROM PREVIOUS VERSION
// ───────────────────────────────────
// 1. "use client" directive added — required for useState / useRouter / onSubmit.
// 2. handleSubmit() calls POST /api/auth/login with credentials:"include" so
//    the browser stores the Set-Cookie header the API sends back.
// 3. router.push("/dashboard") only runs AFTER the API confirms success.
//    No Link href="/dashboard" wrapping the button — that was the root cause
//    of the redirect loop (navigated to /dashboard without a cookie).
// 4. callbackUrl query param is respected: if middleware sent the user here
//    from a protected page (e.g. /medicines), we redirect back there.
// 5. Loading + error states added for UX and to prevent double-submit.
// 6. Colors improved throughout: stronger brand contrast, better muted tones,
//    error banner with correct semantic color, loading spinner.

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [email,    setEmail]    = useState("alex.johnson@email.com");
  const [password, setPassword] = useState("password123");
  const [remember, setRemember] = useState(true);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // ── Form submission ─────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;           // prevent double-submit

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method:      "POST",
        credentials: "include",    // CRITICAL: browser must store Set-Cookie
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      let data: { success: boolean; error?: { message: string } };
      try {
        data = await res.json();
      } catch {
        setError("Unexpected server response. Please try again.");
        return;
      }

      if (!res.ok || !data.success) {
        setError(data.error?.message ?? "Invalid email or password.");
        return;
      }

      // Cookie is now set. Navigate to the originally-requested page or dashboard.
      const callbackUrl = searchParams.get("callbackUrl");
      const destination =
        callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
          ? callbackUrl
          : "/dashboard";

      router.push(destination);
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="auth-shell">

      {/* ── Left brand panel ─────────────────────────────────────────────── */}
      <div className="auth-panel">
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 52 }}>
            <div style={{
              width: 36, height: 36,
              background: "rgba(255,255,255,.22)",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 17,
            }}>✚</div>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: 21,
              color: "white", letterSpacing: "-.01em",
            }}>
              Medi<em>Track</em>
            </span>
          </div>

          <h2 style={{
            fontFamily: "var(--font-display)", fontSize: 44,
            color: "white", lineHeight: 1.12, letterSpacing: "-.03em", marginBottom: 18,
          }}>
            Your health,<br />
            <em>beautifully</em><br />
            managed.
          </h2>
          <p style={{
            color: "rgba(255,255,255,.6)", fontSize: 15, lineHeight: 1.8, maxWidth: 340,
          }}>
            Track medications, monitor vitals, and stay connected with your care team — all in one place.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3,1fr)",
            gap: 24, marginBottom: 28,
          }}>
            {[
              { v: "98%",  l: "Adherence" },
              { v: "4.9★", l: "Rating"    },
              { v: "50k+", l: "Patients"  },
            ].map(s => (
              <div key={s.l}>
                <div style={{
                  fontFamily: "var(--font-display)", fontSize: 28,
                  color: "white", letterSpacing: "-.02em",
                }}>{s.v}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Live reminder card */}
          <div style={{
            background: "rgba(255,255,255,.09)",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,.12)",
            backdropFilter: "blur(12px)",
            padding: "16px 18px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(255,255,255,.16)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>💊</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>
                Medication reminder
              </div>
              <div style={{ color: "rgba(255,255,255,.5)", fontSize: 12, marginTop: 1 }}>
                Lisinopril 10 mg · Due in 45 min
              </div>
            </div>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#fbbf24",
              animation: "pulse-dot 2s infinite",
            }} />
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="auth-form-side">
        <div className="auth-form-box anim-fade-up">

          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{
              fontFamily: "var(--font-display)", fontSize: 30,
              color: "var(--n-900)", letterSpacing: "-.025em", marginBottom: 6,
            }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: "var(--n-500)", lineHeight: 1.55 }}>
              Sign in to your MediTrack account
            </p>
          </div>

          {/* ── Error banner ───────────────────────────────────────────────── */}
          {error && (
            <div style={{
              marginBottom: 20,
              padding: "12px 16px",
              background: "var(--danger-bg)",
              border: "1px solid var(--danger-border)",
              borderRadius: "var(--r-sm)",
              display: "flex", gap: 10, alignItems: "flex-start",
              fontSize: 13.5, color: "var(--danger)", lineHeight: 1.5,
            }}>
              <span style={{ flexShrink: 0, fontSize: 15 }}>⚠️</span>
              {error}
            </div>
          )}

          {/* ── Form ────────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Email */}
            <div className="field">
              <label className="field-label" htmlFor="login-email">Email address</label>
              <div className="input-wrap">
                <span className="input-icon">✉</span>
                <input
                  id="login-email"
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="field-label" htmlFor="login-password">Password</label>
                <Link
                  href="/forgot-password"
                  style={{ fontSize: 12.5, color: "var(--brand-600)", fontWeight: 600 }}
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="input-wrap">
                <span className="input-icon">🔒</span>
                <input
                  id="login-password"
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Remember me */}
            <label style={{
              display: "flex", alignItems: "center", gap: 9, cursor: "pointer",
              padding: "10px 13px",
              background: "var(--n-50)",
              borderRadius: "var(--r-sm)",
              border: "1.5px solid var(--border)",
              fontSize: 13, color: "var(--n-600)",
              userSelect: "none",
            }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ accentColor: "var(--brand-500)", flexShrink: 0 }}
                disabled={loading}
              />
              Keep me signed in for 30 days
            </label>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: "100%", gap: 10, opacity: loading ? .8 : 1 }}
              disabled={loading}
            >
              {loading && (
                <span style={{
                  display: "inline-block",
                  width: 16, height: 16,
                  border: "2px solid rgba(255,255,255,.35)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin .65s linear infinite",
                  flexShrink: 0,
                }} />
              )}
              {loading ? "Signing in…" : "Sign in to MediTrack"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--n-400)" }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["🍎", "Apple"], ["🔵", "Google"]].map(([icon, name]) => (
              <button
                key={name}
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: "center" }}
              >
                {icon} {name}
              </button>
            ))}
          </div>

          {/* Register link */}
          <p style={{
            textAlign: "center", fontSize: 13,
            color: "var(--n-500)", marginTop: 24,
          }}>
            New to MediTrack?{" "}
            <Link href="/register" style={{ color: "var(--brand-600)", fontWeight: 700 }}>
              Create account →
            </Link>
          </p>

          {/* Trust badge */}
          <div style={{
            marginTop: 20, padding: "12px 14px",
            background: "var(--brand-50)",
            borderRadius: "var(--r-sm)",
            border: "1px solid var(--brand-100)",
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <span style={{ flexShrink: 0 }}>🔐</span>
            <p style={{ fontSize: 12, color: "var(--brand-700)", lineHeight: 1.55, margin: 0 }}>
              256-bit encrypted · HIPAA compliant · Your health data stays private.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}