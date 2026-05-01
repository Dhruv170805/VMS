"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOut = exports.checkIn = void 0;
const Visitor_1 = __importDefault(require("../models/Visitor"));
const Log_1 = __importDefault(require("../models/Log"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const checkIn = async (req, res) => {
    try {
        const { token, visitorCode } = req.body;
        let visitor;
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'vms_secret');
            visitor = await Visitor_1.default.findById(decoded.visitorId);
        }
        else if (visitorCode) {
            visitor = await Visitor_1.default.findOne({ visitor_code: visitorCode });
        }
        if (!visitor)
            return res.status(404).json({ error: 'Visitor not found' });
        if (visitor.status !== 'APPROVED')
            return res.status(400).json({ error: 'Visitor not approved or already at gate' });
        visitor.status = 'GATE_IN';
        visitor.timestamps.gate_in_at = new Date();
        await visitor.save();
        await new Log_1.default({
            visitor_id: visitor._id,
            event: 'GATE_IN',
            actor: 'GUARD'
        }).save();
        res.json({ message: 'Gate entry marked successful', visitor });
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid or expired credentials' });
    }
};
exports.checkIn = checkIn;
const checkOut = async (req, res) => {
    try {
        const { token, visitorCode } = req.body;
        let visitor;
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'vms_secret');
            visitor = await Visitor_1.default.findById(decoded.visitorId);
        }
        else if (visitorCode) {
            visitor = await Visitor_1.default.findOne({ visitor_code: visitorCode });
        }
        if (!visitor)
            return res.status(404).json({ error: 'Visitor not found' });
        if (visitor.status !== 'MEET_OVER')
            return res.status(400).json({ error: 'Meeting not marked over yet' });
        visitor.status = 'GATE_OUT';
        visitor.timestamps.gate_out_at = new Date();
        await visitor.save();
        await new Log_1.default({
            visitor_id: visitor._id,
            event: 'GATE_OUT',
            actor: 'GUARD'
        }).save();
        res.json({ message: 'Gate exit marked successful', visitor });
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid or expired credentials' });
    }
};
exports.checkOut = checkOut;
//# sourceMappingURL=gate.controller.js.map