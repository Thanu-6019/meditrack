// src/data/reportsData.ts

export interface AdherenceByDay {
  day: string;
  rate: number;
  taken: number;
  missed: number;
}

export interface AdherenceByWeek {
  week: string;
  rate: number;
  taken: number;
  missed: number;
}

export interface AdherenceByMed {
  name: string;
  rate: number;
  taken: number;
  missed: number;
  color: string;
  colorBg: string;
}

export interface HealthTrendPoint {
  date: string;
  heartRate: number;
  systolic: number;
  glucose: number;
  weight: number;
}

export interface DoseTime {
  hour: string;
  doses: number;
  missed: number;
}

export interface MissReason {
  reason: string;
  count: number;
  pct: number;
}

export interface HbA1cEntry {
  quarter: string;
  val: number;
  status: "high" | "warn" | "good";
}

export interface SummaryStatCard {
  icon: string;
  iconBg: string;
  val: string;
  lbl: string;
  trend: string;
  dir: "good" | "neutral" | "warn";
}

export interface LatestHealthReading {
  icon: string;
  iconBg: string;
  val: string;
  unit: string;
  lbl: string;
  delta: string;
}

export interface Insight {
  type: "positive" | "warn";
  icon: string;
  iconBg: string;
  borderColor: string;
  textColor: string;
  tag: string;
  title: string;
  body: string;
}

export interface Recommendation {
  icon: string;
  priority: "High" | "Medium" | "Low";
  text: string;
  action: string;
}

export const ADHERENCE_BY_DAY: AdherenceByDay[] = [
  { day: "Mon", rate: 100, taken: 4, missed: 0 },
  { day: "Tue", rate: 75,  taken: 3, missed: 1 },
  { day: "Wed", rate: 100, taken: 4, missed: 0 },
  { day: "Thu", rate: 50,  taken: 2, missed: 2 },
  { day: "Fri", rate: 100, taken: 4, missed: 0 },
  { day: "Sat", rate: 75,  taken: 3, missed: 1 },
  { day: "Sun", rate: 100, taken: 4, missed: 0 },
];

export const ADHERENCE_BY_WEEK: AdherenceByWeek[] = [
  { week: "May 6",  rate: 86, taken: 24, missed: 4 },
  { week: "May 13", rate: 93, taken: 26, missed: 2 },
  { week: "May 20", rate: 79, taken: 22, missed: 6 },
  { week: "May 27", rate: 96, taken: 27, missed: 1 },
  { week: "Jun 3",  rate: 89, taken: 25, missed: 3 },
  { week: "Jun 10", rate: 93, taken: 26, missed: 2 },
];

export const ADHERENCE_BY_MED: AdherenceByMed[] = [
  { name: "Metformin",    rate: 91, taken: 39, missed: 4, color: "var(--brand-500)", colorBg: "#edfaf7" },
  { name: "Lisinopril",   rate: 78, taken: 33, missed: 9, color: "var(--purple)",    colorBg: "#faf5ff" },
  { name: "Atorvastatin", rate: 95, taken: 41, missed: 2, color: "var(--success)",   colorBg: "#fffbeb" },
  { name: "Vitamin D3",   rate: 100,taken: 43, missed: 0, color: "var(--info)",      colorBg: "#eff6ff" },
];

export const HEALTH_TREND_DATA: HealthTrendPoint[] = [
  { date: "May 25", heartRate: 73, systolic: 123, glucose: 99, weight: 72.1 },
  { date: "May 28", heartRate: 71, systolic: 118, glucose: 93, weight: 71.9 },
  { date: "May 30", heartRate: 75, systolic: 121, glucose: 95, weight: 71.8 },
  { date: "Jun 2",  heartRate: 68, systolic: 119, glucose: 98, weight: 71.6 },
  { date: "Jun 4",  heartRate: 74, systolic: 122, glucose: 91, weight: 71.4 },
  { date: "Jun 6",  heartRate: 70, systolic: 120, glucose: 97, weight: 71.5 },
  { date: "Jun 8",  heartRate: 72, systolic: 118, glucose: 94, weight: 71.2 },
];

export const DOSE_TIMES: DoseTime[] = [
  { hour: "6 AM",  doses: 1, missed: 0 },
  { hour: "8 AM",  doses: 2, missed: 0 },
  { hour: "12 PM", doses: 1, missed: 1 },
  { hour: "6 PM",  doses: 0, missed: 0 },
  { hour: "8 PM",  doses: 2, missed: 1 },
];

export const MISS_REASONS: MissReason[] = [
  { reason: "Forgot",         count: 5, pct: 42 },
  { reason: "Away from home", count: 4, pct: 33 },
  { reason: "Ran out",        count: 2, pct: 17 },
  { reason: "Side effects",   count: 1, pct: 8  },
];

export const HBA1C_HISTORY: HbA1cEntry[] = [
  { quarter: "Q2 2023", val: 7.2, status: "high" },
  { quarter: "Q3 2023", val: 6.1, status: "warn" },
  { quarter: "Q4 2023", val: 5.7, status: "good" },
  { quarter: "Q1 2024", val: 5.4, status: "good" },
];

export const SUMMARY_STATS: SummaryStatCard[] = [
  { icon: "📊", iconBg: "var(--brand-50)",   val: "91%", lbl: "Overall adherence",    trend: "+3% vs last period", dir: "good"    },
  { icon: "✅", iconBg: "var(--success-bg)", val: "147", lbl: "Doses taken on time",  trend: "Last 30 days",       dir: "neutral" },
  { icon: "⚠️", iconBg: "var(--warning-bg)", val: "12",  lbl: "Doses missed",          trend: "7.5% miss rate",     dir: "warn"    },
  { icon: "🔥", iconBg: "var(--purple-bg)",  val: "11",  lbl: "Day streak",            trend: "Personal best: 18d", dir: "good"    },
];

export const LATEST_HEALTH_READINGS: LatestHealthReading[] = [
  { icon: "♥",  iconBg: "#fff1f2", val: "72",     unit: "bpm",   lbl: "Heart Rate",      delta: "+2"  },
  { icon: "🩺", iconBg: "#f0fdf4", val: "118/76", unit: "mmHg",  lbl: "Blood Pressure",  delta: "−4"  },
  { icon: "🩸", iconBg: "#fffbeb", val: "94",     unit: "mg/dL", lbl: "Blood Glucose",   delta: "−3"  },
  { icon: "⚖",  iconBg: "#f5f3ff", val: "71.2",  unit: "kg",    lbl: "Weight",           delta: "−0.3"},
];

export const INSIGHTS: Insight[] = [
  {
    type: "positive",
    icon: "🎯",
    iconBg: "var(--success-bg)",
    borderColor: "var(--success-border)",
    textColor: "var(--success)",
    tag: "Strength",
    title: "Strong evening adherence",
    body: "You take your 8 PM doses on time 98% of the time. Your evening routine is your most reliable window — consider scheduling any new medicines then.",
  },
  {
    type: "warn",
    icon: "⚠️",
    iconBg: "var(--warning-bg)",
    borderColor: "var(--warning-border)",
    textColor: "var(--warning)",
    tag: "Watch",
    title: "Lunchtime doses are your weak spot",
    body: "Lisinopril (12 PM) is missed 22% of the time — 3× more than your other medications. Consider setting a calendar alert or moving the dose to breakfast.",
  },
  {
    type: "positive",
    icon: "📈",
    iconBg: "var(--brand-50)",
    borderColor: "var(--brand-100)",
    textColor: "var(--brand-600)",
    tag: "Trend",
    title: "HbA1c responding to treatment",
    body: "Your blood sugar control has improved from 7.2% to 5.4% over 12 months — well within the normal range. This correlates with your Metformin adherence staying above 90%.",
  },
  {
    type: "positive",
    icon: "🏆",
    iconBg: "var(--purple-bg)",
    borderColor: "var(--purple-border)",
    textColor: "var(--purple)",
    tag: "Milestone",
    title: "11-day streak achieved",
    body: "You've taken all scheduled doses for 11 consecutive days — your second-longest streak. Your previous best was 18 days in February.",
  },
];

export const RECOMMENDATIONS: Recommendation[] = [
  { icon: "⏰", priority: "High",   text: "Set a 12 PM alarm specifically for Lisinopril — your most-missed dose.", action: "Set reminder" },
  { icon: "💊", priority: "Medium", text: "Your Lisinopril supply runs out in 8 days. Request a refill to avoid a gap.", action: "Request refill" },
  { icon: "🩺", priority: "Medium", text: "Your next HbA1c test is overdue. Schedule a lab visit with Dr. Chen.", action: "Book appointment" },
  { icon: "📊", priority: "Low",    text: "Log your weight daily this week to complete your 30-day trend baseline.", action: "Log weight" },
];

export const RADIAL_DATA = [{ name: "Overall", value: 91, fill: "var(--brand-500)" }];

export const OVERALL_ADHERENCE = 91;