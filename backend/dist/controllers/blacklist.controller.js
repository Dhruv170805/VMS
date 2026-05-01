"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromBlacklist = exports.getBlacklist = exports.addToBlacklist = void 0;
const Blacklist_1 = __importDefault(require("../models/Blacklist"));
const addToBlacklist = async (req, res) => {
    try {
        const { value, type, reason } = req.body;
        const entry = new Blacklist_1.default({ value, type, reason });
        await entry.save();
        res.status(201).json(entry);
    }
    catch (error) {
        res.status(400).json({ error: 'Already blacklisted or invalid data' });
    }
};
exports.addToBlacklist = addToBlacklist;
const getBlacklist = async (req, res) => {
    try {
        const list = await Blacklist_1.default.find().sort({ created_at: -1 });
        res.json(list);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getBlacklist = getBlacklist;
const removeFromBlacklist = async (req, res) => {
    try {
        const { id } = req.params;
        await Blacklist_1.default.findByIdAndDelete(id);
        res.json({ message: 'Removed from blacklist' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.removeFromBlacklist = removeFromBlacklist;
//# sourceMappingURL=blacklist.controller.js.map