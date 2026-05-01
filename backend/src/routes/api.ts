import { Router } from 'express';
import multer from 'multer';
import { registerVisitor, getPendingVisitors, approveVisitor, updateVisitorStatus } from '../controllers/visitor.controller';
import { checkIn, checkOut } from '../controllers/gate.controller';
import { getStats, getDetailedStats } from '../controllers/dashboard.controller';
import { uploadEmployees, getEmployees, toggleEmployeeStatus } from '../controllers/employee.controller';
import { login, register } from '../controllers/auth.controller';
import { getLogs } from '../controllers/log.controller';
import { addToBlacklist, getBlacklist, removeFromBlacklist } from '../controllers/blacklist.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Auth Routes
router.post('/auth/login', login);
router.post('/auth/register', register); // Helper

// Visitor Routes
router.post('/visitor/register', registerVisitor);
router.get('/visitor/pending', getPendingVisitors);
router.get('/visitor/host/:hostId', getHostVisitors);
router.get('/visitor/profile', getVisitorProfile);
router.get('/visitor/track/:code', getVisitorByCode);
router.post('/visitor/:id/approve', approveVisitor);
router.patch('/visitor/:id/status', updateVisitorStatus);
router.get('/visitor/active', getDetailedStats);

// Gate Routes
router.post('/gate/checkin', checkIn);
router.post('/gate/checkout', checkOut);

// Dashboard Routes
router.get('/dashboard/stats', getStats);
router.get('/dashboard/stats/detailed', getDetailedStats);
router.get('/logs', getLogs);

// Blacklist Routes
router.get('/blacklist', getBlacklist);
router.post('/blacklist', addToBlacklist);
router.delete('/blacklist/:id', removeFromBlacklist);

// Employee Routes
router.get('/employees', getEmployees);
router.post('/employees/upload', upload.single('file'), uploadEmployees);
router.patch('/employees/:id/toggle', toggleEmployeeStatus);

export default router;
