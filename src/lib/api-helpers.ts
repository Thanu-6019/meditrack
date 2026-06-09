// src/lib/api-helpers.ts
// ============================================================
// API response helpers + auth wrapper for Route Handlers
// Standard envelope:
//   success: { success: true, data }
//   error:   { success: false, error: { message, code } }
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from './auth';
import type { AuthTokenPayload } from './jwt';

// ─── Response builders ───────────────────────
export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonError(
  message: string,
  status = 400,
  code: string | null = null
): NextResponse {
  return NextResponse.json(
    { success: false, error: { message, code } },
    { status }
  );
}

// ─── Route context for dynamic params ────────
export interface RouteContext {
  params: Promise<Record<string, string>>;
}

export interface AuthedContext {
  auth: AuthTokenPayload;
  params: Record<string, string>;
}

export type ProtectedHandler = (
  req: NextRequest,
  ctx: AuthedContext
) => Promise<NextResponse> | NextResponse;

/**
 * withAuth
 * Wraps a Route Handler to require a valid JWT.
 * Injects { auth, params } into the handler.
 *
 * Usage:
 *   export const GET = withAuth(async (req, { auth, params }) => { ... });
 */
export function withAuth(handler: ProtectedHandler) {
  return async (
    req: NextRequest,
    ctx?: RouteContext
  ): Promise<NextResponse> => {
    const auth = await getAuthFromRequest(req);
    if (!auth) {
      return jsonError('Unauthorized. Please log in.', 401, 'UNAUTHORIZED');
    }

    const params = ctx?.params ? await ctx.params : {};
    return handler(req, { auth, params });
  };
}

/**
 * parseJsonBody
 * Safely parses a JSON request body. Returns null on failure.
 */
export async function parseJsonBody<T = unknown>(
  req: NextRequest
): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}