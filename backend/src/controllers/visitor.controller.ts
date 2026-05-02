import { Request, Response } from 'express';
import Visitor from '../models/Visitor';
import Log from '../models/Log';
import Blacklist from '../models/Blacklist';
import { VisitorRegistrationSchema, VisitorApprovalSchema } from '../validation/visitor.schema';
import jwt from 'jsonwebtoken';

import SystemConfig from '../models/SystemConfig';

export const registerVisitor = async (req: Request, res: Response) => {
  try {
    console.log(`📝 Registering new visitor: ${req.body.name} (${req.body.phone})`);
    const validatedData = VisitorRegistrationSchema.parse(req.body);
    
    // Fetch System Config
    const config = await SystemConfig.findOne() || new SystemConfig();
    
    // Check Blacklist
    const isBlacklisted = await Blacklist.findOne({
      $or: [
        { value: validatedData.email, type: 'EMAIL' },
        { value: validatedData.phone, type: 'PHONE' }
      ]
    });

    if (isBlacklisted) {
      console.warn(`🚫 Blacklisted visitor attempted registration: ${validatedData.name}`);
      return res.status(403).json({ error: 'Access Denied: Your details are blacklisted.' });
    }

    // Generate unique visitor code: PREFIX-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const visitor_code = `${config.visitorCodePrefix}-${dateStr}-${randomStr}`;

    // Normalize validity dates to full day boundaries
    const fromDate = new Date(validatedData.validity.from);
    fromDate.setHours(0, 0, 0, 0);
    
    const toDate = new Date(validatedData.validity.to);
    toDate.setHours(23, 59, 59, 999);

    const visitor = new Visitor({
      ...validatedData,
      visitor_code,
      validity: {
        from: fromDate,
        to: toDate
      },
      status: 'PENDING'
    });

    await visitor.save();
    console.log(`✅ Visitor registered successfully: ${visitor_code}`);

    await new Log({
      visitor_id: visitor._id,
      event: 'REGISTERED',
      actor: 'SYSTEM'
    }).save();

    res.status(201).json({ message: 'Visitor registered successfully', visitorId: visitor._id, visitor_code });
  } catch (error: any) {
    console.error(`❌ Registration Error: ${error.message}`);
    const errorMessage = error.errors ? error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') : error.message;
    res.status(400).json({ error: errorMessage });
  }
};

export const getHostVisitors = async (req: Request, res: Response) => {
  try {
    const { hostId } = req.params;
    const { status } = req.query;
    
    const filter: any = { host_id: hostId };
    if (status) {
      filter.status = status;
    }

    const priorityOrder: any = { VIP: 1, NORMAL: 2, LOW: 3 };

    const visitors = await Visitor.find(filter)
      .populate('host_id')
      .sort({ created_at: -1 });
    
    // Custom sort: Priority first, then Visit Time
    visitors.sort((a: any, b: any) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(a.visit_time).getTime() - new Date(b.visit_time).getTime();
    });
      
    res.json(visitors);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPendingVisitors = async (req: Request, res: Response) => {
  try {
    const visitors = await Visitor.find({ status: 'PENDING' })
      .populate('host_id')
      .sort({ created_at: -1 });
    res.json(visitors);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const approveVisitor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = VisitorApprovalSchema.parse(req.body);
    const user = (req as any).user;
    
    const visitor = await Visitor.findById(id).populate('host_id');
    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });

    if (status === 'REJECTED') {
      visitor.status = 'REJECTED';
    } else if (status === 'APPROVED') {
      const actorRole = user.role;
      const currentLevel = visitor.approval_level;

      if (!visitor.approved_by.includes(`${user.name} (${actorRole})`)) {
        visitor.approved_by.push(`${user.name} (${actorRole})`);
      }

      if (actorRole === 'EMPLOYEE' && currentLevel === 'EMPLOYEE') {
        visitor.approval_level = 'MANAGER';
      } else if (actorRole === 'MANAGER' || (actorRole === 'EMPLOYEE' && currentLevel === 'MANAGER')) {
        visitor.approval_level = 'ADMIN';
      } else if (actorRole === 'ADMIN' || currentLevel === 'ADMIN') {
        visitor.status = 'APPROVED';
        visitor.visit_timestamps.approved_at = new Date();
      } else {
        visitor.status = 'APPROVED';
        visitor.visit_timestamps.approved_at = new Date();
      }
    }

    await visitor.save();

    await new Log({
      visitor_id: visitor._id,
      event: visitor.status === 'APPROVED' ? 'APPROVED' : (status === 'REJECTED' ? 'REJECTED' : `ESCALATED_TO_${visitor.approval_level}`),
      actor: user.name,
      meta: { role: user.role, level: visitor.approval_level }
    }).save();

    let qrCode = null;
    if (visitor.status === 'APPROVED') {
      const expiresIn = Math.floor((visitor.validity.to.getTime() - Date.now()) / 1000);
      if (expiresIn > 0) {
        qrCode = jwt.sign(
          { visitorId: visitor._id },
          process.env.JWT_SECRET as string,
          { expiresIn }
        );
      }
    }

    res.json({ 
      message: visitor.status === 'APPROVED' ? 'Visitor approved successfully' : `Visitor escalated to ${visitor.approval_level}`, 
      visitor, 
      qrCode 
    });
  } catch (error: any) {
    const errorMessage = error.errors ? error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') : error.message;
    res.status(400).json({ error: errorMessage });
  }
};

export const getVisitorProfile = async (req: Request, res: Response) => {
  try {
    const name = req.query.name as string;
    const phone = req.query.phone as string;
    if (!name || !phone) return res.status(400).json({ error: 'Name and Phone required' });

    // Find the most recent record for this visitor (Case-Insensitive Regex Search)
    const visitor = await Visitor.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }, 
      phone 
    }).sort({ created_at: -1 });

    if (!visitor) return res.json(null);

    // Return the reusable identity fields
    res.json({
      name: visitor.name,
      phone: visitor.phone,
      email: visitor.email,
      company: visitor.company,
      photo_base64: visitor.photo_base64,
      id_photo_base64: visitor.id_photo_base64,
      id_type: visitor.id_type,
      id_number: visitor.id_number
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getVisitorByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const visitor = await Visitor.findOne({ visitor_code: code }).populate('host_id');
    
    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });

    let token = null;
    // Allow token retrieval if visitor is approved or already inside
    if (['APPROVED', 'GATE_IN', 'MEET_IN', 'MEET_OVER'].includes(visitor.status)) {
      const expiresIn = Math.floor((visitor.validity.to.getTime() - Date.now()) / 1000);
      if (expiresIn > 0) {
        token = jwt.sign(
          { visitorId: visitor._id },
          process.env.JWT_SECRET as string,
          { expiresIn }
        );
      }
    }

    res.json({ visitor, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateVisitorStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // e.g., MEET_IN, MEET_OVER

    const timestampField = status.toLowerCase() + '_at';
    const updateData: any = { status };
    updateData[`visit_timestamps.${timestampField}`] = new Date();

    const visitor = await Visitor.findByIdAndUpdate(id, updateData, { new: true });
    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });

    await new Log({
      visitor_id: visitor._id,
      event: status,
      actor: 'HOST'
    }).save();

    res.json({ message: `Status updated to ${status}`, visitor });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getVisitorTimeline = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const logs = await Log.find({ visitor_id: id }).sort({ timestamp: 1 });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
