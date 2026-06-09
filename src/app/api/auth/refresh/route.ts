// src/app/api/auth/refresh/route.ts
// ============================================================
// POST /api/auth/refresh — re-issue a fresh JWT from the current valid cookie
// Validates the user still exists & is active, then rotates the token.
// ============================================================

import { type NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { jsonOk, jsonError } from '@/lib/api-helpers';
import { getAuthFromRequest } from '@/lib/auth';
import { signToken, buildAuthCookie, buildClearAuthCookie } from '@/lib/jwt';
import type { AuthResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) {
      return jsonError('Unauthorized. Please log in.', 401, 'UNAUTHORIZED');
    }

    await connectDB();

    const user = await User.findById(auth.userId).select(
      'fullName email isActive lastLogin createdAt'
    );

    if (!user || !user.isActive) {
      // Token references a missing/inactive user — clear the cookie
      const res = jsonError('Session is no longer valid', 401, 'SESSION_INVALID');
      res.cookies.set(buildClearAuthCookie());
      return res;
    }

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
    });

    const res = jsonOk<AuthResponse>({
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
        createdAt: user.createdAt ? user.createdAt.toISOString() : null,
      },
    });

    res.cookies.set(buildAuthCookie(token));
    return res;
  } catch (err) {
    console.error('[REFRESH_ERROR]', err);
    return jsonError('Something went wrong while refreshing session', 500, 'SERVER_ERROR');
  }
}