import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/lib/models/Employee';

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get('activeOnly');
  
  const filter = {};
  if (activeOnly === 'true') filter.isActive = true;

  const employees = await Employee.find(filter).sort({ name: 1 });
  return NextResponse.json(employees);
}
