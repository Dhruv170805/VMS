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
import { login } from '../controllers/auth.controller';
import { getLogs } from '../controllers/log.controller';
import { addToBlacklist, getBlacklist, removeFromBlacklist } from '../controllers/blacklist.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Auth Routes
router.post('/auth/login', login);

// Visitor Routes
// Static routes first
router.post('/visitor/register', registerVisitor); // Public
router.get('/visitor/pending', authMiddleware(), getPendingVisitors);
router.get('/visitor/profile', getVisitorProfile); // Public autocomplete
router.get('/visitor/active', authMiddleware(), getDetailedStats);

// Parameterized routes
router.get('/visitor/host/:hostId', authMiddleware(), getHostVisitors);
router.get('/visitor/track/:code', getVisitorByCode); // Public pass tracking
router.post('/visitor/:id/approve', authMiddleware(), approveVisitor);
router.patch('/visitor/:id/status', authMiddleware(), updateVisitorStatus);

// Gate Routes
router.post('/gate/checkin', authMiddleware(), checkIn);
router.post('/gate/checkout', authMiddleware(), checkOut);

// Dashboard Routes
router.get('/dashboard/stats', authMiddleware(), getStats);
router.get('/dashboard/stats/detailed', authMiddleware(), getDetailedStats);
router.get('/logs', authMiddleware(['ADMIN']), getLogs);

// Blacklist Routes
router.get('/blacklist', authMiddleware(['ADMIN']), getBlacklist);
router.post('/blacklist', authMiddleware(['ADMIN']), addToBlacklist);
router.delete('/blacklist/:id', authMiddleware(['ADMIN']), removeFromBlacklist);

// Employee Routes
router.get('/employees', getEmployees); // Public for visitor form
router.post('/employees/upload', authMiddleware(['ADMIN']), upload.single('file'), uploadEmployees);
router.patch('/employees/:id/toggle', authMiddleware(['ADMIN']), toggleEmployeeStatus);

export default router;
