"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVisitorTimeline = exports.updateVisitorStatus = exports.getVisitorByCode = exports.getVisitorProfile = exports.approveVisitor = exports.getPendingVisitors = exports.getHostVisitors = exports.registerVisitor = void 0;
const Visitor_1 = __importDefault(require("../models/Visitor"));
const Log_1 = __importDefault(require("../models/Log"));
const Blacklist_1 = __importDefault(require("../models/Blacklist"));
const visitor_schema_1 = require("../validation/visitor.schema");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SystemConfig_1 = __importDefault(require("../models/SystemConfig"));
const registerVisitor = async (req, res) => {
    try {
        console.log(`📝 Registering new visitor: ${req.body.name} (${req.body.phone})`);
        const validatedData = visitor_schema_1.VisitorRegistrationSchema.parse(req.body);
        // Fetch System Config
        const config = await SystemConfig_1.default.findOne() || new SystemConfig_1.default();
        // Check Blacklist
        const isBlacklisted = await Blacklist_1.default.findOne({
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
        const visitor = new Visitor_1.default({
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
        await new Log_1.default({
            visitor_id: visitor._id,
            event: 'REGISTERED',
            actor: 'SYSTEM'
        }).save();
        res.status(201).json({ message: 'Visitor registered successfully', visitorId: visitor._id, visitor_code });
    }
    catch (error) {
        console.error(`❌ Registration Error: ${error.message}`);
        const errorMessage = error.errors ? error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ') : error.message;
        res.status(400).json({ error: errorMessage });
    }
};
exports.registerVisitor = registerVisitor;
const getHostVisitors = async (req, res) => {
    try {
        const { hostId } = req.params;
        const { status } = req.query;
        const filter = { host_id: hostId };
        if (status) {
            filter.status = status;
        }
        const priorityOrder = { VIP: 1, NORMAL: 2, LOW: 3 };
        const visitors = await Visitor_1.default.find(filter)
            .populate('host_id')
            .sort({ created_at: -1 });
        // Custom sort: Priority first, then Visit Time
        visitors.sort((a, b) => {
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(a.visit_time).getTime() - new Date(b.visit_time).getTime();
        });
        res.json(visitors);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getHostVisitors = getHostVisitors;
const getPendingVisitors = async (req, res) => {
    try {
        const visitors = await Visitor_1.default.find({ status: 'PENDING' })
            .populate('host_id')
            .sort({ created_at: -1 });
        res.json(visitors);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getPendingVisitors = getPendingVisitors;
const approveVisitor = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = visitor_schema_1.VisitorApprovalSchema.parse(req.body);
        const user = req.user;
        const visitor = await Visitor_1.default.findById(id).populate('host_id');
        if (!visitor)
            return res.status(404).json({ error: 'Visitor not found' });
        if (status === 'REJECTED') {
            visitor.status = 'REJECTED';
        }
        else if (status === 'APPROVED') {
            const actorRole = user.role;
            const currentLevel = visitor.approval_level;
            if (!visitor.approved_by.includes(`${user.name} (${actorRole})`)) {
                visitor.approved_by.push(`${user.name} (${actorRole})`);
            }
            if (actorRole === 'EMPLOYEE' && currentLevel === 'EMPLOYEE') {
                visitor.approval_level = 'MANAGER';
            }
            else if (actorRole === 'MANAGER' || (actorRole === 'EMPLOYEE' && currentLevel === 'MANAGER')) {
                visitor.approval_level = 'ADMIN';
            }
            else if (actorRole === 'ADMIN' || currentLevel === 'ADMIN') {
                visitor.status = 'APPROVED';
                visitor.visit_timestamps.approved_at = new Date();
            }
            else {
                visitor.status = 'APPROVED';
                visitor.visit_timestamps.approved_at = new Date();
            }
        }
        await visitor.save();
        await new Log_1.default({
            visitor_id: visitor._id,
            event: visitor.status === 'APPROVED' ? 'APPROVED' : (status === 'REJECTED' ? 'REJECTED' : `ESCALATED_TO_${visitor.approval_level}`),
            actor: user.name,
            meta: { role: user.role, level: visitor.approval_level }
        }).save();
        let qrCode = null;
        if (visitor.status === 'APPROVED') {
            const expiresIn = Math.floor((visitor.validity.to.getTime() - Date.now()) / 1000);
            if (expiresIn > 0) {
                qrCode = jsonwebtoken_1.default.sign({ visitorId: visitor._id }, process.env.JWT_SECRET, { expiresIn });
            }
        }
        res.json({
            message: visitor.status === 'APPROVED' ? 'Visitor approved successfully' : `Visitor escalated to ${visitor.approval_level}`,
            visitor,
            qrCode
        });
    }
    catch (error) {
        const errorMessage = error.errors ? error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ') : error.message;
        res.status(400).json({ error: errorMessage });
    }
};
exports.approveVisitor = approveVisitor;
const getVisitorProfile = async (req, res) => {
    try {
        const name = req.query.name;
        const phone = req.query.phone;
        if (!name || !phone)
            return res.status(400).json({ error: 'Name and Phone required' });
        // Find the most recent record for this visitor (Case-Insensitive Regex Search)
        const visitor = await Visitor_1.default.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            phone
        }).sort({ created_at: -1 });
        if (!visitor)
            return res.json(null);
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getVisitorProfile = getVisitorProfile;
const getVisitorByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const visitor = await Visitor_1.default.findOne({ visitor_code: code }).populate('host_id');
        if (!visitor)
            return res.status(404).json({ error: 'Visitor not found' });
        let token = null;
        // Allow token retrieval if visitor is approved or already inside
        if (['APPROVED', 'GATE_IN', 'MEET_IN', 'MEET_OVER'].includes(visitor.status)) {
            const expiresIn = Math.floor((visitor.validity.to.getTime() - Date.now()) / 1000);
            if (expiresIn > 0) {
                token = jsonwebtoken_1.default.sign({ visitorId: visitor._id }, process.env.JWT_SECRET, { expiresIn });
            }
        }
        res.json({ visitor, token });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getVisitorByCode = getVisitorByCode;
const updateVisitorStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // e.g., MEET_IN, MEET_OVER
        const timestampField = status.toLowerCase() + '_at';
        const updateData = { status };
        updateData[`visit_timestamps.${timestampField}`] = new Date();
        const visitor = await Visitor_1.default.findByIdAndUpdate(id, updateData, { new: true });
        if (!visitor)
            return res.status(404).json({ error: 'Visitor not found' });
        await new Log_1.default({
            visitor_id: visitor._id,
            event: status,
            actor: 'HOST'
        }).save();
        res.json({ message: `Status updated to ${status}`, visitor });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateVisitorStatus = updateVisitorStatus;
const getVisitorTimeline = async (req, res) => {
    try {
        const { id } = req.params;
        const logs = await Log_1.default.find({ visitor_id: id }).sort({ timestamp: 1 });
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getVisitorTimeline = getVisitorTimeline;
//# sourceMappingURL=visitor.controller.js.map