import express from 'express';
import {
  submitDailyUpdate,
  getDailyUpdates,
  editDailyUpdate,
  updateApprovalStatus,
} from '../controllers/updateController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';

const router = express.Router();

router.post('/', authenticateToken, requirePermission('submit_daily_updates'), submitDailyUpdate);
router.get('/', authenticateToken, getDailyUpdates);
router.put('/:id', authenticateToken, editDailyUpdate);
router.patch('/:id/approval', authenticateToken, updateApprovalStatus);

export default router;
