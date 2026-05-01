import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Visitor from '@/lib/models/Visitor';

export async function GET() {
  try {
    await connectDB();
    const visitors = await Visitor.find({ status: 'PENDING' })
      .populate('host_id')
      .sort({ created_at: -1 });
    return NextResponse.json(visitors);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
