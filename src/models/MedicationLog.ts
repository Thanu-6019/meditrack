// ============================================================
// FILE: src/models/MedicationLog.ts
// DESCRIPTION: Mongoose MedicationLog model for MediTrack
// COLLECTION: medicationlogs
// Powers: adherence rate, "taken today", missed dose tracking
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
export const LOG_STATUS = [
  'pending',    // scheduled but not yet time
  'taken',      // user confirmed as taken
  'missed',     // scheduled time passed — not taken
  'skipped',    // user intentionally skipped
  'late',       // taken after scheduled window
] as const;

export type LogStatus = (typeof LOG_STATUS)[number];

// ─────────────────────────────────────────────
// 2. RAW DOCUMENT INTERFACE
// ─────────────────────────────────────────────
export interface IMedicationLog {
  userId: Types.ObjectId;        // FK → Users
  medicineId: Types.ObjectId;    // FK → Medicines
  medicineName: string;          // denormalized for performance (avoids joins)
  dosage: string;                // denormalized dosage at log time
  scheduledTime: string;         // "HH:MM" — the time this dose was scheduled
  dueDate: Date;                 // full Date of the scheduled dose
  takenAt?: Date;                // when actually taken (null if not taken)
  status: LogStatus;
  minutesLate?: number;          // if status=late, how many minutes
  notes?: string;
  skippedReason?: string;        // reason for skipping
  createdAt?: Date;
  updatedAt?: Date;
}

// ─────────────────────────────────────────────
// 3. INSTANCE METHODS INTERFACE
// ─────────────────────────────────────────────
export interface IMedicationLogMethods {
  markAsTaken(takenAt?: Date): Promise<HydratedDocument<IMedicationLog, IMedicationLogMethods>>;
  markAsMissed(): Promise<HydratedDocument<IMedicationLog, IMedicationLogMethods>>;
  markAsSkipped(reason?: string): Promise<HydratedDocument<IMedicationLog, IMedicationLogMethods>>;
}

// ─────────────────────────────────────────────
// 4. STATIC METHODS INTERFACE
// ─────────────────────────────────────────────
export interface IMedicationLogModel
  extends Model<IMedicationLog, object, IMedicationLogMethods> {
  getTodaysLogs(
    userId: Types.ObjectId
  ): Promise<HydratedDocument<IMedicationLog, IMedicationLogMethods>[]>;

  getAdherenceRate(
    userId: Types.ObjectId,
    daysBack?: number
  ): Promise<number>;

  countTakenToday(userId: Types.ObjectId): Promise<number>;

  getMissedDoses(
    userId: Types.ObjectId,
    daysBack?: number
  ): Promise<HydratedDocument<IMedicationLog, IMedicationLogMethods>[]>;
}

// ─────────────────────────────────────────────
// 5. HYDRATED DOCUMENT TYPE
// ─────────────────────────────────────────────
export type MedicationLogDocument = HydratedDocument<
  IMedicationLog,
  IMedicationLogMethods
>;

// ─────────────────────────────────────────────
// 6. SCHEMA DEFINITION
// ─────────────────────────────────────────────
const MedicationLogSchema = new Schema<
  IMedicationLog,
  IMedicationLogModel,
  IMedicationLogMethods
>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    medicineId: {
      type: Schema.Types.ObjectId,
      ref: 'Medicine',
      required: [true, 'Medicine ID is required'],
    },

    medicineName: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      maxlength: [200, 'Medicine name cannot exceed 200 characters'],
    },

    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      trim: true,
      maxlength: [50, 'Dosage cannot exceed 50 characters'],
    },

    scheduledTime: {
      type: String,
      required: [true, 'Scheduled time is required'],
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        'Scheduled time must be in HH:MM 24-hour format',
      ],
    },

    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },

    takenAt: {
      type: Date,
      default: undefined,
    },

    status: {
      type: String,
      required: true,
      enum: {
        values: LOG_STATUS,
        message: '{VALUE} is not a valid log status',
      },
      default: 'pending',
    },

    minutesLate: {
      type: Number,
      min: [0, 'Minutes late cannot be negative'],
      default: undefined,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: undefined,
    },

    skippedReason: {
      type: String,
      trim: true,
      maxlength: [300, 'Skipped reason cannot exceed 300 characters'],
      default: undefined,
    },
  },
  {
    timestamps: true,
    collection: 'medicationlogs',
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─────────────────────────────────────────────
// 7. INDEXES
// ─────────────────────────────────────────────

// Daily logs view: user's logs for today
MedicationLogSchema.index(
  { userId: 1, dueDate: -1 },
  { name: 'idx_logs_user_dueDate' }
);

// Per-medicine history: all logs for a specific medicine
MedicationLogSchema.index(
  { userId: 1, medicineId: 1, dueDate: -1 },
  { name: 'idx_logs_user_medicine_dueDate' }
);

// Adherence calculation: status filter across date range
MedicationLogSchema.index(
  { userId: 1, status: 1, dueDate: -1 },
  { name: 'idx_logs_user_status_date' }
);

// Deduplication guard: prevent double-logging same dose
// One log per user+medicine+dueDate+scheduledTime
MedicationLogSchema.index(
  { userId: 1, medicineId: 1, dueDate: 1, scheduledTime: 1 },
  {
    unique: true,
    name: 'idx_logs_unique_dose',
    // Partial index: only enforce uniqueness on non-skipped logs
    partialFilterExpression: { status: { $nin: ['skipped'] } },
  }
);

// ─────────────────────────────────────────────
// 8. INSTANCE METHODS
// ─────────────────────────────────────────────

/**
 * markAsTaken
 * Mark this log entry as taken. Calculates minutesLate automatically.
 */
MedicationLogSchema.methods.markAsTaken = async function (
  takenAt: Date = new Date()
): Promise<MedicationLogDocument> {
  this.takenAt = takenAt;

  // Calculate if taken late (> 30 min after scheduled)
  const [hours, minutes] = this.scheduledTime.split(':').map(Number);
  const scheduledDateTime = new Date(this.dueDate);
  scheduledDateTime.setHours(hours, minutes, 0, 0);

  const diffMs = takenAt.getTime() - scheduledDateTime.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes > 30) {
    this.status = 'late';
    this.minutesLate = diffMinutes;
  } else {
    this.status = 'taken';
    this.minutesLate = undefined;
  }

  return this.save();
};

/**
 * markAsMissed
 * Mark this log entry as missed.
 */
MedicationLogSchema.methods.markAsMissed =
  async function (): Promise<MedicationLogDocument> {
    this.status = 'missed';
    this.takenAt = undefined;
    return this.save();
  };

/**
 * markAsSkipped
 * Mark this log entry as intentionally skipped with optional reason.
 */
MedicationLogSchema.methods.markAsSkipped = async function (
  reason?: string
): Promise<MedicationLogDocument> {
  this.status = 'skipped';
  if (reason) this.skippedReason = reason;
  return this.save();
};

// ─────────────────────────────────────────────
// 9. STATIC METHODS
// ─────────────────────────────────────────────

/**
 * getTodaysLogs
 * Returns all medication logs for a user due today.
 */
MedicationLogSchema.statics.getTodaysLogs = function (
  userId: Types.ObjectId
): Promise<MedicationLogDocument[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    userId,
    dueDate: { $gte: startOfDay, $lte: endOfDay },
  })
    .sort({ dueDate: 1, scheduledTime: 1 })
    .populate('medicineId', 'name dosage routeOfAdministration')
    .exec();
};

/**
 * getAdherenceRate
 * Calculates medication adherence as a percentage over the last N days.
 * Formula: (taken + late) / (taken + late + missed) * 100
 * Skipped doses are excluded from the denominator.
 */
MedicationLogSchema.statics.getAdherenceRate = async function (
  userId: Types.ObjectId,
  daysBack = 30
): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  since.setHours(0, 0, 0, 0);

  const results = await this.aggregate([
    {
      $match: {
        userId,
        dueDate: { $gte: since },
        status: { $in: ['taken', 'late', 'missed'] }, // exclude pending + skipped
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        taken: {
          $sum: {
            $cond: [{ $in: ['$status', ['taken', 'late']] }, 1, 0],
          },
        },
      },
    },
  ]);

  if (!results.length || results[0].total === 0) return 0;
  return Math.round((results[0].taken / results[0].total) * 100);
};

/**
 * countTakenToday
 * Returns the number of doses taken/late today.
 */
MedicationLogSchema.statics.countTakenToday = async function (
  userId: Types.ObjectId
): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return this.countDocuments({
    userId,
    dueDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['taken', 'late'] },
  });
};

/**
 * getMissedDoses
 * Returns missed dose logs for a user over the last N days.
 */
MedicationLogSchema.statics.getMissedDoses = function (
  userId: Types.ObjectId,
  daysBack = 7
): Promise<MedicationLogDocument[]> {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  since.setHours(0, 0, 0, 0);

  return this.find({
    userId,
    status: 'missed',
    dueDate: { $gte: since },
  })
    .sort({ dueDate: -1 })
    .exec();
};

// ─────────────────────────────────────────────
// 10. VIRTUAL FIELDS
// ─────────────────────────────────────────────

/**
 * Virtual: isOverdue
 * Returns true if status is still 'pending' and dueDate has passed.
 */
MedicationLogSchema.virtual('isOverdue').get(function (
  this: HydratedDocument<IMedicationLog>
) {
  if (this.status !== 'pending') return false;
  return new Date() > new Date(this.dueDate);
});

// ─────────────────────────────────────────────
// 11. EXPORT MODEL (Next.js hot-reload safe)
// ─────────────────────────────────────────────
const MedicationLog =
  (mongoose.models.MedicationLog as IMedicationLogModel) ||
  model<IMedicationLog, IMedicationLogModel>(
    'MedicationLog',
    MedicationLogSchema
  );

export default MedicationLog;