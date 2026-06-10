// src/app/api/auth/me/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
//
// Returns the currently authenticated user.
// Useful for: session validation on app load, profile hydration, SSR auth checks.
//
// This endpoint is also a good test that your cookies are being sent correctly.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import {
  getAuthFromRequest,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  // 1. Verify access token from cookie
  const auth = getAuthFromRequest(request);

  if (!auth.authenticated) {
    return unauthorizedResponse(auth.reason);
  }

  try {
    await connectDB();

    // 2. Fetch fresh user data from DB (don't rely solely on JWT payload)
    const user = await User.findById(auth.user.userId).lean();

    if (!user || !user.isActive) {
      return unauthorizedResponse("User not found or account disabled");
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id:           user._id.toString(),
          name:         user.name,
          email:        user.email,
          age:          user.age,
          gender:       user.gender,
          phone:        user.phone,
          healthProfile: user.healthProfile,
          lastLogin:    user.lastLogin,
          createdAt:    user.createdAt,
        },
      },
    });
  } catch (err) {
    console.error("[GET /api/auth/me]", err);
    return serverErrorResponse();
  }
}