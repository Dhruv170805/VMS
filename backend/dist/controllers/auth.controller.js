"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.login = void 0;
const User_1 = __importDefault(require("../models/User"));
const Employee_1 = __importDefault(require("../models/Employee"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const employee = await Employee_1.default.findOne({ email });
        const employeeId = employee ? employee._id : null;
        res.json({ token, role: user.role, name: user.name, userId: user._id, employeeId });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.login = login;
// Helper for initial setup (remove in production)
const register = async (req, res) => {
    try {
        const { name, email, password, role, setupKey } = req.body;
        // Bug 15 Fix: Protect public registration with a simple key check
        if (setupKey !== process.env.SETUP_KEY && process.env.NODE_ENV === 'production') {
            return res.status(403).json({ error: 'Forbidden: Registration is restricted' });
        }
        const user = new User_1.default({ name, email, password, role });
        await user.save();
        res.status(201).json({ message: 'User created' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.register = register;
//# sourceMappingURL=auth.controller.js.map