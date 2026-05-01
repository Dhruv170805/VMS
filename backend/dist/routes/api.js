"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const visitor_controller_1 = require("../controllers/visitor.controller");
const gate_controller_1 = require("../controllers/gate.controller");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const employee_controller_1 = require("../controllers/employee.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const log_controller_1 = require("../controllers/log.controller");
const blacklist_controller_1 = require("../controllers/blacklist.controller");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Auth Routes
router.post('/auth/login', auth_controller_1.login);
router.post('/auth/register', auth_controller_1.register); // Helper
// Visitor Routes
router.post('/visitor/register', visitor_controller_1.registerVisitor);
router.get('/visitor/pending', visitor_controller_1.getPendingVisitors);
router.get('/visitor/host/:hostId', getHostVisitors);
router.get('/visitor/profile', getVisitorProfile);
router.get('/visitor/track/:code', getVisitorByCode);
router.post('/visitor/:id/approve', visitor_controller_1.approveVisitor);
router.patch('/visitor/:id/status', visitor_controller_1.updateVisitorStatus);
router.get('/visitor/active', dashboard_controller_1.getDetailedStats);
// Gate Routes
router.post('/gate/checkin', gate_controller_1.checkIn);
router.post('/gate/checkout', gate_controller_1.checkOut);
// Dashboard Routes
router.get('/dashboard/stats', dashboard_controller_1.getStats);
router.get('/dashboard/stats/detailed', dashboard_controller_1.getDetailedStats);
router.get('/logs', log_controller_1.getLogs);
// Blacklist Routes
router.get('/blacklist', blacklist_controller_1.getBlacklist);
router.post('/blacklist', blacklist_controller_1.addToBlacklist);
router.delete('/blacklist/:id', blacklist_controller_1.removeFromBlacklist);
// Employee Routes
router.get('/employees', employee_controller_1.getEmployees);
router.post('/employees/upload', upload.single('file'), employee_controller_1.uploadEmployees);
router.patch('/employees/:id/toggle', employee_controller_1.toggleEmployeeStatus);
exports.default = router;
//# sourceMappingURL=api.js.map