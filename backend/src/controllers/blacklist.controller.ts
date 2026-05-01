import { Request, Response } from 'express';
import Blacklist from '../models/Blacklist';

export const addToBlacklist = async (req: Request, res: Response) => {
  try {
    const { value, type, reason } = req.body;
    const entry = new Blacklist({ value, type, reason });
    await entry.save();
    res.status(201).json(entry);
  } catch (error: any) {
    res.status(400).json({ error: 'Already blacklisted or invalid data' });
  }
};

export const getBlacklist = async (req: Request, res: Response) => {
  try {
    const list = await Blacklist.find().sort({ created_at: -1 });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const removeFromBlacklist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Blacklist.findByIdAndDelete(id);
    res.json({ message: 'Removed from blacklist' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
