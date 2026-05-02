"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOut = exports.checkIn = void 0;
const Visitor_1 = __importDefault(require("../models/Visitor"));
const Log_1 = __importDefault(require("../models/Log"));
const Blacklist_1 = __importDefault(require("../models/Blacklist"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const checkIn = async (req, res) => {
    try {
        const { token, visitorCode, bypassKey, gateId } = req.body;
        const io = req.app.get('io');
        const actor = req.user?.name || 'GUARD';
        let visitor;
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            visitor = await Visitor_1.default.findById(decoded.visitorId);
        }
        else if (visitorCode) {
            const isAuthorizedActor = req.user && (req.user.role === 'GUARD' || req.user.role === 'ADMIN');
            if (!isAuthorizedActor && bypassKey !== process.env.GUARD_BYPASS_KEY) {
                return res.status(403).json({ error: 'Security Violation: Manual entry restricted to authorized personnel.' });
            }
            visitor = await Visitor_1.default.findOne({ visitor_code: visitorCode });
        }
        if (!visitor)
            return res.status(404).json({ error: 'Visitor not found' });
        // 🔴 Blacklist Check
        const isBlacklisted = await Blacklist_1.default.findOne({
            $or: [
                { value: visitor.email, type: 'EMAIL' },
                { value: visitor.phone, type: 'PHONE' }
            ]
        });
        if (isBlacklisted) {
            await new Log_1.default({
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
        await new Log_1.default({
            visitor_id: visitor._id,
            event: 'GATE_IN',
            actor,
            gate_id: gateId
        }).save();
        // 🔵 Broadcast to ALL gates + admin dashboards
        io.emit('gate:checkin', { visitorId: visitor._id, gateId, visitorName: visitor.name });
        res.json({ message: 'Gate entry marked successful', visitor });
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid or expired security token' });
    }
};
exports.checkIn = checkIn;
const checkOut = async (req, res) => {
    try {
        const { token, visitorCode, bypassKey, gateId } = req.body;
        const io = req.app.get('io');
        const actor = req.user?.name || 'GUARD';
        let visitor;
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            visitor = await Visitor_1.default.findById(decoded.visitorId);
        }
        else if (visitorCode) {
            const isAuthorizedPersonnel = req.user && (req.user.role === 'GUARD' || req.user.role === 'ADMIN');
            if (!isAuthorizedPersonnel && bypassKey !== process.env.GUARD_BYPASS_KEY) {
                return res.status(403).json({ error: 'Security Violation: Guard authorization required for exit.' });
            }
            visitor = await Visitor_1.default.findOne({ visitor_code: visitorCode });
        }
        if (!visitor)
            return res.status(404).json({ error: 'Visitor not found' });
        // LOGIC: Allow checkout from any active status
        const activeStatuses = ['APPROVED', 'GATE_IN', 'MEET_IN', 'MEET_OVER'];
        if (!activeStatuses.includes(visitor.status)) {
            return res.status(400).json({ error: 'Visitor is not currently inside or approved.' });
        }
        visitor.status = 'GATE_OUT';
        visitor.visit_timestamps.gate_out_at = new Date();
        await visitor.save();
        await new Log_1.default({
            visitor_id: visitor._id,
            event: 'GATE_OUT',
            actor,
            gate_id: gateId
        }).save();
        // 🔵 Broadcast
        io.emit('gate:checkout', { visitorId: visitor._id, gateId, visitorName: visitor.name });
        res.json({ message: 'Gate exit marked successful', visitor });
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid or expired security token' });
    }
};
exports.checkOut = checkOut;
//# sourceMappingURL=gate.controller.js.map