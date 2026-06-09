// src/lib/jwt.ts
// ─────────────────────────────────────────────────────────────────────────────
// Thin wrapper around `jose` for signing and verifying JWTs.
// jose is Edge-runtime compatible, so this works in middleware.ts.
//
// Usage:
//   Server-side (API routes):  import { signToken, verifyToken } from "@/lib/jwt"
//   Middleware:                 import { verifyToken }            from "@/lib/jwt"
// ─────────────────────────────────────────────────────────────────────────────

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// ---------------------------------------------------------------------------
// Secret key
// ---------------------------------------------------------------------------
// Derive a Uint8Array key from the env variable once at module load.
// Falls back to a hard-coded dev secret so the app boots locally without .env.
// In production, JWT_SECRET *must* be set to a long random string.
// ---------------------------------------------------------------------------
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "meditrack-dev-secret-change-in-production"
);

// ---------------------------------------------------------------------------
// Payload shape
// ---------------------------------------------------------------------------
export interface TokenPayload extends JWTPayload {
  /** MongoDB ObjectId string */
  userId: string;
  email: string;
}

// ---------------------------------------------------------------------------
// signToken
// ---------------------------------------------------------------------------
/**
 * Create a signed JWT for the given user.
 *
 * @param payload  - { userId, email } — any extra fields are allowed
 * @param expiresIn - Expiry expressed as a `jose` duration string, e.g. "7d", "1h"
 * @returns        Compact JWT string
 */
export async function signToken(
  payload: Omit<TokenPayload, "iat" | "exp">,
  expiresIn: string = "7d"
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

// ---------------------------------------------------------------------------
// verifyToken
// ---------------------------------------------------------------------------
/**
 * Verify a JWT and return its payload.
 * Returns `null` instead of throwing so callers can handle gracefully.
 *
 * @param token - Compact JWT string
 * @returns     Decoded payload, or `null` if invalid / expired
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}