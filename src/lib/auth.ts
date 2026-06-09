// src/lib/auth.ts
// ============================================================
// Server-side auth helpers — read current user from JWT cookie
// ============================================================

import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME, verifyToken, type AuthTokenPayload } from './jwt';


/**
 * getAuthFromRequest
 * Reads + verifies the auth token from a NextRequest (Route Handlers / middleware).
 * Returns the decoded payload or null.
 */
export async function getAuthFromRequest(
  req: NextRequest
): Promise<AuthTokenPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * getCurrentUser
 * Reads + verifies the auth token from the cookies() store
 * (Server Components / Server Actions / protected layouts).
 * Returns the decoded payload or null.
 */
export async function getCurrentUser(): Promise<AuthTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * requireUser
 * Like getCurrentUser but throws if unauthenticated.
 * Useful inside Server Components that must have a user.
 */
export async function requireUser(): Promise<AuthTokenPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }
  return user;
}

/**
 * withAuth
 * Higher-order function for API route handlers.
 * Wraps a handler and ensures the user is authenticated.
 */
export function withAuth(handler: Function) {
  return async (req: any, res: any) => {
    const auth = await getCurrentUser();   // ✅ rename here
    if (!auth) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return handler(req, res, auth);        // ✅ pass auth instead of session
  };
}
