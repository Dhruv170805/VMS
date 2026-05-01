import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Visitor from '@/lib/models/Visitor';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { hostId } = params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    
    const filter = { host_id: hostId };
    if (status) {
      filter.status = status;
    }

    const visitors = await Visitor.find(filter)
      .populate('host_id')
      .sort({ created_at: -1 });
      
    return NextResponse.json(visitors);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
