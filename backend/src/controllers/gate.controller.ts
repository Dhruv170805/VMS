import { Request, Response } from 'express';
import Visitor from '../models/Visitor';
import Log from '../models/Log';
import Blacklist from '../models/Blacklist';
import jwt from 'jsonwebtoken';

export const checkIn = async (req: Request, res: Response) => {
  try {
    const { token, visitorCode, bypassKey, gateId } = req.body;
    const io = req.app.get('io');
    const actor = req.user?.name || 'GUARD';
    let visitor;

    if (token) {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      visitor = await Visitor.findById(decoded.visitorId);
    } else if (visitorCode) {
      const isAuthorizedActor = req.user && (req.user.role === 'GUARD' || req.user.role === 'ADMIN');
      if (!isAuthorizedActor && bypassKey !== process.env.GUARD_BYPASS_KEY) {
        return res.status(403).json({ error: 'Security Violation: Manual entry restricted to authorized personnel.' });
      }
      visitor = await Visitor.findOne({ visitor_code: visitorCode });
    }

    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });

    // 🔴 Blacklist Check
    const isBlacklisted = await Blacklist.findOne({
      $or: [
        { value: visitor.email, type: 'EMAIL' },
        { value: visitor.phone, type: 'PHONE' }
      ]
    });

    if (isBlacklisted) {
      await new Log({
        visitor_id: visitor._id,
        event: 'DENIED_BLACKLIST',
        actor,
        gate_id: gateId,
        meta: { reason: isBlacklisted.reason || 'Safety Violation' }
      }).save();

      io.emit('gate:denied', { visitorId: visitor._id, reason: 'BLACKLISTED', gateId });
      return res.status(403).json({ error: 'Access Denied: Visitor is blacklisted.', reason: isBlacklisted.reason });
    }

    // 🟡 Idempotency: Already checked in
    if (visitor.status === 'GATE_IN' || visitor.status === 'MEET_IN') {
      return res.status(400).json({ error: 'Visitor is already inside.', visitor });
    }

    // Status validation
    if (visitor.status !== 'APPROVED') {
      return res.status(400).json({ error: `Invalid Status: Visitor is currently ${visitor.status}.` });
    }

    visitor.status = 'GATE_IN';
    visitor.visit_timestamps.gate_in_at = new Date();
    await visitor.save();

    await new Log({
      visitor_id: visitor._id,
      event: 'GATE_IN',
      actor,
      gate_id: gateId
    }).save();

    // 🔵 Broadcast to ALL gates + admin dashboards
    io.emit('gate:checkin', { visitorId: visitor._id, gateId, visitorName: visitor.name });

    res.json({ message: 'Gate entry marked successful', visitor });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid or expired security token' });
  }
};

export const checkOut = async (req: Request, res: Response) => {
  try {
    const { token, visitorCode, bypassKey, gateId } = req.body; 
    const io = req.app.get('io');
    const actor = req.user?.name || 'GUARD';
    let visitor;

    if (token) {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      visitor = await Visitor.findById(decoded.visitorId);
    } else if (visitorCode) {
      const isAuthorizedPersonnel = req.user && (req.user.role === 'GUARD' || req.user.role === 'ADMIN');
      if (!isAuthorizedPersonnel && bypassKey !== process.env.GUARD_BYPASS_KEY) {
        return res.status(403).json({ error: 'Security Violation: Guard authorization required for exit.' });
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
      actor,
      gate_id: gateId
    }).save();

    // 🔵 Broadcast
    io.emit('gate:checkout', { visitorId: visitor._id, gateId, visitorName: visitor.name });

    res.json({ message: 'Gate exit marked successful', visitor });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid or expired security token' });
  }
};
