import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Visitor from '@/lib/models/Visitor';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');

    if (!name || !phone) return NextResponse.json({ error: 'Name and Phone required' }, { status: 400 });

    const visitor = await Visitor.findOne({ name, phone }).sort({ created_at: -1 });

    if (!visitor) return NextResponse.json(null);

    return NextResponse.json({
      name: visitor.name,
      phone: visitor.phone,
      email: visitor.email,
      company: visitor.company,
      photo_base64: visitor.photo_base64,
      id_photo_base64: visitor.id_photo_base64,
      id_type: visitor.id_type,
      id_number: visitor.id_number
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
