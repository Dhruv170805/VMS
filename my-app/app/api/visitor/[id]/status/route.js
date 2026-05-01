import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Visitor from '@/lib/models/Visitor';
import Log from '@/lib/models/Log';

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const { status } = await req.json();

    const timestampField = status.toLowerCase() + '_at';
    const updateData = { status };
    updateData[`visit_timestamps.${timestampField}`] = new Date();

    const visitor = await Visitor.findByIdAndUpdate(id, updateData, { new: true });
    if (!visitor) return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });

    await new Log({
      visitor_id: visitor._id,
      event: status,
      actor: 'ADMIN' // Simplified for now, could be dynamic based on token
    }).save();

    return NextResponse.json({ message: `Status updated to ${status}`, visitor });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
