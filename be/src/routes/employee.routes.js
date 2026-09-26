import express from 'express';
import {
  getEmployees,
  getHierarchyTree,
  inviteEmployee,
  getInvitations,
  updateEmployeeStructure,
} from '../controllers/employeeController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';

const router = express.Router();

router.get('/', authenticateToken, requirePermission('view_employee_details', 'send_messages', 'assign_task', 'create_task', 'view_assigned_tasks'), getEmployees);
router.get('/hierarchy', authenticateToken, requirePermission('view_employee_details'), getHierarchyTree);
router.post('/invite', authenticateToken, requirePermission('manage_team_members'), inviteEmployee);
router.get('/invitations', authenticateToken, requirePermission('manage_team_members'), getInvitations);
router.put('/:id/structure', authenticateToken, requirePermission('manage_team_members'), updateEmployeeStructure);

export default router;
