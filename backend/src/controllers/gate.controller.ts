import { Request, Response } from 'express';
import Visitor from '../models/Visitor';
import Log from '../models/Log';
import jwt from 'jsonwebtoken';

export const checkIn = async (req: Request, res: Response) => {
  try {
    const { token, visitorCode, bypassKey } = req.body;
    let visitor;

    if (token) {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      visitor = await Visitor.findById(decoded.visitorId);
    } else if (visitorCode) {
      // SECURITY: Allow manual code entry if the actor is an authenticated GUARD/ADMIN
      // Otherwise, require a bypass key (Guard override via API)
      const isAuthorizedActor = req.user && (req.user.role === 'GUARD' || req.user.role === 'ADMIN');
      if (!isAuthorizedActor && bypassKey !== process.env.GUARD_BYPASS_KEY) {
        return res.status(403).json({ error: 'Security Violation: Manual entry restricted to authorized personnel.' });
      }
      visitor = await Visitor.findOne({ visitor_code: visitorCode });
    }

    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
    
    // Status validation: Can only check in if APPROVED
    if (visitor.status !== 'APPROVED') {
      return res.status(400).json({ error: `Invalid Status: Visitor is currently ${visitor.status}.` });
    }

    visitor.status = 'GATE_IN';
    visitor.visit_timestamps.gate_in_at = new Date();
    await visitor.save();

    await new Log({
      visitor_id: visitor._id,
      event: 'GATE_IN',
      actor: 'GUARD'
    }).save();

    res.json({ message: 'Gate entry marked successful', visitor });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid or expired security token' });
  }
};

export const checkOut = async (req: Request, res: Response) => {
  try {
    const { token, visitorCode } = req.body; 
    let visitor;

    if (token) {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      visitor = await Visitor.findById(decoded.visitorId);
    } else if (visitorCode) {
      const { bypassKey } = req.body;
      const isAuthorizedActor = req.user && (req.user.role === 'GUARD' || req.user.role === 'ADMIN');
      if (!isAuthorizedActor && bypassKey !== process.env.GUARD_BYPASS_KEY) {
        return res.status(403).json({ error: 'Security Violation: Manual exit restricted to authorized personnel.' });
      }
      visitor = await Visitor.findOne({ visitor_code: visitorCode });
    }

    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
    
    // LOGIC: Allow checkout from any active status
    const activeStatuses = ['APPROVED', 'GATE_IN', 'MEET_IN', 'MEET_OVER'];
    if (!activeStatuses.includes(visitor.status)) {
      return res.status(400).json({ error: 'Visitor is not currently inside or approved.' });
    }

    visitor.status = 'GATE_OUT';
    visitor.visit_timestamps.gate_out_at = new Date();
    await visitor.save();

    await new Log({
      visitor_id: visitor._id,
      event: 'GATE_OUT',
      actor: 'GUARD'
    }).save();

    res.json({ message: 'Gate exit marked successful', visitor });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid or expired security token' });
  }
};
