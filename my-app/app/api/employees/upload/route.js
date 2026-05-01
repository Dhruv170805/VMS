import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/lib/models/Employee';
import * as xlsx from 'xlsx';

export async function POST(req) {
  try {
    await connectDB();
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: 'Empty Excel file' }, { status: 400 });
    }
    
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Map and validate data
    const employees = data.map((row) => ({
      name: row.Name || row.name,
      department: row.Department || row.department,
      email: row.Email || row.email,
      phone: row.Phone || row.phone,
      isActive: true
    }));

    // For simplicity, we clear and re-upload or upsert
    const ops = employees.map(emp => ({
      updateOne: {
        filter: { email: emp.email },
        update: { $set: emp },
        upsert: true
      }
    }));

    await Employee.bulkWrite(ops);

    return NextResponse.json({ message: 'Employees uploaded successfully', count: employees.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
