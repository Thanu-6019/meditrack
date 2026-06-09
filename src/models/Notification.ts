// ============================================================
// FILE: src/models/Notification.ts
// DESCRIPTION: Mongoose Notification model for MediTrack
// COLLECTION: notifications
// Powers: medication reminders, missed dose alerts, refill alerts
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
export const NOTIFICATION_TYPES = [
  'reminder',         // upcoming dose reminder
  'missed_dose',      // dose was missed
  'refill_alert',     // medicine running low
  'health_alert',     // health metric out of range
  'system',           // app-level system notification
  'adherence_report', // weekly adherence summary
] as const;

export const NOTIFICATION_PRIORITY = ['low', 'medium', 'high', 'urgent'] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type NotificationPriority = (typeof NOTIFICATION_PRIORITY)[number];

// ─────────────────────────────────────────────
// 2. RAW DOCUMENT INTERFACE
// ─────────────────────────────────────────────
export interface INotification {
  userId: Types.ObjectId;           // FK → Users
  medicineId?: Types.ObjectId;      // FK → Medicines (for dose/refill alerts)
  medicationLogId?: Types.ObjectId; // FK → MedicationLogs (for missed dose)
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  readAt?: Date;
  actionUrl?: string;              // deep-link for frontend routing
  actionLabel?: string;            // button text e.g., "Mark as Taken"
  scheduledFor?: Date;             // when the notification should be shown
  sentAt?: Date;                   // when actually delivered
  expiresAt?: Date;                // auto-expire old notifications
  metadata?: Record<string, unknown>; // flexible extra data
  createdAt?: Date;
  updatedAt?: Date;
}

// ─────────────────────────────────────────────
// 3. INSTANCE METHODS INTERFACE
// ─────────────────────────────────────────────
export interface INotificationMethods {
  markAsRead(): Promise<HydratedDocument<INotification, INotificationMethods>>;
  isExpired(): boolean;
}

// ─────────────────────────────────────────────
// 4. STATIC METHODS INTERFACE
// ─────────────────────────────────────────────
export interface INotificationModel
  extends Model<INotification, object, INotificationMethods> {
  findUnreadByUser(
    userId: Types.ObjectId,
    limit?: number
  ): Promise<HydratedDocument<INotification, INotificationMethods>[]>;

  countUnreadByUser(userId: Types.ObjectId): Promise<number>;

  markAllReadByUser(userId: Types.ObjectId): Promise<number>;

  createMedicineReminder(params: {
    userId: Types.ObjectId;
    medicineId: Types.ObjectId;
    medicineName: string;
    scheduledTime: string;
    dueDate: Date;
  }): Promise<HydratedDocument<INotification, INotificationMethods>>;

  createMissedDoseAlert(params: {
    userId: Types.ObjectId;
    medicineId: Types.ObjectId;
    medicationLogId: Types.ObjectId;
    medicineName: string;
  }): Promise<HydratedDocument<INotification, INotificationMethods>>;

  createRefillAlert(params: {
    userId: Types.ObjectId;
    medicineId: Types.ObjectId;
    medicineName: string;
    pillsRemaining: number;
  }): Promise<HydratedDocument<INotification, INotificationMethods>>;
}

// ─────────────────────────────────────────────
// 5. HYDRATED DOCUMENT TYPE
// ─────────────────────────────────────────────
export type NotificationDocument = HydratedDocument<
  INotification,
  INotificationMethods
>;

// ─────────────────────────────────────────────
// 6. SCHEMA DEFINITION
// ─────────────────────────────────────────────
const NotificationSchema = new Schema<
  INotification,
  INotificationModel,
  INotificationMethods
>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    medicineId: {
      type: Schema.Types.ObjectId,
      ref: 'Medicine',
      default: undefined,
    },

    medicationLogId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicationLog',
      default: undefined,
    },

    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: NOTIFICATION_TYPES,
        message: '{VALUE} is not a valid notification type',
      },
    },

    priority: {
      type: String,
      required: true,
      enum: {
        values: NOTIFICATION_PRIORITY,
        message: '{VALUE} is not a valid priority level',
      },
      default: 'medium',
    },

    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },

    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: undefined,
    },

    actionUrl: {
      type: String,
      trim: true,
      maxlength: [300, 'Action URL cannot exceed 300 characters'],
      default: undefined,
    },

    actionLabel: {
      type: String,
      trim: true,
      maxlength: [50, 'Action label cannot exceed 50 characters'],
      default: undefined,
    },

    scheduledFor: {
      type: Date,
      default: undefined,
    },

    sentAt: {
      type: Date,
      default: undefined,
    },

    expiresAt: {
      type: Date,
      default: undefined,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─────────────────────────────────────────────
// 7. INDEXES
// ─────────────────────────────────────────────

// Notification bell: unread notifications for user (most frequent query)
NotificationSchema.index(
  { userId: 1, read: 1, createdAt: -1 },
  { name: 'idx_notifications_user_unread' }
);

// Notification list: all notifications for user sorted by date
NotificationSchema.index(
  { userId: 1, createdAt: -1 },
  { name: 'idx_notifications_user_date' }
);

// Reminder scheduler: scheduled but unsent notifications
NotificationSchema.index(
  { scheduledFor: 1, sentAt: 1, userId: 1 },
  {
    name: 'idx_notifications_scheduled',
    partialFilterExpression: { sentAt: { $exists: false } },
  }
);

// Auto-expire: TTL index that removes notifications after expiresAt
NotificationSchema.index(
  { expiresAt: 1 },
  {
    name: 'idx_notifications_ttl',
    expireAfterSeconds: 0, // MongoDB checks expiresAt field value directly
    partialFilterExpression: { expiresAt: { $exists: true } },
  }
);

// Type-based queries: e.g., fetch all missed dose alerts for user
NotificationSchema.index(
  { userId: 1, type: 1, createdAt: -1 },
  { name: 'idx_notifications_user_type' }
);

// ─────────────────────────────────────────────
// 8. INSTANCE METHODS
// ─────────────────────────────────────────────

/**
 * markAsRead
 * Marks this notification as read and records the timestamp.
 */
NotificationSchema.methods.markAsRead =
  async function (): Promise<NotificationDocument> {
    if (!this.read) {
      this.read = true;
      this.readAt = new Date();
      await this.save();
    }
    return this;
  };

/**
 * isExpired
 * Returns true if this notification has passed its expiresAt date.
 */
NotificationSchema.methods.isExpired = function (): boolean {
  if (!this.expiresAt) return false;
  return new Date() > new Date(this.expiresAt);
};

// ─────────────────────────────────────────────
// 9. STATIC METHODS
// ─────────────────────────────────────────────

/**
 * findUnreadByUser
 * Returns the most recent unread notifications for a user.
 */
NotificationSchema.statics.findUnreadByUser = function (
  userId: Types.ObjectId,
  limit = 20
): Promise<NotificationDocument[]> {
  return this.find({ userId, read: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();
};

/**
 * countUnreadByUser
 * Returns the total count of unread notifications for the notification badge.
 */
NotificationSchema.statics.countUnreadByUser = function (
  userId: Types.ObjectId
): Promise<number> {
  return this.countDocuments({ userId, read: false });
};

/**
 * markAllReadByUser
 * Marks all unread notifications for a user as read.
 * Returns the number of documents updated.
 */
NotificationSchema.statics.markAllReadByUser = async function (
  userId: Types.ObjectId
): Promise<number> {
  const result = await this.updateMany(
    { userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
  return result.modifiedCount;
};

/**
 * createMedicineReminder
 * Factory: creates a standard medication reminder notification.
 */
NotificationSchema.statics.createMedicineReminder = function (params: {
  userId: Types.ObjectId;
  medicineId: Types.ObjectId;
  medicineName: string;
  scheduledTime: string;
  dueDate: Date;
}): Promise<NotificationDocument> {
  const expiresAt = new Date(params.dueDate);
  expiresAt.setHours(expiresAt.getHours() + 4); // expire 4 hours after due

  return this.create({
    userId: params.userId,
    medicineId: params.medicineId,
    type: 'reminder',
    priority: 'high',
    title: `Time to take ${params.medicineName}`,
    message: `Your scheduled dose at ${params.scheduledTime} is due now.`,
    read: false,
    actionUrl: '/medicines',
    actionLabel: 'Mark as Taken',
    scheduledFor: params.dueDate,
    expiresAt,
    metadata: {
      medicineName: params.medicineName,
      scheduledTime: params.scheduledTime,
    },
  });
};

/**
 * createMissedDoseAlert
 * Factory: creates a missed dose notification.
 */
NotificationSchema.statics.createMissedDoseAlert = function (params: {
  userId: Types.ObjectId;
  medicineId: Types.ObjectId;
  medicationLogId: Types.ObjectId;
  medicineName: string;
}): Promise<NotificationDocument> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // expire in 7 days

  return this.create({
    userId: params.userId,
    medicineId: params.medicineId,
    medicationLogId: params.medicationLogId,
    type: 'missed_dose',
    priority: 'urgent',
    title: `Missed dose: ${params.medicineName}`,
    message: `You missed your scheduled dose of ${params.medicineName}. Contact your doctor if this happens frequently.`,
    read: false,
    actionUrl: '/notifications',
    actionLabel: 'View Details',
    sentAt: new Date(),
    expiresAt,
    metadata: {
      medicineName: params.medicineName,
    },
  });
};

/**
 * createRefillAlert
 * Factory: creates a medicine refill alert notification.
 */
NotificationSchema.statics.createRefillAlert = function (params: {
  userId: Types.ObjectId;
  medicineId: Types.ObjectId;
  medicineName: string;
  pillsRemaining: number;
}): Promise<NotificationDocument> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 3); // expire in 3 days

  return this.create({
    userId: params.userId,
    medicineId: params.medicineId,
    type: 'refill_alert',
    priority: 'medium',
    title: `Refill needed: ${params.medicineName}`,
    message: `You have ${params.pillsRemaining} pill(s) of ${params.medicineName} remaining. Time to request a refill.`,
    read: false,
    actionUrl: `/medicines`,
    actionLabel: 'View Medicine',
    sentAt: new Date(),
    expiresAt,
    metadata: {
      medicineName: params.medicineName,
      pillsRemaining: params.pillsRemaining,
    },
  });
};

// ─────────────────────────────────────────────
// 10. VIRTUAL FIELDS
// ─────────────────────────────────────────────

/**
 * Virtual: timeAgo
 * Returns a human-readable relative time string.
 */
NotificationSchema.virtual('timeAgo').get(function (
  this: HydratedDocument<INotification>
) {
  const now = new Date();
  const created = new Date(this.createdAt!);
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return created.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
});

// ─────────────────────────────────────────────
// 11. EXPORT MODEL (Next.js hot-reload safe)
// ─────────────────────────────────────────────
const Notification =
  (mongoose.models.Notification as INotificationModel) ||
  model<INotification, INotificationModel>(
    'Notification',
    NotificationSchema
  );

export default Notification;