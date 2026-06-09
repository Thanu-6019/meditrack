// ============================================================
// FILE: src/models/Medicine.ts
// DESCRIPTION: Mongoose Medicine model for MediTrack
// COLLECTION: medicines
// ============================================================

import mongoose, {
  Schema,
  model,
  Model,
  Types,
  HydratedDocument,
} from 'mongoose';

// ─────────────────────────────────────────────
// 1. ENUMS / CONSTANTS (single source of truth)
// ─────────────────────────────────────────────
export const FREQUENCY_OPTIONS = [
  'once_daily',
  'twice_daily',
  'three_times_daily',
  'four_times_daily',
  'every_other_day',
  'weekly',
  'as_needed',
] as const;

export const MEDICINE_STATUS = ['active', 'completed', 'paused', 'discontinued'] as const;

export const ROUTE_OF_ADMIN = [
  'oral',
  'topical',
  'inhalation',
  'injection',
  'sublingual',
  'rectal',
  'ophthalmic',
  'otic',
  'nasal',
  'other',
] as const;

export type FrequencyOption = (typeof FREQUENCY_OPTIONS)[number];
export type MedicineStatus = (typeof MEDICINE_STATUS)[number];
export type RouteOfAdmin = (typeof ROUTE_OF_ADMIN)[number];

// ─────────────────────────────────────────────
// 2. RAW DOCUMENT INTERFACE
// ─────────────────────────────────────────────
export interface IMedicine {
  userId: Types.ObjectId;           // FK → Users collection
  name: string;                     // e.g., "Paracetamol 500mg"
  genericName?: string;             // e.g., "Acetaminophen"
  dosage: string;                   // e.g., "500mg", "10ml"
  frequency: FrequencyOption;       // how often
  timesPerDay: number;              // 1 | 2 | 3 | 4
  scheduledTimes: string[];         // ["08:00", "20:00"] — 24hr format
  startDate: Date;
  endDate?: Date;                   // undefined = ongoing
  routeOfAdministration: RouteOfAdmin;
  purpose?: string;                 // reason for taking
  prescribedBy?: string;            // doctor's name
  pharmacy?: string;                // pharmacy name
  refillDate?: Date;
  pillsRemaining?: number;          // for refill alerts
  totalPills?: number;
  notes?: string;
  status: MedicineStatus;
  isActive: boolean;                // derived active flag for fast queries
  validatedAt?: Date;               // when AI validation ran
  isValidated: boolean;             // AI-confirmed real medicine
  createdAt?: Date;
  updatedAt?: Date;
}

// ─────────────────────────────────────────────
// 3. INSTANCE METHODS INTERFACE
// ─────────────────────────────────────────────
export interface IMedicineMethods {
  isExpired(): boolean;
  daysRemaining(): number | null;
  needsRefill(): boolean;
}

// ─────────────────────────────────────────────
// 4. STATIC METHODS INTERFACE
// ─────────────────────────────────────────────
export interface IMedicineModel extends Model<IMedicine, object, IMedicineMethods> {
  findActiveByUser(userId: Types.ObjectId): Promise<HydratedDocument<IMedicine, IMedicineMethods>[]>;
  findTodaysReminders(userId: Types.ObjectId): Promise<HydratedDocument<IMedicine, IMedicineMethods>[]>;
}

// ─────────────────────────────────────────────
// 5. HYDRATED DOCUMENT TYPE
// ─────────────────────────────────────────────
export type MedicineDocument = HydratedDocument<IMedicine, IMedicineMethods>;

// ─────────────────────────────────────────────
// 6. SCHEMA DEFINITION
// ─────────────────────────────────────────────
const MedicineSchema = new Schema<IMedicine, IMedicineModel, IMedicineMethods>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      minlength: [1, 'Medicine name cannot be empty'],
      maxlength: [200, 'Medicine name cannot exceed 200 characters'],
    },

    genericName: {
      type: String,
      trim: true,
      maxlength: [200, 'Generic name cannot exceed 200 characters'],
      default: undefined,
    },

    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      trim: true,
      maxlength: [50, 'Dosage cannot exceed 50 characters'],
    },

    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      enum: {
        values: FREQUENCY_OPTIONS,
        message: '{VALUE} is not a valid frequency option',
      },
    },

    timesPerDay: {
      type: Number,
      required: [true, 'Times per day is required'],
      min: [1, 'Times per day must be at least 1'],
      max: [24, 'Times per day cannot exceed 24'],
    },

    scheduledTimes: {
      type: [String],
      required: [true, 'Scheduled times are required'],
      validate: {
        validator: function (times: string[]) {
          // Each time must be HH:MM format (24hr)
          const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
          return (
            Array.isArray(times) &&
            times.length > 0 &&
            times.every((t) => timeRegex.test(t))
          );
        },
        message: 'Each scheduled time must be in HH:MM 24-hour format',
      },
    },

    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },

    endDate: {
      type: Date,
      default: undefined,
      validate: {
        validator: function (this: IMedicine, endDate: Date) {
          if (!endDate) return true;            // optional field
          return endDate >= this.startDate;
        },
        message: 'End date must be on or after start date',
      },
    },

    routeOfAdministration: {
      type: String,
      required: [true, 'Route of administration is required'],
      enum: {
        values: ROUTE_OF_ADMIN,
        message: '{VALUE} is not a valid route of administration',
      },
      default: 'oral',
    },

    purpose: {
      type: String,
      trim: true,
      maxlength: [500, 'Purpose cannot exceed 500 characters'],
      default: undefined,
    },

    prescribedBy: {
      type: String,
      trim: true,
      maxlength: [150, 'Prescriber name cannot exceed 150 characters'],
      default: undefined,
    },

    pharmacy: {
      type: String,
      trim: true,
      maxlength: [150, 'Pharmacy name cannot exceed 150 characters'],
      default: undefined,
    },

    refillDate: {
      type: Date,
      default: undefined,
    },

    pillsRemaining: {
      type: Number,
      min: [0, 'Pills remaining cannot be negative'],
      default: undefined,
    },

    totalPills: {
      type: Number,
      min: [0, 'Total pills cannot be negative'],
      default: undefined,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: undefined,
    },

    status: {
      type: String,
      required: true,
      enum: {
        values: MEDICINE_STATUS,
        message: '{VALUE} is not a valid medicine status',
      },
      default: 'active',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    validatedAt: {
      type: Date,
      default: undefined,
    },

    isValidated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'medicines',
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─────────────────────────────────────────────
// 7. INDEXES
// ─────────────────────────────────────────────

// Most critical: user's active medicines list (dashboard + medicines page)
MedicineSchema.index(
  { userId: 1, isActive: 1, status: 1 },
  { name: 'idx_medicines_user_active_status' }
);

// Reminder engine: today's scheduled medicines for a user
MedicineSchema.index(
  { userId: 1, scheduledTimes: 1, isActive: 1 },
  { name: 'idx_medicines_user_scheduled' }
);

// Refill alerts: find medicines needing refill by user
MedicineSchema.index(
  { userId: 1, refillDate: 1, isActive: 1 },
  { name: 'idx_medicines_user_refill' }
);

// Date range queries: medicines active during a period
MedicineSchema.index(
  { userId: 1, startDate: 1, endDate: 1 },
  { name: 'idx_medicines_user_dates' }
);

// ─────────────────────────────────────────────
// 8. PRE-SAVE MIDDLEWARE
// ─────────────────────────────────────────────

// Auto-sync isActive based on status and dates
MedicineSchema.pre('save', function (next) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // isActive = status is active AND (no endDate OR endDate is in the future)
  this.isActive =
    this.status === 'active' &&
    (!this.endDate || new Date(this.endDate) >= today);

  next();
});

// ─────────────────────────────────────────────
// 9. INSTANCE METHODS
// ─────────────────────────────────────────────

/**
 * isExpired
 * Returns true if the medicine's end date has passed.
 */
MedicineSchema.methods.isExpired = function (): boolean {
  if (!this.endDate) return false;
  return new Date(this.endDate) < new Date();
};

/**
 * daysRemaining
 * Returns number of days until end date, or null if no end date.
 */
MedicineSchema.methods.daysRemaining = function (): number | null {
  if (!this.endDate) return null;
  const now = new Date();
  const end = new Date(this.endDate);
  const diffMs = end.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * needsRefill
 * Returns true if pills remaining is <= 7 days worth of supply.
 */
MedicineSchema.methods.needsRefill = function (): boolean {
  if (this.pillsRemaining === undefined || this.pillsRemaining === null) {
    return false;
  }
  const dailyDose = this.timesPerDay || 1;
  const daysLeft = this.pillsRemaining / dailyDose;
  return daysLeft <= 7;
};

// ─────────────────────────────────────────────
// 10. STATIC METHODS
// ─────────────────────────────────────────────

/**
 * findActiveByUser
 * Fetch all active medicines for a given user, sorted by name.
 */
MedicineSchema.statics.findActiveByUser = function (
  userId: Types.ObjectId
): Promise<HydratedDocument<IMedicine, IMedicineMethods>[]> {
  return this.find({ userId, isActive: true, status: 'active' })
    .sort({ name: 1 })
    .exec();
};

/**
 * findTodaysReminders
 * Returns all active medicines for a user that have scheduled times today.
 */
MedicineSchema.statics.findTodaysReminders = function (
  userId: Types.ObjectId
): Promise<HydratedDocument<IMedicine, IMedicineMethods>[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.find({
    userId,
    isActive: true,
    status: 'active',
    startDate: { $lte: new Date() },
    $or: [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gte: today } },
    ],
  })
    .sort({ scheduledTimes: 1 })
    .exec();
};

// ─────────────────────────────────────────────
// 11. VIRTUAL FIELDS
// ─────────────────────────────────────────────

/**
 * Virtual: nextDose
 * Returns the next scheduled time string for today (or null).
 */
MedicineSchema.virtual('nextDose').get(function (
  this: HydratedDocument<IMedicine>
) {
  if (!this.scheduledTimes || this.scheduledTimes.length === 0) return null;

  const now = new Date();
  const currentHHMM =
    String(now.getHours()).padStart(2, '0') +
    ':' +
    String(now.getMinutes()).padStart(2, '0');

  const futureTimes = this.scheduledTimes
    .filter((t) => t > currentHHMM)
    .sort();

  return futureTimes.length > 0 ? futureTimes[0] : this.scheduledTimes[0];
});

// ─────────────────────────────────────────────
// 12. EXPORT MODEL (Next.js hot-reload safe)
// ─────────────────────────────────────────────
const Medicine =
  (mongoose.models.Medicine as IMedicineModel) ||
  model<IMedicine, IMedicineModel>('Medicine', MedicineSchema);

export default Medicine;