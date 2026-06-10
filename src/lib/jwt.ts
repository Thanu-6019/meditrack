

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// ---------------------------------------------------------------------------
// Secret — resolved lazily so process.env is always populated when called
// ---------------------------------------------------------------------------

function getSecret(): Uint8Array {
  const raw =
    process.env.JWT_SECRET ?? "meditrack-dev-secret-change-in-production";
  return new TextEncoder().encode(raw);
}

// ---------------------------------------------------------------------------
// Token payload shape
// ---------------------------------------------------------------------------

export interface TokenPayload extends JWTPayload {
  /** MongoDB ObjectId string (or fake ID during development) */
  userId: string;
  /** User's email address */
  email: string;
}

// ---------------------------------------------------------------------------
// signToken
// ---------------------------------------------------------------------------

/**
 * Signs a JWT for the given user payload.
 *
 * @param payload   - At minimum `{ userId, email }`. Extra fields are allowed
 *                    and will be included in the token.
 * @param expiresIn - jose duration string, e.g. "7d", "1h", "15m".
 * @returns Compact serialised JWT string.
 *
 * @example
 * ```ts
 * const token = await signToken({ userId: user._id, email: user.email }, "7d");
 * ```
 */
export async function signToken(
  payload: Omit<TokenPayload, "iat" | "exp">,
  expiresIn = "7d"
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}


export async function verifyToken(
  token: string | undefined
): Promise<TokenPayload | null> {
  // Fast-path: reject missing / empty tokens before calling jose
  if (!token || token.trim() === "") return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as TokenPayload;
  } catch {
    // Swallow JWTExpired, JWSSignatureVerificationFailed, JWTInvalid, etc.
    // All are equivalent to "not authenticated" from the caller's perspective.
    return null;
  }
}