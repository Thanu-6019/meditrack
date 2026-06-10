// src/models/Medicine.ts
// ─────────────────────────────────────────────────────────────────────────────
// SKELETON — full fields will be added in the next step.
// Only the ownership reference and timestamps are defined here so other
// models can safely import this file without missing-schema errors.
// ─────────────────────────────────────────────────────────────────────────────

import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface IMedicine extends Document {
  userId:    Types.ObjectId;  // ref → User
  // TODO: name, dosage, frequency, scheduledTimes, pillsRemaining, ...
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema = new Schema<IMedicine>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    // ── Full fields will be added in the Medicine implementation step ──────
  },
  { timestamps: true }
);

const Medicine: Model<IMedicine> =
  (models.Medicine as Model<IMedicine>) ?? model<IMedicine>("Medicine", MedicineSchema);

export default Medicine;