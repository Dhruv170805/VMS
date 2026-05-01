import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Visitor from '@/lib/models/Visitor';
import SystemConfig from '@/lib/models/SystemConfig';
import Blacklist from '@/lib/models/Blacklist';
import Log from '@/lib/models/Log';

export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();
    
    // Simple Blacklist check
    const isBlacklisted = await Blacklist.findOne({
      $or: [
        { value: data.email, type: 'EMAIL' },
        { value: data.phone, type: 'PHONE' }
      ]
    });
    if (isBlacklisted) return NextResponse.json({ error: 'Access Denied: Blacklisted' }, { status: 403 });

    const config = await SystemConfig.findOne() || new SystemConfig();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const visitor_code = `${config.visitorCodePrefix}-${dateStr}-${randomStr}`;

    const visitor = new Visitor({
      ...data,
      visitor_code,
      status: 'PENDING'
    });
    await visitor.save();

    await new Log({ visitor_id: visitor._id, event: 'REGISTERED', actor: 'SYSTEM' }).save();

    return NextResponse.json({ message: 'Success', visitorId: visitor._id, visitor_code });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
