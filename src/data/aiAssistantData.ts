// src/data/aiAssistantData.ts
import type { Message, SuggestedFlow } from "@/app/(protected)/ai-assistant/types";
import { medicines } from "@/utils/mockData";

// ─── Suggested flows shown on the sidebar + empty state ──────────────────────
export const SUGGESTED_FLOWS: SuggestedFlow[] = [
  {
    key: "prescription_scan",
    icon: "📋",
    title: "Review a prescription scan",
    subtitle: "Upload a photo and I'll extract and verify medicine names, dosages, and schedules.",
    tag: "OCR + Verify",
    tagClass: "badge-brand",
  },
  {
    key: "strip_scan",
    icon: "💊",
    title: "Scan a medicine strip",
    subtitle: "Identify a medicine from its packaging, check expiry, and add it to your schedule.",
    tag: "Identification",
    tagClass: "badge-blue",
  },
  {
    key: "reminder_reschedule",
    icon: "⏰",
    title: "Reschedule around meals",
    subtitle: "Tell me what you ate or when you're eating, and I'll suggest the best times for your doses.",
    tag: "Reminders",
    tagClass: "badge-green",
  },
  {
    key: "expiry_check",
    icon: "📅",
    title: "Check medicine expiry dates",
    subtitle: "Review which medicines in your cabinet are close to or past their expiry dates.",
    tag: "Expiry",
    tagClass: "badge-yellow",
  },
  {
    key: "refill_check",
    icon: "🔄",
    title: "Check refill status",
    subtitle: "See which prescriptions are running low and get help requesting a refill.",
    tag: "Refills",
    tagClass: "badge-red",
  },
  {
    key: "medicine_explain",
    icon: "🔬",
    title: "Explain a medicine",
    subtitle: "Understand what a medicine is for, how to take it, and what to watch out for.",
    tag: "Education",
    tagClass: "badge-purple",
  },
];

// ─── Welcome message ──────────────────────────────────────────────────────────
export function buildWelcomeMessage(firstName: string): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: `Hi ${firstName}! I'm your Medication Management Assistant. I can help you identify medicines, review prescription scans, set smarter reminders, and track refills or expiry dates. I don't give medical diagnoses — for anything clinical, your care team is the right call.`,
    timestamp: new Date(),
    quickReplies: [
      { label: "Scan a prescription", value: "prescription_scan", icon: "📋" },
      { label: "Check my refills", value: "refill_check", icon: "🔄" },
      { label: "Check expiry dates", value: "expiry_check", icon: "📅" },
      { label: "Explain a medicine", value: "medicine_explain", icon: "🔬" },
    ],
  };
}

// ─── Flow generators ──────────────────────────────────────────────────────────

export function getPrescriptionScanFlow(step: number, userInput: string): Message {
  const id = crypto.randomUUID();
  if (step === 0) {
    return {
      id,
      role: "assistant",
      content: "I'll help you review a prescription scan. Since we're in demo mode, I'll simulate a scan result for you. Here's what I found in a typical prescription image:",
      timestamp: new Date(),
      cards: [{
        type: "ocr_correction",
        data: {
          raw: "Metf0rmin 500mg — Twice D@ily\nLisin0pril 1Omg — Once Daly\nAtorvastat1n 20mg — Once Daiily (PM)",
          corrected: [
            { original: "Metf0rmin 500mg — Twice D@ily", fixed: "Metformin 500mg — Twice Daily", confidence: 98 },
            { original: "Lisin0pril 1Omg — Once Daly", fixed: "Lisinopril 10mg — Once Daily", confidence: 97 },
            { original: "Atorvastat1n 20mg — Once Daiily (PM)", fixed: "Atorvastatin 20mg — Once Daily (PM)", confidence: 99 },
          ],
          prescriber: "Dr. Sarah Chen",
          date: "Jun 1, 2026",
        },
      }],
      quickReplies: [
        { label: "Looks correct, add to schedule", value: "confirm_add", icon: "✓" },
        { label: "One name looks wrong", value: "correct_name", icon: "✏" },
        { label: "Check for duplicates", value: "check_dupes", icon: "🔍" },
      ],
    };
  }
  if (userInput.includes("confirm") || userInput.includes("correct") || userInput.includes("looks correct") || userInput.includes("confirm_add")) {
    return {
      id,
      role: "assistant",
      content: "All 3 medicines have been verified against your current schedule. I noticed Metformin and Lisinopril are already in your cabinet — I've skipped those to avoid duplicates. Atorvastatin 20mg is new and has been added with an 8 PM reminder.",
      timestamp: new Date(),
      cards: [{
        type: "scan_result",
        data: {
          added: ["Atorvastatin 20mg — 8:00 PM"],
          skipped: ["Metformin 500mg (already tracked)", "Lisinopril 10mg (already tracked)"],
        },
      }],
      quickReplies: [
        { label: "Set a reminder for Atorvastatin", value: "set_reminder", icon: "⏰" },
        { label: "What is Atorvastatin for?", value: "explain atorvastatin", icon: "🔬" },
        { label: "Done, thanks!", value: "done", icon: "✓" },
      ],
    };
  }
  return {
    id,
    role: "assistant",
    content: "No problem. Which medicine name looks incorrect? I can re-read it or let you type the correct name.",
    timestamp: new Date(),
    quickReplies: [
      { label: "Metformin is wrong", value: "fix_metformin", icon: "✏" },
      { label: "Lisinopril is wrong", value: "fix_lisinopril", icon: "✏" },
      { label: "Atorvastatin is wrong", value: "fix_atorvastatin", icon: "✏" },
    ],
  };
}

export function getStripScanFlow(step: number): Message {
  const id = crypto.randomUUID();
  if (step === 0) {
    return {
      id,
      role: "assistant",
      content: "I'll simulate reading a medicine strip from your cabinet. Here's what was identified:",
      timestamp: new Date(),
      cards: [{
        type: "medicine_info",
        data: {
          name: "Metformin HCl",
          brand: "Glucophage",
          strength: "500 mg",
          form: "Film-coated tablet",
          batchNo: "BN-4821-A",
          mfgDate: "Feb 2025",
          expiryDate: "Jan 2027",
          daysToExpiry: 236,
          alreadyTracked: true,
          instructions: "Take with meals. Do not crush.",
        },
      }],
      quickReplies: [
        { label: "Update expiry in my cabinet", value: "update_expiry", icon: "📅" },
        { label: "What should I know about this?", value: "explain metformin", icon: "🔬" },
        { label: "Update count", value: "update_count", icon: "🔢" },
      ],
    };
  }
  return {
    id,
    role: "assistant",
    content: "Done! Metformin expiry updated to January 2027 — that's 236 days away, so you're well covered. I'll remind you 60 days before it expires.",
    timestamp: new Date(),
    quickReplies: [
      { label: "Scan another strip", value: "strip_scan", icon: "💊" },
      { label: "Check all expiry dates", value: "expiry_check", icon: "📅" },
    ],
  };
}

export function getReminderRescheduleFlow(step: number, userInput: string): Message {
  const id = crypto.randomUUID();
  if (step === 0) {
    return {
      id,
      role: "assistant",
      content: "I can adjust your dose timing around your meals. Tell me — what time did you have (or plan to have) your last meal?",
      timestamp: new Date(),
      quickReplies: [
        { label: "Breakfast at 7 AM", value: "breakfast_7am", icon: "🍳" },
        { label: "Late lunch at 2 PM", value: "late_lunch", icon: "🥗" },
        { label: "Dinner at 9 PM", value: "dinner_9pm", icon: "🍽" },
        { label: "I skipped a meal", value: "skipped_meal", icon: "⚠️" },
      ],
    };
  }
  const isSkipped = userInput.includes("skip");
  return {
    id,
    role: "assistant",
    content: isSkipped
      ? "Since you skipped a meal, I've moved your Metformin dose to your next meal. Lisinopril and Atorvastatin stay the same."
      : "Based on your meal timing, here are the optimised dose windows for today:",
    timestamp: new Date(),
    cards: [{
      type: "reminder",
      data: {
        adjustments: isSkipped
          ? [
            { medicine: "Metformin 500mg", original: "8:00 AM", adjusted: "Next meal (TBD)", reason: "Requires food", urgent: true },
            { medicine: "Lisinopril 10mg", original: "12:00 PM", adjusted: "12:00 PM", reason: "No change needed", urgent: false },
            { medicine: "Atorvastatin 20mg", original: "8:00 PM", adjusted: "8:00 PM", reason: "No change needed", urgent: false },
          ]
          : [
            { medicine: "Metformin 500mg", original: "8:00 AM", adjusted: "7:30 AM", reason: "30 min after breakfast", urgent: false },
            { medicine: "Lisinopril 10mg", original: "12:00 PM", adjusted: "12:00 PM", reason: "No change needed", urgent: false },
            { medicine: "Atorvastatin 20mg", original: "8:00 PM", adjusted: "8:00 PM", reason: "No change needed", urgent: false },
          ],
      },
    }],
    quickReplies: [
      { label: "Apply these changes", value: "apply_changes", icon: "✓" },
      { label: "Keep original schedule", value: "keep_original", icon: "↩" },
    ],
  };
}

export function getExpiryCheckMessage(): Message {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "I've checked all medicines in your cabinet. Everything looks good for the next 6 months, but one item needs attention:",
    timestamp: new Date(),
    cards: [{
      type: "expiry_alert",
      data: {
        items: [
          { name: "Metformin 500mg", expiry: "Jan 2027", daysLeft: 236, status: "ok" },
          { name: "Lisinopril 10mg", expiry: "Aug 2026", daysLeft: 60, status: "warn" },
          { name: "Atorvastatin 20mg", expiry: "Mar 2027", daysLeft: 290, status: "ok" },
          { name: "Vitamin D3 2000 IU", expiry: "Sep 2026", daysLeft: 93, status: "ok" },
        ],
      },
    }],
    quickReplies: [
      { label: "Remind me about Lisinopril expiry", value: "remind_expiry", icon: "⏰" },
      { label: "Request Lisinopril refill early", value: "refill_check", icon: "🔄" },
    ],
  };
}

export function getRefillCheckMessage(): Message {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "I've checked your current pill counts. One medicine needs a refill soon — act before Jun 20 to avoid missing doses:",
    timestamp: new Date(),
    cards: [{
      type: "refill_alert",
      data: {
        items: [
          { name: "Lisinopril 10mg", pillsLeft: 8, totalPills: 30, daysLeft: 8, refillBy: "Jun 20, 2026", status: "critical" },
          { name: "Metformin 500mg", pillsLeft: 24, totalPills: 60, daysLeft: 12, refillBy: "Jul 1, 2026", status: "low" },
          { name: "Atorvastatin 20mg", pillsLeft: 45, totalPills: 60, daysLeft: 45, refillBy: "Jul 10, 2026", status: "ok" },
          { name: "Vitamin D3 2000 IU", pillsLeft: 55, totalPills: 90, daysLeft: 55, refillBy: "Aug 1, 2026", status: "ok" },
        ],
      },
    }],
    quickReplies: [
      { label: "Draft refill message for Dr. Chen", value: "draft_refill", icon: "✉" },
      { label: "Remind me in 2 days", value: "remind_2days", icon: "⏰" },
    ],
  };
}

export function getMedicineExplainMessage(medName: string): Message {
  const med = medicines.find((m) => m.name.toLowerCase().includes(medName.toLowerCase())) ?? medicines[0];
  const howItWorks: Record<string, string> = {
    Antidiabetic: "Lowers blood sugar by reducing glucose production in the liver and improving insulin sensitivity.",
    "ACE Inhibitor": "Relaxes blood vessels by blocking the enzyme that produces angiotensin II, reducing blood pressure.",
    Statin: "Reduces LDL cholesterol by blocking HMG-CoA reductase, an enzyme the liver needs to make cholesterol.",
    Supplement: "Supports the body's normal vitamin D levels for bone health and immune function.",
  };
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: `Here's a plain-English overview of **${med.name}** from your cabinet:`,
    timestamp: new Date(),
    cards: [{
      type: "medicine_info",
      data: {
        name: med.name,
        brand: med.name,
        strength: med.dosage,
        form: med.form,
        usedFor: med.condition,
        howItWorks: howItWorks[med.category] ?? "Supports the body's normal function as directed by your doctor.",
        takeWith: med.instructions,
        sideEffects: med.sideEffects,
        alreadyTracked: true,
        yourSchedule: med.times.join(", "),
      },
    }],
    quickReplies: [
      { label: "What if I miss a dose?", value: "missed_dose_info", icon: "⚠️" },
      { label: "Can I take it with food?", value: "food_interaction", icon: "🍽" },
      { label: "Set a reminder", value: "set_reminder", icon: "⏰" },
    ],
  };
}

export function getDuplicateCheckMessage(): Message {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "I checked your cabinet for potential duplicates and overlapping medicines. Here's what I found:",
    timestamp: new Date(),
    cards: [{
      type: "duplicate_warning",
      data: {
        groups: [
          {
            status: "duplicate",
            medicines: ["Metformin 500mg (Glucophage)", "Metformin 500mg (generic)"],
            note: "Same active ingredient and dose — likely from two different prescriptions. Keep only one.",
          },
          {
            status: "safe",
            medicines: ["Lisinopril 10mg", "Atorvastatin 20mg"],
            note: "No overlap. Different drug classes.",
          },
        ],
      },
    }],
    quickReplies: [
      { label: "Remove the generic Metformin", value: "remove_generic", icon: "🗑" },
      { label: "Keep both (different prescriptions)", value: "keep_both", icon: "📋" },
    ],
  };
}

export function getFollowUpResponse(userInput: string): Message {
  const input = userInput.toLowerCase();
  const id = crypto.randomUUID();

  if (input.includes("draft") || input.includes("refill message")) {
    return {
      id, role: "assistant", timestamp: new Date(),
      content: "Here's a draft refill request you can send to Dr. Chen's office:",
      cards: [{
        type: "scan_result",
        data: {
          draftMessage: "Hi, this is Alex Johnson (DOB: Apr 12, 1988). I'm requesting a refill for Lisinopril 10mg — I have approximately 8 pills remaining. My refill is due by Jun 20. Please confirm at your earliest convenience. Thank you.",
          sendTo: "Dr. Sarah Chen's office",
          phone: "+1 (617) 555-0191",
        },
      }],
      quickReplies: [
        { label: "Copy message", value: "copy_message", icon: "📋" },
        { label: "Also refill Metformin", value: "add_metformin", icon: "+" },
      ],
    };
  }
  if (input.includes("miss") && input.includes("dose")) {
    return {
      id, role: "assistant", timestamp: new Date(),
      content: "If you miss a dose: take it as soon as you remember, unless it's almost time for your next one — in that case, skip the missed dose and continue your regular schedule. Never double-up on doses. If you miss two or more days in a row, note it in your log and mention it at your next appointment.",
      quickReplies: [
        { label: "Log a missed dose now", value: "log_missed", icon: "📝" },
        { label: "Set a stronger reminder", value: "stronger_reminder", icon: "🔔" },
      ],
    };
  }
  if (input.includes("food") || input.includes("meal") || input.includes("eat")) {
    return {
      id, role: "assistant", timestamp: new Date(),
      content: "For Metformin: always take with food — this greatly reduces nausea. For Lisinopril: food doesn't matter, but take it at the same time daily. For Atorvastatin: food is fine but avoid grapefruit juice. For Vitamin D3: take with a fatty meal for best absorption.",
      quickReplies: [
        { label: "Reschedule around my meals", value: "reminder_reschedule", icon: "⏰" },
      ],
    };
  }
  if (input.includes("apply") || input.includes("update") || input.includes("done") || input.includes("confirm") || input.includes("save")) {
    return {
      id, role: "assistant", timestamp: new Date(),
      content: "All set! Your schedule has been updated. I'll remind you at the new times starting today.",
      quickReplies: [
        { label: "Check refills", value: "refill_check", icon: "🔄" },
        { label: "Back to home", value: "home", icon: "🏠" },
      ],
    };
  }
  return {
    id, role: "assistant", timestamp: new Date(),
    content: "Understood! Is there anything else I can help you with regarding your medicines?",
    quickReplies: [
      { label: "Check my refills", value: "refill_check", icon: "🔄" },
      { label: "Explain a medicine", value: "medicine_explain", icon: "🔬" },
      { label: "Check expiry dates", value: "expiry_check", icon: "📅" },
    ],
  };
}