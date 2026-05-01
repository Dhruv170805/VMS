import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blacklist from '@/lib/models/Blacklist';

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    await Blacklist.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Removed from blacklist' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
