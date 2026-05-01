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
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Auth Routes
router.post('/auth/login', auth_controller_1.login);
router.post('/auth/register', auth_controller_1.register); // Now protected by setupKey internally
// Visitor Routes
router.post('/visitor/register', visitor_controller_1.registerVisitor); // Public
router.get('/visitor/pending', (0, auth_middleware_1.authMiddleware)(['ADMIN', 'GUARD']), visitor_controller_1.getPendingVisitors);
router.get('/visitor/profile', visitor_controller_1.getVisitorProfile); // Public for autocomplete
router.get('/visitor/active', (0, auth_middleware_1.authMiddleware)(['ADMIN', 'GUARD']), dashboard_controller_1.getDetailedStats);
// Parameterized routes
router.get('/visitor/host/:hostId', (0, auth_middleware_1.authMiddleware)(['EMPLOYEE', 'ADMIN']), visitor_controller_1.getHostVisitors);
router.get('/visitor/track/:code', visitor_controller_1.getVisitorByCode); // Public
router.post('/visitor/:id/approve', (0, auth_middleware_1.authMiddleware)(['EMPLOYEE', 'ADMIN']), visitor_controller_1.approveVisitor);
router.patch('/visitor/:id/status', (0, auth_middleware_1.authMiddleware)(['EMPLOYEE', 'ADMIN', 'GUARD']), visitor_controller_1.updateVisitorStatus);
// Gate Routes
router.post('/gate/checkin', (0, auth_middleware_1.authMiddleware)(['GUARD', 'ADMIN']), gate_controller_1.checkIn);
router.post('/gate/checkout', (0, auth_middleware_1.authMiddleware)(['GUARD', 'ADMIN']), gate_controller_1.checkOut);
// Dashboard Routes
router.get('/dashboard/stats', (0, auth_middleware_1.authMiddleware)(['ADMIN', 'GUARD']), dashboard_controller_1.getStats);
router.get('/dashboard/stats/detailed', (0, auth_middleware_1.authMiddleware)(['ADMIN', 'GUARD']), dashboard_controller_1.getDetailedStats);
router.get('/logs', (0, auth_middleware_1.authMiddleware)(['ADMIN']), log_controller_1.getLogs);
// Blacklist Routes
router.get('/blacklist', (0, auth_middleware_1.authMiddleware)(['ADMIN', 'GUARD']), blacklist_controller_1.getBlacklist);
router.post('/blacklist', (0, auth_middleware_1.authMiddleware)(['ADMIN']), blacklist_controller_1.addToBlacklist);
router.delete('/blacklist/:id', (0, auth_middleware_1.authMiddleware)(['ADMIN']), blacklist_controller_1.removeFromBlacklist);
// Employee Routes
router.get('/employees', employee_controller_1.getEmployees); // Public for visitor form select
router.post('/employees/upload', (0, auth_middleware_1.authMiddleware)(['ADMIN']), upload.single('file'), employee_controller_1.uploadEmployees);
router.patch('/employees/:id/toggle', (0, auth_middleware_1.authMiddleware)(['ADMIN']), employee_controller_1.toggleEmployeeStatus);
exports.default = router;
//# sourceMappingURL=api.js.map