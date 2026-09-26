import express from 'express';
import {
  getCompanyProfile,
  updateCompany,
  createDepartment,
  createPosition,
} from '../controllers/companyController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin, requirePermission } from '../middleware/permission.js';

const router = express.Router();

router.get('/profile', authenticateToken, getCompanyProfile);
router.put('/profile', authenticateToken, requireAdmin, updateCompany);
router.post('/departments', authenticateToken, requirePermission('manage_team_members'), createDepartment);
router.post('/positions', authenticateToken, requirePermission('manage_team_members'), createPosition);

export default router;
