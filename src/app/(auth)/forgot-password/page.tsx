import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Reset Password" };

export default function ForgotPasswordPage() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, var(--brand-900) 0%, var(--brand-700) 100%)",
      padding: 24,
    }}>
      <div style={{
        background: "white", borderRadius: "var(--r-xl)", padding: "44px 40px",
        width: "100%", maxWidth: 440, boxShadow: "var(--shadow-xl)",
      }}
      className="anim-scale-in">
        {/* Back link */}
        <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 13, color: "var(--muted)", marginBottom: 28, fontWeight: 500 }}>
          ← Back to sign in
        </Link>

        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "var(--brand-50)", border: "2px solid var(--brand-100)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, marginBottom: 20,
        }}>🔑</div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--n-900)",
          letterSpacing: "-.025em", marginBottom: 8 }}>
          Reset your password
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 28 }}>
          Enter your email address and we'll send you a secure link to reset your password.
        </p>

        <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field">
            <label className="field-label">Email address</label>
            <div className="input-wrap">
              <span className="input-icon">✉</span>
              <input type="email" className="input" placeholder="you@example.com" />
            </div>
          </div>

          <button type="button" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
            Send reset link
          </button>
        </form>

        <div style={{
          marginTop: 24, padding: "14px 16px",
          background: "var(--brand-50)", borderRadius: "var(--r-sm)",
          border: "1px solid var(--brand-100)",
          fontSize: 13, color: "var(--brand-700)", lineHeight: 1.55,
        }}>
          💡 Check your spam folder if you don't see the email within a few minutes.
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginTop: 22 }}>
          Remember your password?{" "}
          <Link href="/login" style={{ color: "var(--brand-600)", fontWeight: 700 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}