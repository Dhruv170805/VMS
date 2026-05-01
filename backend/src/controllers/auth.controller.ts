import { Request, Response } from 'express';
import User from '../models/User';
import Employee from '../models/Employee';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    const employee = await Employee.findOne({ email: email.toLowerCase() });
    const employeeId = employee ? employee._id : null;

    res.json({ token, role: user.role, name: user.name, userId: user._id, employeeId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, setupKey } = req.body;

    // SECURITY: Mandatory setupKey check for all environments to prevent brute-force
    if (setupKey !== process.env.SETUP_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid setup key. Administrative registration restricted.' });
    }

    const user = new User({ name, email: email.toLowerCase(), password, role });
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const setup = async (req: Request, res: Response) => {
  try {
    const { setupKey } = req.body;

    if (setupKey !== process.env.SETUP_KEY) {
      return res.status(401).json({ error: 'Invalid Setup Key' });
    }

    const initialPassword = process.env.INITIAL_PASSWORD || 'Vms@12345';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@vms.com';
    const guardEmail = process.env.GUARD_EMAIL || 'guard@vms.com';
    const hostEmail = process.env.HOST_EMAIL || 'host@vms.com';

    let hostEmployee = await Employee.findOne({ email: hostEmail });
    if (!hostEmployee) {
      hostEmployee = new Employee({
        name: 'Initial Host',
        email: hostEmail,
        phone: '0000000000',
        department: 'Management',
        designation: 'Staff'
      });
      await hostEmployee.save();
    }

    const users = [
      { name: 'Admin User', email: adminEmail, role: 'ADMIN' },
      { name: 'Gate Guard', email: guardEmail, role: 'GUARD' },
      { name: 'Staff Host', email: hostEmail, role: 'EMPLOYEE', employeeId: hostEmployee._id }
    ];

    for (const u of users) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await new User({ ...u, password: initialPassword }).save();
      } else {
        exists.password = initialPassword;
        exists.role = u.role as 'ADMIN' | 'GUARD' | 'EMPLOYEE';
        await exists.save();
      }
    }

    res.json({ message: `System seeded successfully. Default password for all: ${initialPassword}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
