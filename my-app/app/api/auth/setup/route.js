import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Employee from '@/lib/models/Employee';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    await connectDB();
    const { setupKey } = await req.json();

    if (setupKey !== process.env.SETUP_KEY) {
      return NextResponse.json({ error: 'Invalid Setup Key' }, { status: 401 });
    }

    // Create a dummy Host Employee first
    let hostEmployee = await Employee.findOne({ email: 'host@vms.com' });
    if (!hostEmployee) {
      hostEmployee = new Employee({
        name: 'John Host',
        email: 'host@vms.com',
        phone: '9876543210',
        department: 'IT',
        designation: 'Manager'
      });
      await hostEmployee.save();
    }

    const passwordHash = await bcrypt.hash('Vms@12345', 10);

    const users = [
      { name: 'Admin User', email: 'admin@vms.com', role: 'ADMIN' },
      { name: 'Gate Guard', email: 'guard@vms.com', role: 'GUARD' },
      { name: 'Staff Host', email: 'host@vms.com', role: 'EMPLOYEE', employeeId: hostEmployee._id }
    ];

    for (const u of users) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await new User({ ...u, password: passwordHash }).save();
      }
    }

    return NextResponse.json({ message: 'System seeded successfully. Default password for all: Vms@12345' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
