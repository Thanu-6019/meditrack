import Link from "next/link";
import { currentUser } from "@/utils/mockData";

interface Props { title: string; subtitle?: string; actions?: React.ReactNode; }

export default function Topbar({ title, subtitle, actions }: Props) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      {/* Sticky bar */}
      <div className="topbar">
        <div className="topbar-date">
          <span className="live-dot" />
          {dateStr}
        </div>
        <div className="topbar-actions">
          <Link href="/notifications">
            <button className="btn btn-ghost btn-icon" style={{ position: "relative" }} aria-label="Notifications">
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

      {/* Page header */}
      <div className="page-hd anim-fade-up">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-sub">{subtitle}</p>}
        </div>
        {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
      </div>
    </>
  );
}