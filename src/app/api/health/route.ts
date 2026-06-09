import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { HealthMetric } from '@/models/schemas';
import { getSession } from '@/lib/auth';

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const metrics = await HealthMetric.find({ userId }).sort({ timestamp: 1 }); // Chronological for charts
  return NextResponse.json(metrics);
}

export async function POST(req: Request) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const data = await req.json();
  const metric = await HealthMetric.create({ ...data, userId });
  return NextResponse.json(metric, { status: 201 });
}