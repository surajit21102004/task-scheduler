import express from 'express';
import {
  getPermissionsCatalog,
  getEmployeePermissions,
  updateEmployeePermissions,
} from '../controllers/permissionController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';

const router = express.Router();

router.get('/catalog', authenticateToken, getPermissionsCatalog);
router.get('/employee/:employeeId', authenticateToken, getEmployeePermissions);
router.put('/update', authenticateToken, requirePermission('manage_permissions'), updateEmployeePermissions);

export default router;
