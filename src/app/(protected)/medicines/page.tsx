import type { Metadata } from "next";
import Topbar from "@/components/Topbar";
import { medicines } from "@/utils/mockData";

export const metadata: Metadata = { title: "Medicines" };

export default function MedicinesPage() {
  const takenCount = medicines.filter(m => m.takenToday).length;

  return (
    <div className="app-main-inner">
      <Topbar
        title="Medicines"
        subtitle="Manage your prescriptions and track daily adherence"
        actions={
          <>
            <button className="btn btn-secondary">📋 Interaction Check</button>
            <button className="btn btn-primary">+ Add Medicine</button>
          </>
        }
      />

      <div className="page-body" style={{ display: "flex", flexDirection: "column", gap: 22 }}>

        {/* Summary strip */}
        <div className="anim-fade-up d1" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {[
            { label: "Total medicines",  value: medicines.length,  icon: "💊", bg: "var(--brand-50)",   color: "var(--brand-600)" },
            { label: "Taken today",      value: `${takenCount}/${medicines.length}`, icon: "✅", bg: "var(--success-bg)", color: "var(--success)" },
            { label: "Refills needed",   value: 1,                 icon: "⚠️", bg: "var(--warning-bg)", color: "var(--warning)" },
            { label: "Adherence rate",   value: "91%",             icon: "📈", bg: "var(--info-bg)",    color: "var(--info)"    },
          ].map(s => (
            <div key={s.label} className="card card-p" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>
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

        {/* Today's schedule */}
        <div className="anim-fade-up d2 card card-p">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)" }}>Today's Schedule</h3>
            <div className="progress" style={{ width: 140, height: 7 }}>
              <div className="progress-bar" style={{
                width: `${(takenCount / medicines.length) * 100}%`,
                background: "var(--brand-500)",
              }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {medicines.map(med => (
              <div key={med.id} className="med-row">
                <div className="med-pill-icon" style={{ background: med.colorBg }}>{
                  med.form === "Softgel" ? "🫐" : "💊"
                }</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--n-800)" }}>{med.name}</span>
                    <span className="badge badge-slate" style={{ fontSize: 11 }}>{med.category}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{med.dosage} · {med.frequency}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>⏰ {med.times.join(" · ")}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {med.takenToday
                    ? <span className="badge badge-green">✓ Done</span>
                    : <button className="btn btn-secondary btn-sm">Log dose</button>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed cards */}
        <div className="anim-fade-up d3">
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)", marginBottom: 14 }}>All Prescriptions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {medicines.map(med => {
              const pctLeft = Math.round((med.pillsLeft / med.totalPills) * 100);
              const isLow = pctLeft < 30;
              return (
                <div key={med.id} className="card" style={{ padding: "20px 22px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14, background: med.colorBg,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0,
                      border: `1.5px solid ${med.color}30`,
                    }}>💊</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)" }}>{med.name}</span>
                        {med.takenToday
                          ? <span className="badge badge-green">✓ Taken</span>
                          : <span className="badge badge-yellow">Pending</span>
                        }
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                        {med.genericName} · {med.dosage} {med.form}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
                        Prescribed by {med.prescriber}
                      </div>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    {[
                      ["Condition", med.condition],
                      ["Frequency", med.frequency],
                      ["Schedule",  med.times.join(", ")],
                      ["Refill",    med.refillDate],
                    ].map(([lbl, val]) => (
                      <div key={lbl} style={{
                        padding: "9px 11px", background: "var(--n-50)",
                        borderRadius: "var(--r-sm)", border: "1px solid var(--border-subtle)",
                      }}>
                        <div style={{ fontSize: 11, color: "var(--n-400)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 2 }}>{lbl}</div>
                        <div style={{ fontSize: 13, color: "var(--n-700)", fontWeight: 500 }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Pills remaining */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 5 }}>
                      <span>Pills remaining</span>
                      <span style={{ color: isLow ? "var(--danger)" : "var(--n-600)", fontWeight: 600 }}>
                        {med.pillsLeft} / {med.totalPills}
                        {isLow && " — Refill soon"}
                      </span>
                    </div>
                    <div className="progress" style={{ height: 6 }}>
                      <div className="progress-bar" style={{
                        width: `${pctLeft}%`,
                        background: isLow ? "var(--danger)" : "var(--brand-500)",
                      }} />
                    </div>
                  </div>

                  {/* Instructions */}
                  <div style={{
                    marginTop: 12, padding: "10px 12px",
                    background: "var(--info-bg)", borderRadius: "var(--r-sm)",
                    border: "1px solid var(--info-border)",
                    fontSize: 12.5, color: "var(--info)", lineHeight: 1.5,
                  }}>
                    ℹ️ {med.instructions}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Edit</button>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Request refill</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }}>Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side effects info */}
        <div className="anim-fade-up d4 card card-p">
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)", marginBottom: 4 }}>Common Side Effects</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>Known effects for your current prescriptions</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {medicines.slice(0,4).map(med => (
              <div key={med.id} style={{
                padding: "13px 15px", background: "var(--n-50)",
                borderRadius: "var(--r-md)", border: "1px solid var(--border-subtle)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--n-800)", marginBottom: 8 }}>
                  {med.name}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {med.sideEffects.map(se => (
                    <span key={se} className="badge badge-slate">{se}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}