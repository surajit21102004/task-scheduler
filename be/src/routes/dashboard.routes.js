import express from 'express';
import { getDashboardSummary, getEmployeeReports } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', authenticateToken, getDashboardSummary);
router.get('/reports', authenticateToken, getEmployeeReports);

export default router;
