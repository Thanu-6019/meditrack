// src/app/api/auth/me/route.ts
// ============================================================
// GET /api/auth/me — return the currently authenticated user
// Protected via withAuth (JWT verification)
// ============================================================

import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, jsonOk, jsonError } from '@/lib/api-helpers';
import type { AuthResponse } from '@/types';

export const GET = withAuth(async (_req, { auth }) => {
  try {
    await connectDB();

    const user = await User.findById(auth.userId).select(
      'fullName email isActive lastLogin createdAt'
    );

    if (!user) {
      return jsonError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      return jsonError('This account has been deactivated', 403, 'ACCOUNT_INACTIVE');
    }

    return jsonOk<AuthResponse>({
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
        createdAt: user.createdAt ? user.createdAt.toISOString() : null,
      },
    });
  } catch (err) {
    console.error('[ME_ERROR]', err);
    return jsonError('Failed to fetch user', 500, 'SERVER_ERROR');
  }
});