// src/app/api/dashboard/route.ts
// ============================================================
// GET /api/dashboard — real-time aggregated dashboard data
// Reads: Medicine, MedicationLog, HealthMetric, Notification
// All values come from MongoDB. No mock data.
// ============================================================

import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import MedicationLog from '@/models/MedicationLog';
import HealthMetric from '@/models/HealthMetric';
import Notification from '@/models/Notification';
import { withAuth, jsonOk, jsonError } from '@/lib/api-helpers';
import { generateTodaysLogs } from '@/lib/generate-todays-logs';
import type {
  DashboardDTO,
  MedicationLogDTO,
  HealthMetricDTO,
  NotificationDTO,
  LogStatus,
  MetricType,
  MetricStatus,
  NotificationType,
  NotificationPriority,
} from '@/types';

const ADHERENCE_WINDOW_DAYS = 30;
const RECENT_NOTIFICATIONS_LIMIT = 8;

// ─── Reference ranges (mirror HealthMetric model) ───────────
const METRIC_REFERENCE_RANGES: Record<
  string,
  { low?: number; high?: number }
> = {
  weight: {},
  bloodPressure: { low: 60, high: 120 },
  bloodSugar: { low: 70, high: 100 },
  heartRate: { low: 60, high: 100 },
  temperature: { low: 36.1, high: 37.2 },
  oxygenSaturation: { low: 95, high: 100 },
  cholesterol: { high: 200 },
  bmi: { low: 18.5, high: 24.9 },
};

function computeMetricStatus(
  metricType: string,
  value: number,
  systolic?: number | null
): MetricStatus {
  const range = METRIC_REFERENCE_RANGES[metricType];
  if (!range) return 'unknown';
  const checkValue =
    metricType === 'bloodPressure' ? systolic ?? value : value;
  if (range.low !== undefined && checkValue < range.low) return 'low';
  if (range.high !== undefined && checkValue > range.high) return 'high';
  if (range.low !== undefined || range.high !== undefined) return 'normal';
  return 'unknown';
}

function metricDisplayValue(
  metricType: string,
  value: number,
  unit: string,
  systolic?: number | null,
  diastolic?: number | null
): string {
  if (metricType === 'bloodPressure' && systolic && diastolic) {
    return `${systolic}/${diastolic} ${unit}`;
  }
  return `${value} ${unit}`;
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const GET = withAuth(async (_req, { auth }) => {
  try {
    await connectDB();

    const userId = new Types.ObjectId(auth.userId);

    // Ensure today's pending doses exist before reading "due today"
    await generateTodaysLogs(userId);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const adherenceSince = new Date();
    adherenceSince.setDate(adherenceSince.getDate() - ADHERENCE_WINDOW_DAYS);
    adherenceSince.setHours(0, 0, 0, 0);

    // ─── Run all reads in parallel ──────────────────────────
    const [
      userDoc,
      activeMedicinesCount,
      activeMedicines,
      dueTodayLogs,
      takenTodayCount,
      adherenceAgg,
      latestMetricsMap,
      unreadNotificationsCount,
      recentNotifications,
    ] = await Promise.all([
      // user identity (fullName/email)
      (async () => {
        const { default: User } = await import('@/models/User');
        return User.findById(userId).select('fullName email').lean<{
          fullName: string;
          email: string;
        } | null>();
      })(),

      // Active medicines count
      Medicine.countDocuments({
        userId,
        isActive: true,
        status: 'active',
      }),

      // Active medicines (for "upcoming" + nextDose)
      Medicine.find({ userId, isActive: true, status: 'active' })
        .select('name dosage scheduledTimes')
        .sort({ name: 1 })
        .lean<
          Array<{
            _id: Types.ObjectId;
            name: string;
            dosage: string;
            scheduledTimes: string[];
          }>
        >(),

      // Medicines due today (today's logs)
      MedicationLog.find({
        userId,
        dueDate: { $gte: startOfDay, $lte: endOfDay },
      })
        .sort({ scheduledTime: 1 })
        .lean<
          Array<{
            _id: Types.ObjectId;
            medicineId: Types.ObjectId;
            medicineName: string;
            dosage: string;
            scheduledTime: string;
            dueDate: Date;
            takenAt?: Date | null;
            status: LogStatus;
            minutesLate?: number | null;
            notes?: string | null;
            skippedReason?: string | null;
            createdAt?: Date;
            updatedAt?: Date;
          }>
        >(),

      // Doses taken/late today
      MedicationLog.countDocuments({
        userId,
        dueDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['taken', 'late'] },
      }),

      // Adherence aggregation over the window
      MedicationLog.aggregate<{
        _id: null;
        total: number;
        taken: number;
      }>([
        {
          $match: {
            userId,
            dueDate: { $gte: adherenceSince },
            status: { $in: ['taken', 'late', 'missed'] },
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
      ]),

      // Latest health metric per type (aggregation)
      HealthMetric.aggregate<{
        _id: Types.ObjectId;
        metricType: MetricType;
        value: number;
        systolic?: number | null;
        diastolic?: number | null;
        unit: string;
        recordedAt: Date;
        notes?: string | null;
        source?: string | null;
        deviceId?: string | null;
        createdAt?: Date;
        updatedAt?: Date;
      }>([
        { $match: { userId } },
        { $sort: { recordedAt: -1 } },
        { $group: { _id: '$metricType', doc: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$doc' } },
        { $sort: { recordedAt: -1 } },
      ]),

      // Unread notifications count
      Notification.countDocuments({ userId, read: false }),

      // Recent notifications
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(RECENT_NOTIFICATIONS_LIMIT)
        .lean<
          Array<{
            _id: Types.ObjectId;
            medicineId?: Types.ObjectId | null;
            medicationLogId?: Types.ObjectId | null;
            type: NotificationType;
            priority: NotificationPriority;
            title: string;
            message: string;
            read: boolean;
            readAt?: Date | null;
            actionUrl?: string | null;
            actionLabel?: string | null;
            createdAt?: Date;
          }>
        >(),
    ]);

    if (!userDoc) {
      return jsonError('User not found', 404, 'USER_NOT_FOUND');
    }

    // ─── Adherence % ────────────────────────────────────────
    const adherenceRate =
      adherenceAgg.length && adherenceAgg[0].total > 0
        ? Math.round((adherenceAgg[0].taken / adherenceAgg[0].total) * 100)
        : 0;

    // ─── Map: Due Today logs → DTO ──────────────────────────
    const nowHHMM =
      String(new Date().getHours()).padStart(2, '0') +
      ':' +
      String(new Date().getMinutes()).padStart(2, '0');

    const dueToday: MedicationLogDTO[] = dueTodayLogs.map((log) => ({
      id: String(log._id),
      medicineId: String(log.medicineId),
      medicineName: log.medicineName,
      dosage: log.dosage,
      scheduledTime: log.scheduledTime,
      dueDate: log.dueDate.toISOString(),
      takenAt: log.takenAt ? new Date(log.takenAt).toISOString() : null,
      status: log.status,
      minutesLate: log.minutesLate ?? null,
      notes: log.notes ?? null,
      skippedReason: log.skippedReason ?? null,
      isOverdue:
        log.status === 'pending' && new Date() > new Date(log.dueDate),
      createdAt: log.createdAt ? log.createdAt.toISOString() : null,
      updatedAt: log.updatedAt ? log.updatedAt.toISOString() : null,
    }));

    const dueTodayCount = dueToday.length;

    // ─── Upcoming medicines (compute nextDose) ──────────────
    const upcomingMedicines = activeMedicines.map((med) => {
      const times = Array.isArray(med.scheduledTimes)
        ? [...med.scheduledTimes].sort()
        : [];
      const future = times.filter((t) => t > nowHHMM);
      const nextDose = future.length > 0 ? future[0] : times[0] ?? null;
      return {
        id: String(med._id),
        name: med.name,
        dosage: med.dosage,
        nextDose,
      };
    });

    // ─── Recent health metrics → DTO ────────────────────────
    const recentHealthMetrics: HealthMetricDTO[] = latestMetricsMap.map(
      (m) => ({
        id: String(m._id),
        metricType: m.metricType,
        value: m.value,
        systolic: m.systolic ?? null,
        diastolic: m.diastolic ?? null,
        unit: m.unit,
        recordedAt: new Date(m.recordedAt).toISOString(),
        notes: m.notes ?? null,
        source: m.source ?? null,
        deviceId: m.deviceId ?? null,
        status: computeMetricStatus(m.metricType, m.value, m.systolic ?? null),
        displayValue: metricDisplayValue(
          m.metricType,
          m.value,
          m.unit,
          m.systolic ?? null,
          m.diastolic ?? null
        ),
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
        updatedAt: m.updatedAt ? new Date(m.updatedAt).toISOString() : null,
      })
    );

    // ─── Notifications → DTO ────────────────────────────────
    const notifications: NotificationDTO[] = recentNotifications.map((n) => ({
      id: String(n._id),
      medicineId: n.medicineId ? String(n.medicineId) : null,
      medicationLogId: n.medicationLogId ? String(n.medicationLogId) : null,
      type: n.type,
      priority: n.priority,
      title: n.title,
      message: n.message,
      read: n.read,
      readAt: n.readAt ? new Date(n.readAt).toISOString() : null,
      actionUrl: n.actionUrl ?? null,
      actionLabel: n.actionLabel ?? null,
      timeAgo: n.createdAt ? relativeTime(new Date(n.createdAt)) : '',
      createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : null,
    }));

    // ─── Final payload ──────────────────────────────────────
    const payload: DashboardDTO = {
      user: {
        fullName: userDoc.fullName,
        email: userDoc.email,
      },
      activeMedicinesCount,
      dueTodayCount,
      takenTodayCount,
      adherenceRate,
      dueToday,
      upcomingMedicines,
      recentHealthMetrics,
      notifications,
      unreadNotificationsCount,
    };

    return jsonOk<DashboardDTO>(payload);
  } catch (err) {
    console.error('[DASHBOARD_ERROR]', err);
    return jsonError('Failed to load dashboard data', 500, 'SERVER_ERROR');
  }
});