import { connectDB } from "@/lib/mongodb";
import { withAuth } from "@/lib/auth";
import HealthMetric from "@/models/HealthMetric";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req: Request, auth: any) => {
  try {
    await connectDB();
    const metrics = await HealthMetric.find({ userId: auth.userId }).sort({ recordedAt: -1 });
    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error("[HEALTH_METRICS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch health metrics" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req: Request, auth: any) => {
  try {
    await connectDB();
    const body = await req.json();
    const metric = await HealthMetric.create({
      ...body,
      userId: auth.userId,
      recordedAt: body.recordedAt || new Date(),
    });
    return NextResponse.json(metric, { status: 201 });
  } catch (error: any) {
    console.error("[HEALTH_METRICS_POST]", error);
    return NextResponse.json(
      { error: error.message || "Failed to create health metric" },
      { status: 400 }
    );
  }
});
