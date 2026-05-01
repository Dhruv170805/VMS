import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Visitor from '@/lib/models/Visitor';
import Log from '@/lib/models/Log';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    await connectDB();
    const { token, visitorCode } = await req.json();
    let visitor;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      visitor = await Visitor.findById(decoded.visitorId);
    } else if (visitorCode) {
      visitor = await Visitor.findOne({ visitor_code: visitorCode });
    }

    if (!visitor) return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    if (visitor.status !== 'MEET_OVER') {
      return NextResponse.json({ error: 'Meeting not marked over yet' }, { status: 400 });
    }

    visitor.status = 'GATE_OUT';
    if (!visitor.visit_timestamps) visitor.visit_timestamps = {};
    visitor.visit_timestamps.gate_out_at = new Date();
    await visitor.save();

    await new Log({
      visitor_id: visitor._id,
      event: 'GATE_OUT',
      actor: 'GUARD'
    }).save();

    return NextResponse.json({ message: 'Gate exit marked successful', visitor });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid or expired credentials' }, { status: 401 });
  }
}
