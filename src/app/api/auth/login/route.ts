// src/app/api/auth/login/route.ts
// ============================================================
// POST /api/auth/login — verify credentials, update lastLogin, issue JWT
// Uses User.findByEmail() (+password) and user.comparePassword()
// ============================================================

import { type NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { jsonOk, jsonError, parseJsonBody } from '@/lib/api-helpers';
import { signToken, buildAuthCookie } from '@/lib/jwt';
import type { AuthResponse, LoginPayload } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await parseJsonBody<LoginPayload>(req);
    if (!body) {
      return jsonError('Invalid JSON body', 400, 'INVALID_BODY');
    }

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return jsonError('Email and password are required', 422, 'VALIDATION_ERROR');
    }

    await connectDB();

    // findByEmail selects +password
    const user = await User.findByEmail(email);
    if (!user) {
      return jsonError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      return jsonError('This account has been deactivated', 403, 'ACCOUNT_INACTIVE');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return jsonError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Update lastLogin without re-triggering password hashing
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

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

    const cookie = buildAuthCookie(token);
    res.cookies.set(cookie);

    return res;
  } catch (err) {
    console.error('[LOGIN_ERROR]', err);
    return jsonError('Something went wrong during login', 500, 'SERVER_ERROR');
  }
}