import { Router } from 'express';
import multer from 'multer';
import { 
  registerVisitor, 
  getPendingVisitors, 
  approveVisitor, 
  updateVisitorStatus,
  getHostVisitors,
  getVisitorProfile,
  getVisitorByCode
} from '../controllers/visitor.controller';
import { checkIn, checkOut } from '../controllers/gate.controller';
import { getStats, getDetailedStats } from '../controllers/dashboard.controller';
import { uploadEmployees, getEmployees, toggleEmployeeStatus } from '../controllers/employee.controller';
import { login, register, setup } from '../controllers/auth.controller';
import { getLogs } from '../controllers/log.controller';
import { addToBlacklist, getBlacklist, removeFromBlacklist } from '../controllers/blacklist.controller';
import { getConfig, updateConfig } from '../controllers/config.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// System Config (Public for initialization, Update protected)
router.get('/config', getConfig);
router.patch('/config', authMiddleware(['ADMIN']), updateConfig);

// Auth Routes
router.post('/auth/login', login);
router.post('/auth/register', register); // Now protected by setupKey internally
router.post('/auth/setup', setup);

// Visitor Routes
router.post('/visitor/register', registerVisitor); // Public
router.get('/visitor/pending', authMiddleware(['ADMIN', 'GUARD']), getPendingVisitors);
router.get('/visitor/profile', getVisitorProfile); // Public for autocomplete
router.get('/visitor/active', authMiddleware(['ADMIN', 'GUARD']), getDetailedStats);

// Parameterized routes
router.get('/visitor/host/:hostId', authMiddleware(['EMPLOYEE', 'ADMIN']), getHostVisitors);
router.get('/visitor/track/:code', getVisitorByCode); // Public
router.post('/visitor/:id/approve', authMiddleware(['EMPLOYEE', 'ADMIN']), approveVisitor);
router.patch('/visitor/:id/status', authMiddleware(['EMPLOYEE', 'ADMIN', 'GUARD']), updateVisitorStatus);

// Gate Routes
router.post('/gate/checkin', authMiddleware(['GUARD', 'ADMIN']), checkIn);
router.post('/gate/checkout', authMiddleware(['GUARD', 'ADMIN']), checkOut);

// Dashboard Routes
router.get('/dashboard/stats', authMiddleware(['ADMIN', 'GUARD']), getStats);
router.get('/dashboard/stats/detailed', authMiddleware(['ADMIN', 'GUARD']), getDetailedStats);
router.get('/logs', authMiddleware(['ADMIN']), getLogs);

// Blacklist Routes
router.get('/blacklist', authMiddleware(['ADMIN', 'GUARD']), getBlacklist);
router.post('/blacklist', authMiddleware(['ADMIN']), addToBlacklist);
router.delete('/blacklist/:id', authMiddleware(['ADMIN']), removeFromBlacklist);

// Employee Routes
router.get('/employees', getEmployees); // Public for visitor form select
router.post('/employees/upload', authMiddleware(['ADMIN']), upload.single('file'), uploadEmployees);
router.patch('/employees/:id/toggle', authMiddleware(['ADMIN']), toggleEmployeeStatus);

export default router;
