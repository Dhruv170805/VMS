"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDetailedStats = exports.getStats = void 0;
const Visitor_1 = __importDefault(require("../models/Visitor"));
const getStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const visitors = await Visitor_1.default.find({ created_at: { $gte: today } });
        const formattedStats = {
            PENDING: 0, APPROVED: 0, GATE_IN: 0, MEET_IN: 0, MEET_OVER: 0, GATE_OUT: 0, REJECTED: 0, TOTAL: 0
        };
        // Calculate hourly trend
        const hourlyCounts = {};
        for (let i = 8; i <= 18; i += 2) {
            hourlyCounts[i] = 0; // Initialize hours 8, 10, 12, 14, 16, 18
        }
        visitors.forEach((visitor) => {
            // Status counts
            if (visitor.status in formattedStats) {
                formattedStats[visitor.status]++;
                formattedStats.TOTAL++;
            }
            // Trend calculation
            const hour = visitor.created_at.getHours();
            // Round down to nearest even hour for grouping (8, 10, 12...)
            let roundedHour = Math.floor(hour / 2) * 2;
            if (roundedHour >= 8 && roundedHour <= 18) {
                hourlyCounts[roundedHour]++;
            }
        });
        const trendData = Object.keys(hourlyCounts).map(hourStr => {
            const hour = parseInt(hourStr);
            const label = hour === 12 ? '12PM' : hour > 12 ? `${hour - 12}PM` : `${hour}AM`;
            return { hour: label, count: hourlyCounts[hour] };
        });
        res.json({ ...formattedStats, trendData });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getStats = getStats;
const getDetailedStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const visitors = await Visitor_1.default.find({
            created_at: { $gte: today }
        }).populate('host_id').sort({ created_at: -1 });
        res.json(visitors);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getDetailedStats = getDetailedStats;
//# sourceMappingURL=dashboard.controller.js.map