// src/data/aiAssistantData.ts

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  type?: "text" | "card" | "list";
  cards?: AssistantCard[];
  listItems?: string[];
}

export interface AssistantCard {
  icon: string;
  title: string;
  value: string;
  color: string;
  bg: string;
}

export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  prompt: string;
  color: string;
  bg: string;
}

export interface ConversationHistoryItem {
  id: string;
  title: string;
  preview: string;
  date: string;
  icon: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "scan",
    icon: "📷",
    label: "Scan Prescription",
    prompt: "I want to scan a new prescription",
    color: "var(--brand-600)",
    bg: "var(--brand-50)",
  },
  {
    id: "strip",
    icon: "💊",
    label: "Scan Medicine Strip",
    prompt: "Scan my medicine strip to log doses",
    color: "var(--purple)",
    bg: "var(--purple-bg)",
  },
  {
    id: "reminder",
    icon: "⏰",
    label: "Reschedule Reminder",
    prompt: "Help me reschedule my medication reminders",
    color: "var(--warning)",
    bg: "var(--warning-bg)",
  },
  {
    id: "refill",
    icon: "🔄",
    label: "Check Refills",
    prompt: "Which of my medications need a refill soon?",
    color: "var(--info)",
    bg: "var(--info-bg)",
  },
  {
    id: "expiry",
    icon: "📅",
    label: "Check Expiry",
    prompt: "Check expiry dates for all my medications",
    color: "var(--danger)",
    bg: "var(--danger-bg)",
  },
  {
    id: "explain",
    icon: "🔬",
    label: "Explain Medicine",
    prompt: "Explain one of my current medications to me",
    color: "var(--success)",
    bg: "var(--success-bg)",
  },
];

export const CONVERSATION_HISTORY: ConversationHistoryItem[] = [
  {
    id: "h1",
    title: "Lisinopril side effects",
    preview: "We discussed the dry cough side effect and alternatives...",
    date: "Yesterday",
    icon: "💊",
  },
  {
    id: "h2",
    title: "Metformin with food",
    preview: "Taking Metformin with meals reduces stomach upset...",
    date: "Jun 6",
    icon: "🍽️",
  },
  {
    id: "h3",
    title: "Blood pressure targets",
    preview: "Your target BP should be below 120/80 mmHg...",
    date: "Jun 4",
    icon: "🩺",
  },
  {
    id: "h4",
    title: "HbA1c improvement plan",
    preview: "Diet changes and consistent Metformin use are key...",
    date: "Jun 2",
    icon: "📊",
  },
  {
    id: "h5",
    title: "Vitamin D absorption tips",
    preview: "Take Vitamin D3 with a fatty meal for best absorption...",
    date: "May 30",
    icon: "☀️",
  },
];

export const AI_RESPONSES: Record<string, ChatMessage> = {
  scan: {
    id: "r-scan",
    role: "assistant",
    content:
      "I'll help you scan your prescription. Please point your camera at the prescription label or document. Make sure the text is clear and well-lit for accurate recognition.\n\nI can extract: medication name, dosage, frequency, prescriber info, and refill date.",
    timestamp: "",
    type: "text",
  },
  strip: {
    id: "r-strip",
    role: "assistant",
    content:
      "Medicine strip scan mode activated. Hold your blister pack or strip packaging up to the camera. I'll identify each pill compartment and help you log which doses have been taken today.\n\nThis works best with standard blister packs. Keep the strip flat and in good lighting.",
    timestamp: "",
    type: "text",
  },
  reminder: {
    id: "r-reminder",
    role: "assistant",
    content:
      "I can help you reschedule your medication reminders. Here are your current reminders:",
    timestamp: "",
    type: "card",
    cards: [
      { icon: "💊", title: "Metformin", value: "8:00 AM & 8:00 PM", color: "var(--brand-600)", bg: "var(--brand-50)" },
      { icon: "💊", title: "Lisinopril", value: "12:00 PM", color: "var(--purple)", bg: "var(--purple-bg)" },
      { icon: "💊", title: "Atorvastatin", value: "8:00 PM", color: "var(--warning)", bg: "var(--warning-bg)" },
      { icon: "💊", title: "Vitamin D3", value: "8:00 AM", color: "var(--info)", bg: "var(--info-bg)" },
    ],
  },
  refill: {
    id: "r-refill",
    role: "assistant",
    content: "Here's your refill status. Lisinopril needs immediate attention:",
    timestamp: "",
    type: "card",
    cards: [
      { icon: "⚠️", title: "Lisinopril 10mg", value: "8 pills left — Refill by Jun 20", color: "var(--danger)", bg: "var(--danger-bg)" },
      { icon: "✅", title: "Metformin 500mg", value: "24 pills — Refill Jul 1", color: "var(--success)", bg: "var(--success-bg)" },
      { icon: "✅", title: "Atorvastatin 20mg", value: "45 pills — Refill Jul 10", color: "var(--success)", bg: "var(--success-bg)" },
      { icon: "✅", title: "Vitamin D3 2000IU", value: "55 pills — Refill Aug 1", color: "var(--success)", bg: "var(--success-bg)" },
    ],
  },
  expiry: {
    id: "r-expiry",
    role: "assistant",
    content: "All your medications are within their valid dates. Here's a summary:",
    timestamp: "",
    type: "list",
    listItems: [
      "✅ Metformin 500mg — Expires Dec 2025",
      "✅ Lisinopril 10mg — Expires Aug 2025",
      "✅ Atorvastatin 20mg — Expires Mar 2026",
      "✅ Vitamin D3 2000IU — Expires Jan 2026",
    ],
  },
  explain: {
    id: "r-explain",
    role: "assistant",
    content:
      "**Metformin (Metformin HCl 500mg)**\n\nMetformin is a first-line medication for Type 2 Diabetes. It works by:\n\n• Reducing glucose production in the liver\n• Improving insulin sensitivity in muscle cells\n• Slowing intestinal glucose absorption\n\n**Your dose:** 500mg twice daily with meals\n**Important:** Always take with food to minimize stomach side effects. Avoid alcohol.",
    timestamp: "",
    type: "text",
  },
  default: {
    id: "r-default",
    role: "assistant",
    content:
      "I'm your MediTrack health assistant. I can help you understand your medications, check for interactions, set reminders, scan prescriptions, and answer health questions. How can I help you today?",
    timestamp: "",
    type: "text",
  },
};

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "init-1",
    role: "assistant",
    content:
      "Hello, Alex! 👋 I'm your MediTrack AI health assistant. I can help you understand your medications, check for drug interactions, scan prescriptions, and answer health questions.\n\nWhat would you like help with today?",
    timestamp: "9:00 AM",
    type: "text",
  },
];

export const HEALTH_SIDEBAR_STATS = [
  { label: "Adherence", value: "91%", icon: "📊", color: "var(--brand-600)", bg: "var(--brand-50)" },
  { label: "Heart Rate", value: "72 bpm", icon: "♥", color: "var(--danger)", bg: "var(--danger-bg)" },
  { label: "Blood Glucose", value: "94 mg/dL", icon: "🩸", color: "var(--warning)", bg: "var(--warning-bg)" },
  { label: "Blood Pressure", value: "118/76", icon: "🩺", color: "var(--success)", bg: "var(--success-bg)" },
];

export const ACTIVE_MEDS_SUMMARY = [
  { name: "Metformin", dosage: "500mg", times: "8AM & 8PM", taken: true, color: "var(--brand-50)" },
  { name: "Lisinopril", dosage: "10mg", times: "12PM", taken: false, color: "var(--purple-bg)" },
  { name: "Atorvastatin", dosage: "20mg", times: "8PM", taken: false, color: "var(--warning-bg)" },
  { name: "Vitamin D3", dosage: "2000IU", times: "8AM", taken: true, color: "var(--info-bg)" },
];