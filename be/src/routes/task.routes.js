import express from 'express';
import {
  getTasks,
  createTask,
  updateTaskStatus,
  updateTaskDetails,
  deleteTask,
} from '../controllers/taskController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';

const router = express.Router();

router.get('/', authenticateToken, getTasks);
router.post('/', authenticateToken, requirePermission('create_task'), createTask);
router.patch('/:id/status', authenticateToken, requirePermission('update_task_status'), updateTaskStatus);
router.put('/:id', authenticateToken, updateTaskDetails);
router.delete('/:id', authenticateToken, deleteTask);

export default router;
