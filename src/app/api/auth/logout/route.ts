// src/app/api/auth/logout/route.ts
// ============================================================
// POST /api/auth/logout — clear the auth cookie
// ============================================================

import { jsonOk } from '@/lib/api-helpers';
import { buildClearAuthCookie } from '@/lib/jwt';

export async function POST() {
  const res = jsonOk<{ message: string }>({ message: 'Logged out successfully' });
  res.cookies.set(buildClearAuthCookie());
  return res;
}