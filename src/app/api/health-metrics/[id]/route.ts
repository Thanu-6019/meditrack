import { connectDB } from "@/lib/mongodb";
import { withAuth } from "@/lib/auth";
import HealthMetric from "@/models/HealthMetric";
import { NextResponse } from "next/server";

export const DELETE = withAuth(async (req: Request, auth: any, context: any) => {
  try {
    await connectDB();
    const { id } = await context.params;

    const metric = await HealthMetric.findOneAndDelete({
      _id: id,
      userId: auth.userId,
    });

    if (!metric) return NextResponse.json({ error: "Metric not found" }, { status: 404 });

    return NextResponse.json({ message: "Metric deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete metric" }, { status: 500 });
  }
});
