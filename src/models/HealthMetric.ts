// ============================================================
// FILE: src/models/HealthMetric.ts
// DESCRIPTION: Mongoose HealthMetric model for MediTrack
// COLLECTION: healthmetrics
// ============================================================

import mongoose, {
  Schema,
  model,
  Model,
  Types,
  HydratedDocument,
} from 'mongoose';

// ─────────────────────────────────────────────
// 1. ENUMS / CONSTANTS
// ─────────────────────────────────────────────
export const METRIC_TYPES = [
  'weight',
  'bloodPressure',
  'bloodSugar',
  'heartRate',
  'temperature',
  'oxygenSaturation',
  'cholesterol',
  'bmi',
] as const;

export type MetricType = (typeof METRIC_TYPES)[number];

// Units per metric type — used for validation
export const METRIC_UNITS: Record<MetricType, string[]> = {
  weight: ['kg', 'lbs'],
  bloodPressure: ['mmHg'],
  bloodSugar: ['mg/dL', 'mmol/L'],
  heartRate: ['bpm'],
  temperature: ['°C', '°F'],
  oxygenSaturation: ['%'],
  cholesterol: ['mg/dL', 'mmol/L'],
  bmi: ['kg/m²'],
};

// Reference ranges for UI health indicators
export const METRIC_REFERENCE_RANGES: Record<
  MetricType,
  { low?: number; high?: number; unit: string }
> = {
  weight: { unit: 'kg' },                                  // highly variable — no universal range
  bloodPressure: { low: 60, high: 120, unit: 'mmHg' },     // systolic reference
  bloodSugar: { low: 70, high: 100, unit: 'mg/dL' },       // fasting normal
  heartRate: { low: 60, high: 100, unit: 'bpm' },          // resting normal
  temperature: { low: 36.1, high: 37.2, unit: '°C' },      // normal body temp
  oxygenSaturation: { low: 95, high: 100, unit: '%' },     // normal SpO2
  cholesterol: { high: 200, unit: 'mg/dL' },              // desirable total
  bmi: { low: 18.5, high: 24.9, unit: 'kg/m²' },          // normal BMI
};

// ─────────────────────────────────────────────
// 2. RAW DOCUMENT INTERFACE
// ─────────────────────────────────────────────
export interface IHealthMetric {
  userId: Types.ObjectId;          // FK → Users
  metricType: MetricType;
  value: number;                   // primary numeric value
  systolic?: number;               // blood pressure systolic (mmHg)
  diastolic?: number;              // blood pressure diastolic (mmHg)
  unit: string;                    // unit of measurement
  recordedAt: Date;                // when the measurement was taken
  notes?: string;
  source?: string;                 // 'manual' | 'device' | 'lab' | 'prescription'
  deviceId?: string;               // optional wearable device identifier
  createdAt?: Date;
  updatedAt?: Date;
}

// ─────────────────────────────────────────────
// 3. INSTANCE METHODS INTERFACE
// ─────────────────────────────────────────────
export interface IHealthMetricMethods {
  getStatus(): 'normal' | 'low' | 'high' | 'unknown';
  getDisplayValue(): string;
}

// ─────────────────────────────────────────────
// 4. STATIC METHODS INTERFACE
// ─────────────────────────────────────────────
export interface IHealthMetricModel
  extends Model<IHealthMetric, object, IHealthMetricMethods> {
  findByUserAndType(
    userId: Types.ObjectId,
    metricType: MetricType,
    limit?: number
  ): Promise<HydratedDocument<IHealthMetric, IHealthMetricMethods>[]>;

  getLatestByType(
    userId: Types.ObjectId
  ): Promise<Record<string, HydratedDocument<IHealthMetric, IHealthMetricMethods>>>;
}

// ─────────────────────────────────────────────
// 5. HYDRATED DOCUMENT TYPE
// ─────────────────────────────────────────────
export type HealthMetricDocument = HydratedDocument<
  IHealthMetric,
  IHealthMetricMethods
>;

// ─────────────────────────────────────────────
// 6. SCHEMA DEFINITION
// ─────────────────────────────────────────────
const HealthMetricSchema = new Schema<
  IHealthMetric,
  IHealthMetricModel,
  IHealthMetricMethods
>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    metricType: {
      type: String,
      required: [true, 'Metric type is required'],
      enum: {
        values: METRIC_TYPES,
        message: '{VALUE} is not a valid metric type',
      },
    },

    value: {
      type: Number,
      required: [true, 'Metric value is required'],
      validate: {
        validator: (v: number) => isFinite(v) && !isNaN(v),
        message: 'Value must be a valid finite number',
      },
    },

    systolic: {
      type: Number,
      min: [0, 'Systolic pressure must be non-negative'],
      max: [400, 'Systolic pressure value seems unrealistic'],
      default: undefined,
    },

    diastolic: {
      type: Number,
      min: [0, 'Diastolic pressure must be non-negative'],
      max: [300, 'Diastolic pressure value seems unrealistic'],
      default: undefined,
      validate: {
        validator: function (this: IHealthMetric, diastolic: number) {
          if (!diastolic) return true;
          // diastolic must be lower than systolic
          if (this.systolic) return diastolic < this.systolic;
          return true;
        },
        message: 'Diastolic pressure must be lower than systolic pressure',
      },
    },

    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
      maxlength: [20, 'Unit cannot exceed 20 characters'],
    },

    recordedAt: {
      type: Date,
      required: [true, 'Recorded date is required'],
      default: Date.now,
      validate: {
        validator: (date: Date) => date <= new Date(),
        message: 'Recorded date cannot be in the future',
      },
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: undefined,
    },

    source: {
      type: String,
      trim: true,
      enum: {
        values: ['manual', 'device', 'lab', 'prescription', 'other'],
        message: '{VALUE} is not a valid source',
      },
      default: 'manual',
    },

    deviceId: {
      type: String,
      trim: true,
      maxlength: [100, 'Device ID cannot exceed 100 characters'],
      default: undefined,
    },
  },
  {
    timestamps: true,
    collection: 'healthmetrics',
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─────────────────────────────────────────────
// 7. INDEXES
// ─────────────────────────────────────────────

// Core query: user's metrics by type, sorted by time (most used query)
HealthMetricSchema.index(
  { userId: 1, metricType: 1, recordedAt: -1 },
  { name: 'idx_metrics_user_type_date' }
);

// Dashboard: latest metrics across all types for a user
HealthMetricSchema.index(
  { userId: 1, recordedAt: -1 },
  { name: 'idx_metrics_user_date' }
);

// Analytics: date-range queries for health trends
HealthMetricSchema.index(
  { userId: 1, metricType: 1, recordedAt: 1 },
  { name: 'idx_metrics_user_type_date_asc' }
);

// ─────────────────────────────────────────────
// 8. PRE-SAVE MIDDLEWARE
// ─────────────────────────────────────────────

// For blood pressure entries — if systolic+diastolic provided, set value = systolic
HealthMetricSchema.pre('save', function (next) {
  if (this.metricType === 'bloodPressure') {
    if (this.systolic) {
      this.value = this.systolic; // store systolic as primary value
    }
  }
  next();
});

// ─────────────────────────────────────────────
// 9. INSTANCE METHODS
// ─────────────────────────────────────────────

/**
 * getStatus
 * Returns 'normal', 'low', 'high', or 'unknown' based on reference ranges.
 */
HealthMetricSchema.methods.getStatus = function ():
  | 'normal'
  | 'low'
  | 'high'
  | 'unknown' {
  const range = METRIC_REFERENCE_RANGES[this.metricType as MetricType];
  if (!range) return 'unknown';

  const checkValue = this.metricType === 'bloodPressure'
    ? (this.systolic ?? this.value)
    : this.value;

  if (range.low !== undefined && checkValue < range.low) return 'low';
  if (range.high !== undefined && checkValue > range.high) return 'high';
  if (range.low !== undefined || range.high !== undefined) return 'normal';
  return 'unknown';
};

/**
 * getDisplayValue
 * Returns a human-readable value string including units.
 * Blood pressure shows as "systolic/diastolic mmHg".
 */
HealthMetricSchema.methods.getDisplayValue = function (): string {
  if (
    this.metricType === 'bloodPressure' &&
    this.systolic &&
    this.diastolic
  ) {
    return `${this.systolic}/${this.diastolic} ${this.unit}`;
  }
  return `${this.value} ${this.unit}`;
};

// ─────────────────────────────────────────────
// 10. STATIC METHODS
// ─────────────────────────────────────────────

/**
 * findByUserAndType
 * Returns paginated metrics for a specific user and metric type.
 */
HealthMetricSchema.statics.findByUserAndType = function (
  userId: Types.ObjectId,
  metricType: MetricType,
  limit = 30
): Promise<HydratedDocument<IHealthMetric, IHealthMetricMethods>[]> {
  return this.find({ userId, metricType })
    .sort({ recordedAt: -1 })
    .limit(limit)
    .exec();
};

/**
 * getLatestByType
 * Returns the single most recent measurement per metric type for a user.
 * Used on the dashboard to show latest readings.
 */
HealthMetricSchema.statics.getLatestByType = async function (
  userId: Types.ObjectId
): Promise<Record<string, HydratedDocument<IHealthMetric, IHealthMetricMethods>>> {
  const results = await this.aggregate([
    { $match: { userId } },
    { $sort: { recordedAt: -1 } },
    {
      $group: {
        _id: '$metricType',
        doc: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$doc' } },
  ]);

  // Convert array to map keyed by metricType
  const map: Record<string, HydratedDocument<IHealthMetric, IHealthMetricMethods>> = {};
  for (const doc of results) {
    map[doc.metricType] = doc;
  }
  return map;
};

// ─────────────────────────────────────────────
// 11. VIRTUAL FIELDS
// ─────────────────────────────────────────────

/**
 * Virtual: statusLabel
 * Returns a status with the reference range context.
 */
HealthMetricSchema.virtual('statusLabel').get(function (
  this: HydratedDocument<IHealthMetric>
) {
  const range = METRIC_REFERENCE_RANGES[this.metricType as MetricType];
  if (!range) return 'No reference range available';

  const parts: string[] = [];
  if (range.low !== undefined) parts.push(`Low: ${range.low}`);
  if (range.high !== undefined) parts.push(`High: ${range.high}`);
  return parts.join(' | ') + ` ${range.unit}`;
});

// ─────────────────────────────────────────────
// 12. EXPORT MODEL (Next.js hot-reload safe)
// ─────────────────────────────────────────────
const HealthMetric =
  (mongoose.models.HealthMetric as IHealthMetricModel) ||
  model<IHealthMetric, IHealthMetricModel>('HealthMetric', HealthMetricSchema);

export default HealthMetric;