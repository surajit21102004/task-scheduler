import express from 'express';
import {
  sendMessage,
  getTaskMessages,
  getDirectMessages,
  getUnreadCount,
  deleteMessage,
  deleteConversation,
} from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';

const router = express.Router();

router.get('/unread-count', authenticateToken, getUnreadCount);
router.post('/', authenticateToken, requirePermission('send_messages'), sendMessage);
router.get('/task/:taskId', authenticateToken, getTaskMessages);
router.get('/direct/:otherUserId', authenticateToken, getDirectMessages);
router.delete('/:id', authenticateToken, deleteMessage);
router.delete('/conversation/:otherUserId', authenticateToken, deleteConversation);

export default router;
