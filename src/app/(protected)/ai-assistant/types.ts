// src/app/(protected)/ai-assistant/types.ts

export type MessageRole = "user" | "assistant";

export type FlowKey =
  | "idle"
  | "prescription_scan"
  | "strip_scan"
  | "reminder_reschedule"
  | "expiry_check"
  | "refill_check"
  | "duplicate_check"
  | "medicine_explain";

export type CardType =
  | "medicine_info"
  | "reminder"
  | "refill_alert"
  | "expiry_alert"
  | "duplicate_warning"
  | "ocr_correction"
  | "scan_result";

export interface AssistantCard {
  type: CardType;
  data: Record<string, unknown>;
}

export interface QuickReply {
  label: string;
  value: string;
  icon?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  cards?: AssistantCard[];
  quickReplies?: QuickReply[];
}

export interface SuggestedFlow {
  key: FlowKey;
  icon: string;
  title: string;
  subtitle: string;
  tag: string;
  tagClass: string;
}