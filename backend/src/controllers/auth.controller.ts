import { Request, Response } from 'express';
import User from '../models/User';
import Employee from '../models/Employee';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    const employee = await Employee.findOne({ email });
    const employeeId = employee ? employee._id : null;

    res.json({ token, role: user.role, name: user.name, userId: user._id, employeeId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Helper for initial setup (remove in production)
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, setupKey } = req.body;
    
    // Bug 15 Fix: Protect public registration with a simple key check
    if (setupKey !== process.env.SETUP_KEY && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Forbidden: Registration is restricted' });
    }

    const user = new User({ name, email, password, role });
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
