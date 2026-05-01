"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogs = void 0;
const Log_1 = __importDefault(require("../models/Log"));
const getLogs = async (req, res) => {
    try {
        const logs = await Log_1.default.find()
            .populate('visitor_id')
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getLogs = getLogs;
//# sourceMappingURL=log.controller.js.map