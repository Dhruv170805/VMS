import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Log from '@/lib/models/Log';

export async function GET() {
  try {
    await connectDB();
    const logs = await Log.find()
      .populate('visitor_id')
      .sort({ timestamp: -1 })
      .limit(100);
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
