// src/lib/generate-todays-logs.ts
// ============================================================
// generateTodaysLogs(userId)
// Creates today's "pending" MedicationLog docs from a user's
// active medicines + their scheduledTimes. Idempotent — duplicate
// doses are rejected by the unique partial index and skipped.
// Real DB data only. No mocks.
// ============================================================

import { Types } from 'mongoose';
import Medicine from '@/models/Medicine';
import MedicationLog from '@/models/MedicationLog';

interface PendingLogSeed {
  userId: Types.ObjectId;
  medicineId: Types.ObjectId;
  medicineName: string;
  dosage: string;
  scheduledTime: string;
  dueDate: Date;
  status: 'pending';
}

/**
 * Builds a Date for today at the given HH:MM (local server time).
 */
function todayAt(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * generateTodaysLogs
 * Ensures a pending log exists for every scheduled dose today.
 * Returns the number of new log documents created.
 */
export async function generateTodaysLogs(
  userId: Types.ObjectId | string
): Promise<number> {
  const uid =
    typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Active medicines whose date range covers today
  const medicines = await Medicine.find({
    userId: uid,
    isActive: true,
    status: 'active',
    startDate: { $lte: new Date() },
    $or: [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gte: startOfDay } },
    ],
  })
    .select('name dosage scheduledTimes')
    .lean();

  if (!medicines.length) return 0;

  // Build the set of doses that SHOULD exist today
  const seeds: PendingLogSeed[] = [];
  for (const med of medicines) {
    const times: string[] = Array.isArray(med.scheduledTimes)
      ? med.scheduledTimes
      : [];
    for (const time of times) {
      seeds.push({
        userId: uid,
        medicineId: med._id as Types.ObjectId,
        medicineName: med.name,
        dosage: med.dosage,
        scheduledTime: time,
        dueDate: todayAt(time),
        status: 'pending',
      });
    }
  }

  if (!seeds.length) return 0;

  // Find which doses already exist today (any status)
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await MedicationLog.find({
    userId: uid,
    dueDate: { $gte: startOfDay, $lte: endOfDay },
  })
    .select('medicineId scheduledTime')
    .lean();

  const existingKeys = new Set(
    existing.map(
      (e) => `${String(e.medicineId)}__${e.scheduledTime}`
    )
  );

  const toInsert = seeds.filter(
    (s) => !existingKeys.has(`${String(s.medicineId)}__${s.scheduledTime}`)
  );

  if (!toInsert.length) return 0;

  try {
    // ordered:false → continue past any race-condition dup-key errors
    const result = await MedicationLog.insertMany(toInsert, {
      ordered: false,
    });
    return result.length;
  } catch (err) {
    // Unique index may reject concurrent duplicates — that's fine.
    if (
      err &&
      typeof err === 'object' &&
      'insertedDocs' in err &&
      Array.isArray((err as { insertedDocs: unknown[] }).insertedDocs)
    ) {
      return (err as { insertedDocs: unknown[] }).insertedDocs.length;
    }
    throw err;
  }
}