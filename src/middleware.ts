// src/middleware.ts
// ─────────────────────────────────────────────────────────────────────────────
// Next.js 15 App Router middleware — Edge runtime.
//
// CHANGE from previous version:
//   "/dashboard" is now in PROTECTED_ROUTES (previously commented out).
//   It was commented out as a workaround while the login flow was broken.
//   Now that the login API sets a real cookie, ALL protected routes work.
//
// ROUTE TABLE
// ───────────
//  Pathname               Auth state        Action
//  ─────────────────────────────────────────────────────────────────────────
//  /                      authenticated     redirect → /dashboard
//  /                      unauthenticated   redirect → /login
//  /login  (PUBLIC_ONLY)  authenticated     redirect → /dashboard
//  /login  (PUBLIC_ONLY)  unauthenticated   pass through
//  /dashboard (PROTECTED) authenticated     pass through
//  /dashboard (PROTECTED) unauthenticated   redirect → /login?callbackUrl=…
//  any other protected    authenticated     pass through
//  any other protected    unauthenticated   redirect → /login?callbackUrl=…
//  anything else          either            pass through
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

// ---------------------------------------------------------------------------
// Route classification
// ---------------------------------------------------------------------------

/**
 * Routes where an authenticated user should NOT stay.
 * Unauthenticated users pass through freely.
 */
const PUBLIC_ONLY_ROUTES = new Set([
  "/login",
  "/register",
  "/forgot-password",
]);

/**
 * Routes that require a valid session.
 * Matched by the top-level path segment, so /dashboard/anything is also protected.
 */
const PROTECTED_ROUTES = new Set([
  "/dashboard",       // ← restored (was incorrectly commented out)
  "/medicines",
  "/health-metrics",
  "/scanner",
  "/reports",
  "/notifications",
  "/profile",
  "/settings",
  "/appointments",
  "/ai-assistant",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extracts the top-level path segment: "/dashboard/overview" → "/dashboard" */
function topSegment(pathname: string): string {
  const first = pathname.split("/").filter(Boolean)[0];
  return first ? `/${first}` : "/";
}

/** Reads and verifies the auth cookie. Returns payload or null — never throws. */
async function getSession(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  return verifyToken(token);
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const segment      = topSegment(pathname);

  // Resolve auth state once per request
  const session         = await getSession(request);
  const isAuthenticated = session !== null;

  // ── 1. Root path ──────────────────────────────────────────────────────────
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isAuthenticated ? "/dashboard" : "/login", request.url)
    );
  }

  // ── 2. Auth-only pages (PUBLIC_ONLY) ─────────────────────────────────────
  if (PUBLIC_ONLY_ROUTES.has(segment)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // ── 3. Protected pages ────────────────────────────────────────────────────
  if (PROTECTED_ROUTES.has(segment)) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── 4. Everything else passes through ─────────────────────────────────────
  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher — keeps middleware away from static assets and API routes
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\..*).*)",
  ],
};