import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Visitor from '@/lib/models/Visitor';
import Log from '@/lib/models/Log';
import jwt from 'jsonwebtoken';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const { status } = await req.json();
    
    const updateData = { status };
    if (status === 'APPROVED') {
      if (!updateData['visit_timestamps']) updateData['visit_timestamps'] = {};
      updateData['visit_timestamps.approved_at'] = new Date();
    }

    const visitor = await Visitor.findByIdAndUpdate(id, updateData, { new: true }).populate('host_id');
    
    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    await new Log({
      visitor_id: visitor._id,
      event: status,
      actor: 'HOST'
    }).save();

    let qrCode = null;
    if (status === 'APPROVED') {
      const expiresIn = Math.floor((visitor.validity.to.getTime() - Date.now()) / 1000);
      if (expiresIn > 0) {
        qrCode = jwt.sign(
          { visitorId: visitor._id },
          process.env.JWT_SECRET,
          { expiresIn }
        );
      }
    }

    return NextResponse.json({ message: `Visitor ${status.toLowerCase()} successfully`, visitor, qrCode });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
