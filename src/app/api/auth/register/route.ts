// src/app/api/auth/register/route.ts
// ============================================================
// POST /api/auth/register — create user, issue JWT cookie
// Password hashing handled by User pre-save hook (NO bcrypt here)
// ============================================================

import { type NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { jsonOk, jsonError, parseJsonBody } from '@/lib/api-helpers';
import { signToken, buildAuthCookie } from '@/lib/jwt';
import type { AuthResponse, RegisterPayload } from '@/types';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await parseJsonBody<RegisterPayload>(req);
    if (!body) {
      return jsonError('Invalid JSON body', 400, 'INVALID_BODY');
    }

    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    // Lightweight presence checks (model enforces full validation)
    if (!fullName || fullName.length < 2) {
      return jsonError('Full name must be at least 2 characters', 422, 'VALIDATION_ERROR');
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return jsonError('A valid email address is required', 422, 'VALIDATION_ERROR');
    }
    if (!password || password.length < 8) {
      return jsonError('Password must be at least 8 characters', 422, 'VALIDATION_ERROR');
    }

    await connectDB();

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return jsonError('An account with this email already exists', 409, 'EMAIL_TAKEN');
    }

    // Pre-save hook hashes the password — DO NOT bcrypt here.
    const user = await User.create({
      fullName,
      email,
      password,
      phone: body.phone?.trim() || undefined,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
    });

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
    });

    const res = jsonOk<AuthResponse>(
      {
        user: {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
          createdAt: user.createdAt ? user.createdAt.toISOString() : null,
        },
      },
      201
    );

    const cookie = buildAuthCookie(token);
    res.cookies.set(cookie);

    return res;
  } catch (err) {
    // Handle Mongoose validation / duplicate-key errors gracefully
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
      return jsonError('An account with this email already exists', 409, 'EMAIL_TAKEN');
    }
    if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'ValidationError') {
      const message =
        (err as { message?: string }).message ?? 'Validation failed';
      return jsonError(message, 422, 'VALIDATION_ERROR');
    }
    console.error('[REGISTER_ERROR]', err);
    return jsonError('Something went wrong during registration', 500, 'SERVER_ERROR');
  }
}