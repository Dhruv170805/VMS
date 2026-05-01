import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import Employee from './models/Employee';

dotenv.config();

const seed = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected.');

    // Clear existing (optional - commented out for safety)
    // await User.deleteMany({});
    // await Employee.deleteMany({});

    const users = [
      {
        name: 'System Administrator',
        email: 'admin@vms.com',
        password: 'Admin@123',
        role: 'ADMIN'
      },
      {
        name: 'Chief Security Guard',
        email: 'guard@vms.com',
        password: 'Guard@123',
        role: 'GUARD'
      },
      {
        name: 'Host Employee',
        email: 'host@vms.com',
        password: 'Host@123',
        role: 'EMPLOYEE'
      }
    ];

    console.log('Seeding users...');
    for (const u of users) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await new User(u).save();
        console.log(`Created user: ${u.email}`);
      } else {
        console.log(`User already exists: ${u.email}`);
      }
    }

    console.log('Seeding employees...');
    const hostEmployee = {
      name: 'Host Employee',
      email: 'host@vms.com',
      department: 'Engineering',
      phone: '1234567890',
      isActive: true
    };

    const empExists = await Employee.findOne({ email: hostEmployee.email });
    if (!empExists) {
      await new Employee(hostEmployee).save();
      console.log(`Created employee: ${hostEmployee.email}`);
    } else {
      console.log(`Employee already exists: ${hostEmployee.email}`);
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
