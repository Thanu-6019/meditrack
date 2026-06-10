// src/models/HealthMetric.ts
// ─────────────────────────────────────────────────────────────────────────────
// SKELETON — full fields will be added in the Health Metrics implementation step.
// ─────────────────────────────────────────────────────────────────────────────

import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface IHealthMetric extends Document {
  userId:    Types.ObjectId;  // ref → User
  // TODO: metricType, value, unit, systolic, diastolic, recordedAt, status, ...
  createdAt: Date;
  updatedAt: Date;
}

const HealthMetricSchema = new Schema<IHealthMetric>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    // ── Full fields will be added in the HealthMetric implementation step ──
  },
  { timestamps: true }
);

const HealthMetric: Model<IHealthMetric> =
  (models.HealthMetric as Model<IHealthMetric>) ??
  model<IHealthMetric>("HealthMetric", HealthMetricSchema);

export default HealthMetric;