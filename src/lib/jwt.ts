// src/lib/jwt.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge-runtime-compatible JWT utilities using `jose`.
//
// KEY CHANGE FROM PREVIOUS VERSION:
//   The secret key is now derived lazily (inside each function call) rather
//   than at module load time. This prevents a silent bug where the Edge
//   runtime cold-starts the middleware before .env.local values are injected,
//   causing the secret to be wrong and verifyToken() to return null for every
//   valid token — which is the root cause of the redirect loop.
// ─────────────────────────────────────────────────────────────────────────────

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// ---------------------------------------------------------------------------
// Secret — resolved lazily so env vars are always available when called
// ---------------------------------------------------------------------------

/**
 * Returns the secret key as a Uint8Array.
 * Called inside signToken / verifyToken rather than at module scope,
 * so process.env.JWT_SECRET is always read at call time, not import time.
 */
function getSecret(): Uint8Array {
  const raw =
    process.env.JWT_SECRET ?? "meditrack-dev-secret-change-in-production";
  return new TextEncoder().encode(raw);
}

// ---------------------------------------------------------------------------
// Payload shape
// ---------------------------------------------------------------------------

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
}

// ---------------------------------------------------------------------------
// signToken
// ---------------------------------------------------------------------------

/**
 * Create a signed JWT for the given user.
 *
 * @param payload   - { userId, email } — any extra fields are allowed
 * @param expiresIn - jose duration string, e.g. "7d", "1h"
 * @returns         Compact JWT string
 */
export async function signToken(
  payload: Omit<TokenPayload, "iat" | "exp">,
  expiresIn = "7d"
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret()); // ← lazy, not module-level
}

// ---------------------------------------------------------------------------
// verifyToken
// ---------------------------------------------------------------------------

/**
 * Verify a JWT and return its payload.
 *
 * Returns null instead of throwing so middleware can handle the result
 * gracefully without a try/catch at the call site.
 *
 * Failures that return null:
 *   - Token missing or empty string
 *   - Signature invalid (wrong secret, tampered token)
 *   - Token expired
 *   - Malformed JWT structure
 *   - Any unexpected error from jose
 *
 * @param token - Compact JWT string (may be empty / undefined)
 * @returns     Decoded payload, or null if invalid for any reason
 */
export async function verifyToken(
  token: string | undefined
): Promise<TokenPayload | null> {
  // Guard: reject empty / missing tokens before calling jose
  if (!token || token.trim() === "") return null;

  try {
    const { payload } = await jwtVerify(token, getSecret()); // ← lazy
    return payload as TokenPayload;
  } catch {
    // jose throws JWTExpired, JWSSignatureVerificationFailed, etc.
    // We intentionally swallow all of them and return null so the
    // caller (middleware) treats any failure as "unauthenticated".
    return null;
  }
}