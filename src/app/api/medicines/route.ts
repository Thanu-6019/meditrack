// src/app/api/medicines/route.ts
// ============================================================
// GET  /api/medicines        — list user's medicines (filterable)
// POST /api/medicines        — create a new medicine
// All scoped by userId from JWT. Uses Medicine model.
// ============================================================
import { Types, type HydratedDocument } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Medicine, {
  FREQUENCY_OPTIONS,
  MEDICINE_STATUS,
  ROUTE_OF_ADMIN,
  type IMedicine,
  type IMedicineMethods,
} from '@/models/Medicine';
import { withAuth, jsonOk, jsonError, parseJsonBody } from '@/lib/api-helpers';
import type {
  MedicineDTO,
  CreateMedicinePayload,
  FrequencyOption,
  MedicineStatus,
  RouteOfAdmin,
} from '@/types';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// ─── Serializer: Medicine document → DTO ─────────────────────
function toMedicineDTO(
  med: HydratedDocument<IMedicine, IMedicineMethods>
): MedicineDTO {
  // nextDose is a virtual; access via toObject to ensure it's computed
type LocalDTO = IMedicine & {
  _id: Types.ObjectId;
  nextDose?: string | null;   // ✅ add this
};

  const obj: LocalDTO = med.toObject({ virtuals: true });

  return {
    id: String(obj._id),
    name: obj.name,
    genericName: obj.genericName ?? null,
    dosage: obj.dosage,
    frequency: obj.frequency as FrequencyOption,
    timesPerDay: obj.timesPerDay,
    scheduledTimes: obj.scheduledTimes ?? [],
    startDate: new Date(obj.startDate).toISOString(),
    endDate: obj.endDate ? new Date(obj.endDate).toISOString() : null,
    routeOfAdministration: obj.routeOfAdministration as RouteOfAdmin,
    purpose: obj.purpose ?? null,
    prescribedBy: obj.prescribedBy ?? null,
    pharmacy: obj.pharmacy ?? null,
    refillDate: obj.refillDate ? new Date(obj.refillDate).toISOString() : null,
    pillsRemaining: obj.pillsRemaining ?? null,
    totalPills: obj.totalPills ?? null,
    notes: obj.notes ?? null,
    status: obj.status as MedicineStatus,
    isActive: obj.isActive,
    isValidated: obj.isValidated,
    nextDose: obj.nextDose ?? null,
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : null,
    updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : null,
  };
}

// ============================================================
// GET /api/medicines
// Query params:
//   ?active=true        → only active medicines (uses findActiveByUser)
//   ?status=active|...  → filter by status
// Default: all medicines for the user, newest first.
// ============================================================
export const GET = withAuth(async (req, { auth }) => {
  try {
    await connectDB();
    const userId = new Types.ObjectId(auth.userId);

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';
    const statusFilter = searchParams.get('status');

    let medicines: HydratedDocument<IMedicine, IMedicineMethods>[];

    if (activeOnly) {
      // Model static
      medicines = await Medicine.findActiveByUser(userId);
    } else {
      const query: Record<string, unknown> = { userId };
      if (statusFilter) {
        if (!MEDICINE_STATUS.includes(statusFilter as MedicineStatus)) {
          return jsonError(
            `Invalid status filter: ${statusFilter}`,
            422,
            'VALIDATION_ERROR'
          );
        }
        query.status = statusFilter;
      }
      medicines = await Medicine.find(query).sort({ createdAt: -1 }).exec();
    }

    return jsonOk<MedicineDTO[]>(medicines.map(toMedicineDTO));
  } catch (err) {
    console.error('[MEDICINES_GET_ERROR]', err);
    return jsonError('Failed to fetch medicines', 500, 'SERVER_ERROR');
  }
});

// ============================================================
// POST /api/medicines
// ============================================================
export const POST = withAuth(async (req, { auth }) => {
  try {
    const body = await parseJsonBody<CreateMedicinePayload>(req);
    if (!body) {
      return jsonError('Invalid JSON body', 400, 'INVALID_BODY');
    }

    // ─── Presence checks (model owns full validation) ───────
    if (!body.name?.trim()) {
      return jsonError('Medicine name is required', 422, 'VALIDATION_ERROR');
    }
    if (!body.dosage?.trim()) {
      return jsonError('Dosage is required', 422, 'VALIDATION_ERROR');
    }
    if (!body.frequency || !FREQUENCY_OPTIONS.includes(body.frequency)) {
      return jsonError('A valid frequency is required', 422, 'VALIDATION_ERROR');
    }
    if (
      typeof body.timesPerDay !== 'number' ||
      body.timesPerDay < 1 ||
      body.timesPerDay > 24
    ) {
      return jsonError('timesPerDay must be between 1 and 24', 422, 'VALIDATION_ERROR');
    }
    if (
      !Array.isArray(body.scheduledTimes) ||
      body.scheduledTimes.length === 0 ||
      !body.scheduledTimes.every((t) => TIME_REGEX.test(t))
    ) {
      return jsonError(
        'scheduledTimes must be a non-empty array of HH:MM values',
        422,
        'VALIDATION_ERROR'
      );
    }
    if (!body.startDate) {
      return jsonError('Start date is required', 422, 'VALIDATION_ERROR');
    }
    if (
      body.routeOfAdministration &&
      !ROUTE_OF_ADMIN.includes(body.routeOfAdministration)
    ) {
      return jsonError('Invalid route of administration', 422, 'VALIDATION_ERROR');
    }
    if (body.status && !MEDICINE_STATUS.includes(body.status)) {
      return jsonError('Invalid status', 422, 'VALIDATION_ERROR');
    }

    await connectDB();
    const userId = new Types.ObjectId(auth.userId);

    // Pre-save hook auto-computes isActive
    const medicine = await Medicine.create({
      userId,
      name: body.name.trim(),
      genericName: body.genericName?.trim() || undefined,
      dosage: body.dosage.trim(),
      frequency: body.frequency,
      timesPerDay: body.timesPerDay,
      scheduledTimes: body.scheduledTimes,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      routeOfAdministration: body.routeOfAdministration ?? 'oral',
      purpose: body.purpose?.trim() || undefined,
      prescribedBy: body.prescribedBy?.trim() || undefined,
      pharmacy: body.pharmacy?.trim() || undefined,
      refillDate: body.refillDate ? new Date(body.refillDate) : undefined,
      pillsRemaining: body.pillsRemaining ?? undefined,
      totalPills: body.totalPills ?? undefined,
      notes: body.notes?.trim() || undefined,
      status: body.status ?? 'active',
    });

    return jsonOk<MedicineDTO>(toMedicineDTO(medicine), 201);
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'name' in err &&
      (err as { name: string }).name === 'ValidationError'
    ) {
      return jsonError(
        (err as { message?: string }).message ?? 'Validation failed',
        422,
        'VALIDATION_ERROR'
      );
    }
    console.error('[MEDICINES_POST_ERROR]', err);
    return jsonError('Failed to create medicine', 500, 'SERVER_ERROR');
  }
});