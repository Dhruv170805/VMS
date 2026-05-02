"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setup = exports.register = exports.login = void 0;
const User_1 = __importDefault(require("../models/User"));
const Employee_1 = __importDefault(require("../models/Employee"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email: email.toLowerCase() });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const employee = await Employee_1.default.findOne({ email: email.toLowerCase() });
        const employeeId = employee ? employee._id : null;
        res.json({ token, role: user.role, name: user.name, userId: user._id, employeeId });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const { name, email, password, role, setupKey } = req.body;
        // SECURITY: Mandatory setupKey check for all environments to prevent brute-force
        if (setupKey !== process.env.SETUP_KEY) {
            return res.status(403).json({ error: 'Forbidden: Invalid setup key. Administrative registration restricted.' });
        }
        const user = new User_1.default({ name, email: email.toLowerCase(), password, role });
        await user.save();
        res.status(201).json({ message: 'User created' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.register = register;
const setup = async (req, res) => {
    try {
        const { setupKey } = req.body;
        if (setupKey !== process.env.SETUP_KEY) {
            return res.status(401).json({ error: 'Invalid Setup Key' });
        }
        const initialPassword = process.env.INITIAL_PASSWORD || 'Vms@12345';
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@vms.com';
        const guardEmail = process.env.GUARD_EMAIL || 'guard@vms.com';
        const hostEmail = process.env.HOST_EMAIL || 'host@vms.com';
        let hostEmployee = await Employee_1.default.findOne({ email: hostEmail });
        if (!hostEmployee) {
            hostEmployee = new Employee_1.default({
                name: 'Initial Host',
                email: hostEmail,
                phone: '0000000000',
                department: 'Management',
                designation: 'Staff'
            });
            await hostEmployee.save();
        }
        const users = [
            { name: 'Admin User', email: adminEmail, role: 'ADMIN' },
            { name: 'Gate Guard', email: guardEmail, role: 'GUARD' },
            { name: 'Staff Host', email: hostEmail, role: 'EMPLOYEE', employeeId: hostEmployee._id }
        ];
        for (const u of users) {
            const exists = await User_1.default.findOne({ email: u.email });
            if (!exists) {
                await new User_1.default({ ...u, password: initialPassword }).save();
            }
            else {
                exists.password = initialPassword;
                exists.role = u.role;
                await exists.save();
            }
        }
        res.json({ message: `System seeded successfully. Default password for all: ${initialPassword}` });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.setup = setup;
//# sourceMappingURL=auth.controller.js.map