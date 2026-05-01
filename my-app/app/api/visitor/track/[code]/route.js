import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Visitor from '@/lib/models/Visitor';
import jwt from 'jsonwebtoken';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { code } = params;
    const visitor = await Visitor.findOne({ visitor_code: code }).populate('host_id');
    if (!visitor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let token = null;
    if (['APPROVED', 'GATE_IN', 'MEET_IN', 'MEET_OVER'].includes(visitor.status)) {
      const expiresIn = Math.floor((visitor.validity.to.getTime() - Date.now()) / 1000);
      if (expiresIn > 0) {
        token = jwt.sign({ visitorId: visitor._id }, process.env.JWT_SECRET, { expiresIn });
      }
    }
    return NextResponse.json({ visitor, token });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
