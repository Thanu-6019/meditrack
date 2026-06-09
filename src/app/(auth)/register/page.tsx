import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Create Account" };

const features = [
  { icon: "📊", title: "Vital Monitoring",      desc: "Track heart rate, BP, glucose, and more in real time." },
  { icon: "💊", title: "Medication Manager",    desc: "Smart reminders, refill alerts, and interaction checks." },
  { icon: "🔬", title: "Lab Result Tracking",   desc: "Securely store and share your lab history with doctors." },
];

export default function RegisterPage() {
  return (
    <div className="auth-shell">
      {/* Left panel */}
      <div className="auth-panel">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 52 }}>
            <div style={{
              width: 36, height: 36, background: "rgba(255,255,255,.18)", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 17,
            }}>✚</div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 21, color: "white" }}>
              Medi<em>Track</em>
            </span>
          </div>

          <h2 style={{
            fontFamily: "var(--font-display)", fontSize: 40, color: "white",
            lineHeight: 1.15, letterSpacing: "-.03em", marginBottom: 18,
          }}>
            Start your<br />health journey<br /><em>today.</em>
          </h2>
          <p style={{ color: "rgba(255,255,255,.55)", fontSize: 15, lineHeight: 1.75, maxWidth: 340, marginBottom: 36 }}>
            Join 50,000+ patients taking control of their health with MediTrack's comprehensive platform.
          </p>

          {features.map(f => (
            <div key={f.title} style={{
              display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16,
              padding: "14px 16px",
              background: "rgba(255,255,255,.06)", borderRadius: 12,
              border: "1px solid rgba(255,255,255,.08)",
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ color: "white", fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{f.title}</div>
                <div style={{ color: "rgba(255,255,255,.5)", fontSize: 12.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.35)", lineHeight: 1.6 }}>
            Free forever for individuals. No credit card required.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="auth-form-side">
        <div className="auth-form-box anim-fade-up">
          <div style={{ marginBottom: 30 }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--n-900)", letterSpacing: "-.025em", marginBottom: 6 }}>
              Create your account
            </h1>
            <p style={{ fontSize: 13.5, color: "var(--muted)" }}>Free to use · No credit card needed</p>
          </div>

          <form style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label className="field-label">First Name</label>
                <input type="text" className="input" placeholder="Alex" />
              </div>
              <div className="field">
                <label className="field-label">Last Name</label>
                <input type="text" className="input" placeholder="Johnson" />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Email address</label>
              <div className="input-wrap">
                <span className="input-icon">✉</span>
                <input type="email" className="input" placeholder="you@example.com" />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Date of Birth</label>
              <input type="date" className="input" />
            </div>

            <div className="field">
              <label className="field-label">Password</label>
              <div className="input-wrap">
                <span className="input-icon">🔒</span>
                <input type="password" className="input" placeholder="Min. 8 characters" />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Primary care provider (optional)</label>
              <input type="text" className="input" placeholder="Dr. Smith — General Practice" />
            </div>

            {/* Password strength */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 5 }}>
                <span>Password strength</span>
                <span style={{ color: "var(--success)", fontWeight: 600 }}>Strong</span>
              </div>
              <div className="progress" style={{ height: 4 }}>
                <div className="progress-bar" style={{ width: "80%", background: "var(--success)" }} />
              </div>
            </div>

            <label style={{ display: "flex", gap: 10, alignItems: "flex-start",
              padding: "10px 13px", background: "var(--n-50)", borderRadius: "var(--r-sm)",
              border: "1.5px solid var(--border)", fontSize: 13, color: "var(--n-600)", cursor: "pointer" }}>
              <input type="checkbox" defaultChecked style={{ accentColor: "var(--brand-500)", marginTop: 2 }} />
              <span>I agree to the{" "}
                <a href="#" style={{ color: "var(--brand-600)", fontWeight: 600 }}>Terms of Service</a>{" "}
                and{" "}
                <a href="#" style={{ color: "var(--brand-600)", fontWeight: 600 }}>Privacy Policy</a>
              </span>
            </label>

            <Link href="/dashboard">
              <button type="button" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
                Create my MediTrack account
              </button>
            </Link>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "22px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--n-400)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["🍎", "Apple"], ["🔵", "Google"]].map(([icon, name]) => (
              <button key={name} className="btn btn-secondary" style={{ justifyContent: "center" }}>
                {icon} {name}
              </button>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginTop: 22 }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--brand-600)", fontWeight: 700 }}>
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}