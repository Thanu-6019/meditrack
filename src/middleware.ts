// middleware.ts  (project root — sits next to package.json)
// ─────────────────────────────────────────────────────────────────────────────
// Next.js 15 App Router middleware.
//
// Runs on the Edge runtime before every matched request.
// Only imports `jose`-based utilities (Edge-compatible).
//
// Route logic
// ───────────
//  • PUBLIC_ONLY  (/login, /register, /forgot-password)
//       Authenticated → redirect /dashboard
//       Unauthenticated → allow through
//
//  • PROTECTED    (/dashboard, /medicines, …)
//       Authenticated → allow through
//       Unauthenticated → redirect /login
//
//  • Everything else (/_next/*, /api/*, /favicon.ico, /)
//       Never matched by the config.matcher — passes through untouched.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Route sets
// ---------------------------------------------------------------------------

/**
 * Routes where an already-authenticated user should NOT linger.
 * Visiting these while logged in → bounce to /dashboard.
 */
const PUBLIC_ONLY = new Set(["/login", "/register", "/forgot-password"]);

/**
 * Routes that require a valid session.
 * Visiting these while logged out → bounce to /login.
 *
 * Listed explicitly — never include PUBLIC_ONLY paths here.
 */
const PROTECTED = new Set([
  "/dashboard",
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
// Helper: resolve the top-level segment of a pathname
// e.g. "/dashboard/overview" → "/dashboard"
// ---------------------------------------------------------------------------
function topSegment(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length ? `/${parts[0]}` : "/";
}

// ---------------------------------------------------------------------------
// middleware
// ---------------------------------------------------------------------------
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const segment = topSegment(pathname);

  // ── Fake session for testing ───────────────────────────────
  // This bypasses verifyToken and always treats you as logged in.
  const session = { userId: "test" };
  const isAuthenticated = session !== null;

  // ── Authenticated user on a public-only page ───────────────
  if (isAuthenticated && PUBLIC_ONLY.has(segment)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Unauthenticated user on a protected page ───────────────
  // (won’t trigger now because we force isAuthenticated = true)
  if (!isAuthenticated && PROTECTED.has(segment)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── All other cases: pass through ──────────────────────────
  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// config.matcher
// ---------------------------------------------------------------------------
// Limits which requests run the middleware at all.
// • Excludes Next.js internals (_next/static, _next/image)
// • Excludes static files (favicon, images, etc.)
// • Excludes all /api/* routes (API handlers do their own auth)
// • Includes every page route we care about
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *   - _next/static  (static assets)
     *   - _next/image   (image optimisation)
     *   - favicon.ico
     *   - /api routes   (handled by route handlers)
     *   - Files with an extension (e.g. .png, .svg, .js)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\..*).*)",
  ],
};
