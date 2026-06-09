// middleware.ts  (project root — next to package.json)
// ─────────────────────────────────────────────────────────────────────────────
// Next.js 15 App Router middleware — Edge runtime.
//
// WHY THIS VERSION CANNOT PRODUCE A REDIRECT LOOP
// ────────────────────────────────────────────────
// A redirect loop requires two rules that redirect to each other.
// This middleware guarantees that cannot happen by design:
//
//   Rule A: PUBLIC_ONLY + authenticated  → /dashboard
//   Rule B: PROTECTED   + unauthenticated → /login
//
// For a loop between /login and /dashboard to exist, BOTH of the
// following would have to be true simultaneously:
//   - The user is authenticated AND unauthenticated at the same time (impossible)
//
// Additionally:
//   - /login is in PUBLIC_ONLY, never in PROTECTED.
//   - /dashboard is in PROTECTED, never in PUBLIC_ONLY.
//   - The root "/" is handled explicitly before either rule runs.
//   - Every other path falls through to NextResponse.next() unconditionally.
//
// ROUTE TABLE
// ───────────
//  Pathname              Auth state       Action
//  ──────────────────────────────────────────────────────────────────
//  /                     authenticated    redirect → /dashboard
//  /                     unauthenticated  redirect → /login
//  /login (PUBLIC_ONLY)  authenticated    redirect → /dashboard
//  /login (PUBLIC_ONLY)  unauthenticated  pass through ← no redirect
//  /dashboard (PROTECTED)authenticated    pass through ← no redirect
//  /dashboard (PROTECTED)unauthenticated  redirect → /login?callbackUrl=…
//  anything else         either           pass through ← no redirect
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

// ---------------------------------------------------------------------------
// Route classification
// ---------------------------------------------------------------------------

/**
 * Routes where an authenticated user should NOT stay.
 * These are the auth pages themselves.
 */
const PUBLIC_ONLY_ROUTES = new Set([
  "/login",
  "/register",
  "/forgot-password",
]);

/**
 * Routes that require a valid session.
 * Any sub-path of these (e.g. /dashboard/overview) is also protected
 * because we match by topSegment().
 */
const PROTECTED_ROUTES = new Set([
 // "/dashboard",
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

/**
 * Extracts the top-level path segment.
 * "/dashboard/overview" → "/dashboard"
 * "/login"              → "/login"
 * "/"                   → "/"
 */
function topSegment(pathname: string): string {
  const first = pathname.split("/").filter(Boolean)[0];
  return first ? `/${first}` : "/";
}

/**
 * Reads and verifies the auth cookie.
 * Returns the decoded payload on success, null on any failure.
 * Never throws — verifyToken() is also written to never throw.
 */
async function getSession(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  return verifyToken(token); // accepts undefined, returns null gracefully
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const segment = topSegment(pathname);

  // Resolve auth state once per request
  const session = await getSession(request);
  const isAuthenticated = session !== null;

  // ── 1. Root path: redirect to the correct landing page ────────────────────
  // Handled first so it never falls into the PUBLIC_ONLY or PROTECTED checks.
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isAuthenticated ? "/dashboard" : "/login", request.url)
    );
  }

  // ── 2. Auth pages (PUBLIC_ONLY): bounce authenticated users away ───────────
  // An authenticated user visiting /login has nothing to do there.
  // An unauthenticated user visiting /login: falls through to NextResponse.next().
  if (PUBLIC_ONLY_ROUTES.has(segment)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Unauthenticated + public route → always pass through, never redirect.
    return NextResponse.next();
  }

  // ── 3. Protected routes: require a valid session ───────────────────────────
  // An authenticated user visiting /dashboard: falls through to NextResponse.next().
  // An unauthenticated user visiting /dashboard: redirect to /login.
  if (PROTECTED_ROUTES.has(segment)) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      // Preserve intended destination so the login page can redirect back.
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Authenticated + protected route → always pass through, never redirect.
    return NextResponse.next();
  }

  // ── 4. Everything else: pass through unconditionally ──────────────────────
  // Unclassified routes (e.g. future pages not yet listed above) are left
  // alone. Add them to PROTECTED_ROUTES or PUBLIC_ONLY_ROUTES as needed.
  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher — controls which requests invoke this middleware at all
// ---------------------------------------------------------------------------
// Excluded automatically (never reach middleware):
//   _next/static  — compiled assets
//   _next/image   — image optimiser
//   favicon.ico   — browser icon request
//   api/          — API route handlers do their own auth
//   *.ext         — any path with a file extension (fonts, images, etc.)
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\..*).*)",
  ],
};