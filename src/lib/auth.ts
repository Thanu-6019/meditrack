

import { type NextRequest, NextResponse } from "next/server";
import { signToken, verifyToken, type TokenPayload } from "./jwt";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Cookie name used everywhere in the app. Change here to change everywhere. */
export const AUTH_COOKIE = "token";

/** Session duration — keep the cookie maxAge and JWT expiresIn in sync. */
const SESSION_SECONDS = 60 * 60 * 24 * 7;  // 7 days
const SESSION_JWT     = "7d";


export async function setAuthCookie(
  response: NextResponse,
  payload: Omit<TokenPayload, "iat" | "exp">
): Promise<void> {
  const token = await signToken(payload, SESSION_JWT);

  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   SESSION_SECONDS,
    path:     "/",
  });
}



export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   0,
    path:     "/",
  });
}


export async function getSessionUser(
  req: NextRequest
): Promise<TokenPayload | null> {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  return verifyToken(token);
}