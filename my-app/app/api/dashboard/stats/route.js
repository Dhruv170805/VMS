import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Visitor from '@/lib/models/Visitor';

export async function GET() {
  try {
    await connectDB();
    const stats = await Visitor.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const formatted = {
      PENDING: 0, APPROVED: 0, REJECTED: 0, GATE_IN: 0, MEET_IN: 0, MEET_OVER: 0, GATE_OUT: 0, TOTAL: 0
    };

    stats.forEach(s => {
      formatted[s._id] = s.count;
      formatted.TOTAL += s.count;
    });

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
