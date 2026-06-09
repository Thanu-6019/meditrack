import { NextRequest, NextResponse } from "next/server";
import { setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // get user from DB
  const user = {
    _id: "123",
    email: "test@example.com",
  };

  const response = NextResponse.json({
    success: true,
    data: user,
  });

  await setAuthCookie(response, {
    userId: user._id.toString(),
    email: user.email,
  });

  return response;
}