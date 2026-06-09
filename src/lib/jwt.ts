// src/lib/jwt.ts
// ============================================================
// JWT utilities — sign/verify auth tokens (Edge + Node safe)
// Payload: { userId, email }
// ============================================================

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    'Missing JWT_SECRET environment variable. Define it in .env.local'
  );
}

const secret = new TextEncoder().encode(JWT_SECRET);

// ─── Constants ───────────────────────────────
export const JWT_ALG = 'HS256';
export const JWT_EXPIRY = '7d';
export const COOKIE_NAME = 'meditrack_token';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (seconds)

// ─── Payload shape ───────────────────────────
export interface AuthTokenPayload extends JWTPayload {
  userId: string;
  email: string;
}

/**
 * signToken
 * Creates a signed JWT containing { userId, email }.
 */
export async function signToken(input: {
  userId: string;
  email: string;
}): Promise<string> {
  return new SignJWT({ userId: input.userId, email: input.email })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);
}

/**
 * verifyToken
 * Verifies a JWT and returns the decoded payload, or null if invalid/expired.
 */
export async function verifyToken(
  token: string
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });

    if (
      typeof payload.userId !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      return null;
    }

    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}

// ─── Cookie option helpers ───────────────────
export function buildAuthCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  };
}

export function buildClearAuthCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}