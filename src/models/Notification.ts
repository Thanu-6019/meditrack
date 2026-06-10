// src/models/Notification.ts
// ─────────────────────────────────────────────────────────────────────────────
// SKELETON — full fields will be added in the Notifications implementation step.
// ─────────────────────────────────────────────────────────────────────────────

import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface INotification extends Document {
  userId:    Types.ObjectId;  // ref → User
  // TODO: type, priority, title, message, read, readAt, actionUrl, ...
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    // ── Full fields will be added in the Notification implementation step ──
  },
  { timestamps: true }
);

const Notification: Model<INotification> =
  (models.Notification as Model<INotification>) ??
  model<INotification>("Notification", NotificationSchema);

export default Notification;