import express from 'express';
import {
  registerCompany,
  login,
  getMe,
  getInvitationDetails,
  acceptInvitation,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerCompany);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.get('/invitation', getInvitationDetails);
router.post('/accept-invitation', acceptInvitation);

export default router;
