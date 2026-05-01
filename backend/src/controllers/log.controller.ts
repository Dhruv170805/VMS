import { Request, Response } from 'express';
import Log from '../models/Log';

export const getLogs = async (req: Request, res: Response) => {
  try {
    const logs = await Log.find()
      .populate('visitor_id')
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
