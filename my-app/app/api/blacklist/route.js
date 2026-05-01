import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blacklist from '@/lib/models/Blacklist';

export async function GET() {
  try {
    await connectDB();
    const list = await Blacklist.find().sort({ created_at: -1 });
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { value, type, reason } = await req.json();
    const entry = new Blacklist({ value, type, reason });
    await entry.save();
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Already blacklisted or invalid data' }, { status: 400 });
  }
}
