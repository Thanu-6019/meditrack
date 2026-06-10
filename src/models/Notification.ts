// src/models/Notification.ts
// ─────────────────────────────────────────────────────────────────────────────
// Notification model — production implementation.
//
// DESIGN DECISIONS
// ─────────────────────────────────────────────────────────────────────────────
// • `body` not `message` — keeps the field name short and consistent with
//   push-notification platform conventions (APNs, FCM both use "body").
//
// • `metadata` (Schema.Types.Mixed) — a schemaless escape hatch so any module
//   can attach domain-specific context (medicineId, metricValue, etc.) without
//   requiring a schema migration. The API never reads this for logic; it only
//   passes it through to the client.
//
// • `isDelivered` + `channel` — real-time/push tracking hooks. Not wired yet
//   but present in the schema so adding a push worker later requires zero
//   migration. See REAL-TIME UPGRADE PATH in notification.service.ts.
//
// • Compound index { userId, read, createdAt } covers the two most common
//   access patterns:
//     1. "All unread notifications for user X, newest first"
//        → { userId, read: false }  sort createdAt -1
//     2. "All notifications for user X, paginated newest first"
//        → { userId }  sort createdAt -1
//   Both hit the same index; MongoDB uses the leftmost prefix rule.
// ─────────────────────────────────────────────────────────────────────────────

import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const NOTIFICATION_TYPES = [
  "medicine",       // dose reminders, taken confirmations, added/updated/removed
  "refill",         // low supply alerts
  "health_metric",  // vitals out of normal range
  "appointment",    // upcoming visit reminders
  "lab",            // lab results available
  "alert",          // urgent clinical alerts (high BP, critical glucose, etc.)
  "ai_insight",     // future: AI-generated health recommendations
  "system",         // account / app / onboarding events
] as const;

export type NotificationTypeValue = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type NotificationPriorityValue = (typeof NOTIFICATION_PRIORITIES)[number];

export const NOTIFICATION_CHANNELS = ["in_app", "push", "email"] as const;
export type NotificationChannelValue = (typeof NOTIFICATION_CHANNELS)[number];

// ─── Document interface ───────────────────────────────────────────────────────

export interface INotification extends Document {
  // ── Ownership ─────────────────────────────────────────────────────────────
  userId: Types.ObjectId;

  // ── Content ───────────────────────────────────────────────────────────────
  title:    string;
  body:     string;
  type:     NotificationTypeValue;
  priority: NotificationPriorityValue;

  // ── State ─────────────────────────────────────────────────────────────────
  read:   boolean;
  readAt: Date | null;

  // ── CTA ───────────────────────────────────────────────────────────────────
  actionUrl:   string | null;
  actionLabel: string | null;

  // ── Source reference ──────────────────────────────────────────────────────
  /** The document that caused this notification (Medicine, HealthMetric, etc.) */
  relatedId:    Types.ObjectId | null;
  relatedModel: "Medicine" | "MedicationLog" | "HealthMetric" | "Appointment" | null;

  // ── Arbitrary domain context — never used for logic, only passed through ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any> | null;

  // ── Real-time / push tracking (not yet wired — schema-only hooks) ─────────
  /**
   * `false` until a push worker marks it delivered.
   * Allows a background job to retry undelivered push notifications.
   */
  isDelivered: boolean;
  /**
   * Which channel this notification was (or will be) sent over.
   * "in_app" = stored in DB only (current behaviour).
   * "push" / "email" = requires additional delivery worker.
   */
  channel: NotificationChannelValue;

  // ── Timestamps ────────────────────────────────────────────────────────────
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const NotificationSchema = new Schema<INotification>(
  {
    // ── Ownership ─────────────────────────────────────────────────────────
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "userId is required"],
      index:    true,
    },

    // ── Content ───────────────────────────────────────────────────────────
    title: {
      type:      String,
      required:  [true, "title is required"],
      trim:      true,
      maxlength: [200, "title must be 200 characters or fewer"],
    },
    body: {
      type:      String,
      required:  [true, "body is required"],
      trim:      true,
      maxlength: [1000, "body must be 1000 characters or fewer"],
    },
    type: {
      type:    String,
      enum: {
        values:  NOTIFICATION_TYPES as unknown as string[],
        message: "Invalid notification type: {VALUE}",
      },
      default: "system",
    },
    priority: {
      type:    String,
      enum: {
        values:  NOTIFICATION_PRIORITIES as unknown as string[],
        message: "Invalid priority: {VALUE}",
      },
      default: "medium",
    },

    // ── State ─────────────────────────────────────────────────────────────
    read: {
      type:    Boolean,
      default: false,
    },
    readAt: {
      type:    Date,
      default: null,
    },

    // ── CTA ───────────────────────────────────────────────────────────────
    actionUrl: {
      type:    String,
      default: null,
    },
    actionLabel: {
      type:    String,
      default: null,
    },

    // ── Source reference ──────────────────────────────────────────────────
    relatedId: {
      type:    Schema.Types.ObjectId,
      default: null,
    },
    relatedModel: {
      type:    String,
      enum:    ["Medicine", "MedicationLog", "HealthMetric", "Appointment", null],
      default: null,
    },

    // ── Metadata ──────────────────────────────────────────────────────────
    metadata: {
      type:    Schema.Types.Mixed,
      default: null,
    },

    // ── Real-time hooks ───────────────────────────────────────────────────
    isDelivered: {
      type:    Boolean,
      default: false,
    },
    channel: {
      type:    String,
      enum:    NOTIFICATION_CHANNELS as unknown as string[],
      default: "in_app",
    },
  },
  {
    timestamps: true,
toJSON: {
  virtuals: true,
  transform(_doc, ret: any) { // added : any
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    if (ret.userId) ret.userId = ret.userId.toString();
    if (ret.relatedId) ret.relatedId = ret.relatedId.toString();
    return ret;
  },
},
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// PRIMARY: unread inbox — most-hit query in the entire app
// Covers: { userId, read } ORDER BY createdAt DESC  (leftmost prefix: userId + read)
// Also covers: { userId } ORDER BY createdAt DESC   (leftmost prefix: userId only)
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// SECONDARY: type-filtered inbox — "show me only medicine alerts"
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

// TERTIARY: delivery worker — "find all undelivered push notifications"
NotificationSchema.index({ channel: 1, isDelivered: 1, createdAt: 1 });

// ─── Model export ─────────────────────────────────────────────────────────────

const Notification: Model<INotification> =
  (models.Notification as Model<INotification>) ??
  model<INotification>("Notification", NotificationSchema);

export default Notification;