// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  clearAuthCookie(response);
  return response;
}