// src/app/api/auth/login/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
//
// Architecture note — MongoDB swap guide:
//   1. Delete (or comment out) the FAKE_USER block below.
//   2. Uncomment the real lookup section that calls findUserByCredentials().
//   3. No other changes are required in this file, middleware, or jwt.ts.
//
// The function signature of findUserByCredentials() is defined in the comment
// below so you can implement it against any database.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { setAuthCookie } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The minimal shape that this handler needs from a user record.
 * Your Mongoose User document can have many more fields — only these
 * are required here.
 */
interface UserRecord {
  _id: string;
  email: string;
  // Add fullName, role, etc. here if you want them in the JWT later.
}

// ─── Fake user lookup (TEMPORARY) ────────────────────────────────────────────
// Replace this entire section with a real DB call when MongoDB is ready.
// The function contract: accepts email + password, returns UserRecord or null.

async function findUserByCredentials(
  email: string,
  _password: string            // prefixed with _ to silence the unused-var lint rule
): Promise<UserRecord | null> {
  // ── TEMPORARY ─────────────────────────────────────────────────────────────
  // Accepts any email / password and returns a fake user.
  // This lets you test the full auth flow without a database.
  //
  // ── TO ADD MONGODB ────────────────────────────────────────────────────────
  // 1. import { connectDB } from "@/lib/db";
  // 2. import User from "@/models/User";
  // 3. import bcrypt from "bcryptjs";
  //
  // const db = await connectDB();
  // const user = await User.findOne({ email }).select("+passwordHash").lean();
  // if (!user) return null;
  // const valid = await bcrypt.compare(_password, user.passwordHash);
  // if (!valid) return null;
  // return { _id: user._id.toString(), email: user.email };
  // ──────────────────────────────────────────────────────────────────────────

  if (!email) return null;

  return {
    _id: "fake-user-id-123",
    email: email,               // echo back whatever email was sent
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Parse the request body
  let email: string;
  let password: string;

  try {
    const body = (await req.json()) as { email?: string; password?: string };
    email    = (body.email    ?? "").trim().toLowerCase();
    password = (body.password ?? "").trim();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Invalid request body", code: "INVALID_BODY" } },
      { status: 400 }
    );
  }

  // 2. Basic field validation
  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: { message: "Email and password are required", code: "MISSING_FIELDS" } },
      { status: 400 }
    );
  }

  // 3. Look up the user (fake now, real DB later — same call site)
  const user = await findUserByCredentials(email, password);

  if (!user) {
    // Use a generic message to avoid user enumeration
    return NextResponse.json(
      { success: false, error: { message: "Invalid email or password", code: "INVALID_CREDENTIALS" } },
      { status: 401 }
    );
  }

  // 4. Issue JWT cookie
  const response = NextResponse.json({
    success: true,
    data: {
      id:    user._id,
      email: user.email,
    },
  });

  await setAuthCookie(response, {
    userId: user._id,
    email:  user.email,
  });

  return response;
}