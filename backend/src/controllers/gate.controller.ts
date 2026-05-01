import { Request, Response } from 'express';
import Visitor from '../models/Visitor';
import Log from '../models/Log';
import jwt from 'jsonwebtoken';

export const checkIn = async (req: Request, res: Response) => {
  try {
    const { token, visitorCode } = req.body;
    let visitor;

    if (token) {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'vms_secret');
      visitor = await Visitor.findById(decoded.visitorId);
    } else if (visitorCode) {
      visitor = await Visitor.findOne({ visitor_code: visitorCode });
    }

    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
    if (visitor.status !== 'APPROVED') return res.status(400).json({ error: 'Visitor not approved or already at gate' });

    visitor.status = 'GATE_IN';
    visitor.timestamps.gate_in_at = new Date();
    await visitor.save();

    await new Log({
      visitor_id: visitor._id,
      event: 'GATE_IN',
      actor: 'GUARD'
    }).save();

    res.json({ message: 'Gate entry marked successful', visitor });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid or expired credentials' });
  }
};

export const checkOut = async (req: Request, res: Response) => {
  try {
    const { token, visitorCode } = req.body; 
    let visitor;

    if (token) {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'vms_secret');
      visitor = await Visitor.findById(decoded.visitorId);
    } else if (visitorCode) {
      visitor = await Visitor.findOne({ visitor_code: visitorCode });
    }

    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
    if (visitor.status !== 'MEET_OVER') return res.status(400).json({ error: 'Meeting not marked over yet' });

    visitor.status = 'GATE_OUT';
    visitor.timestamps.gate_out_at = new Date();
    await visitor.save();

    await new Log({
      visitor_id: visitor._id,
      event: 'GATE_OUT',
      actor: 'GUARD'
    }).save();

    res.json({ message: 'Gate exit marked successful', visitor });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid or expired credentials' });
  }
};
