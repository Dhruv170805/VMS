import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/lib/models/Employee';

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const employee = await Employee.findById(id);
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    
    employee.isActive = !employee.isActive;
    await employee.save();
    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
