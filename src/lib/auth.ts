// src/lib/auth.ts
// ─────────────────────────────────────────────────────────────────────────────
// Server-side auth utilities used by API route handlers (Node.js runtime).
//
// This file is intentionally NOT imported in middleware.ts because it uses
// `next/headers` and Node-only APIs. Middleware uses jwt.ts directly.
//
// Exports:
//   AUTH_COOKIE      — the canonical cookie name used everywhere
//   setAuthCookie    — write the JWT cookie on a NextResponse / Response
//   clearAuthCookie  — remove the JWT cookie on logout
//   getSessionUser   — read + verify the token from a server-side request
// ─────────────────────────────────────────────────────────────────────────────

import { type NextRequest, NextResponse } from "next/server";
import { signToken, verifyToken, type TokenPayload } from "./jwt";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Single source of truth for the cookie name. */
export const AUTH_COOKIE = "token";

/**
 * How long the session lasts.
 * Update both values together so the cookie and JWT stay in sync.
 */
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SESSION_DURATION_JWT = "7d";

// ---------------------------------------------------------------------------
// setAuthCookie
// ---------------------------------------------------------------------------
/**
 * Sign a JWT for the given user and attach it to `response` as an
 * HTTP-only, Secure, SameSite=Lax cookie.
 *
 * @example
 * ```ts
 * // Inside a POST /api/auth/login handler:
 * const response = NextResponse.json({ success: true, data: user });
 * await setAuthCookie(response, { userId: user.id, email: user.email });
 * return response;
 * ```
 */
export async function setAuthCookie(
  response: NextResponse,
  payload: Omit<TokenPayload, "iat" | "exp">
): Promise<void> {
  const token = await signToken(payload, SESSION_DURATION_JWT);

  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

// ---------------------------------------------------------------------------
// clearAuthCookie
// ---------------------------------------------------------------------------
/**
 * Expire the auth cookie immediately (used by logout routes).
 *
 * @example
 * ```ts
 * // Inside a POST /api/auth/logout handler:
 * const response = NextResponse.json({ success: true });
 * clearAuthCookie(response);
 * return response;
 * ```
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

// ---------------------------------------------------------------------------
// getSessionUser
// ---------------------------------------------------------------------------
/**
 * Extract and verify the JWT from an incoming request.
 * Returns the decoded payload or `null` if unauthenticated / token invalid.
 *
 * Useful inside API route handlers that need the caller's identity:
 *
 * @example
 * ```ts
 * // GET /api/medicines
 * export async function GET(req: NextRequest) {
 *   const session = await getSessionUser(req);
 *   if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *   // ...
 * }
 * ```
 */
export async function getSessionUser(
  req: NextRequest
): Promise<TokenPayload | null> {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}