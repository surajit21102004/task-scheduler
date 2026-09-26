import supabase from '../config/supabase.js';

export const PERMISSIONS_CATALOG = [
  { key: 'view_subordinate_tasks', label: 'View Subordinate Tasks', description: 'Can view tasks of reporting employees/team members', category: 'Tasks' },
  { key: 'view_all_tasks', label: 'View All Company Tasks', description: 'Can view tasks across all departments in the company', category: 'Tasks' },
  { key: 'view_daily_updates', label: 'View Team Daily Updates', description: 'Can view daily update logs submitted by team members', category: 'Updates' },
  { key: 'view_assigned_tasks', label: 'View Assigned Tasks', description: 'Can view tasks directly assigned to self', category: 'Tasks' },
  { key: 'create_task', label: 'Create Tasks', description: 'Can create new tasks for self or team members', category: 'Tasks' },
  { key: 'assign_task', label: 'Assign Tasks', description: 'Can assign or reassign tasks to company employees', category: 'Tasks' },
  { key: 'update_task_status', label: 'Update Task Status', description: 'Can change status (Todo, In Progress, Review, Completed)', category: 'Tasks' },
  { key: 'submit_daily_updates', label: 'Submit Daily Updates', description: 'Can log daily work progress, hours, and blockers', category: 'Updates' },
  { key: 'send_messages', label: 'Send Direct Messages', description: 'Can send workplace messages and post task comments', category: 'Communication' },
  { key: 'view_employee_details', label: 'View Employee Directory', description: 'Can view company org chart and employee profiles', category: 'Team' },
  { key: 'manage_team_members', label: 'Manage Team Members', description: 'Can send invitations and modify reporting hierarchy', category: 'Administration' },
  { key: 'manage_permissions', label: 'Manage Role Permissions', description: 'Can grant or revoke granular permissions for employees', category: 'Administration' },
];

/**
 * Get Available Permissions Catalog
 */
export const getPermissionsCatalog = async (req, res, next) => {
  try {
    return res.status(200).json({ catalog: PERMISSIONS_CATALOG });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Permissions for Specific Employee
 */
export const getEmployeePermissions = async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    const { data: records, error } = await supabase
      .from('employee_permissions')
      .select('permission_key')
      .eq('employee_id', employeeId);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch employee permissions.' });
    }

    const permissions = records.map((r) => r.permission_key);
    return res.status(200).json({ employee_id: employeeId, permissions });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Permissions for Employee (Admin / Authorized User)
 */
export const updateEmployeePermissions = async (req, res, next) => {
  try {
    const { employee_id, permissions } = req.body;

    if (!employee_id || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'employee_id and permissions array are required.' });
    }

    // Check if target employee belongs to same company
    const { data: emp, error: empErr } = await supabase
      .from('employees')
      .select('id, company_id')
      .eq('id', employee_id)
      .eq('company_id', req.user.company_id)
      .single();

    if (empErr || !emp) {
      return res.status(404).json({ error: 'Employee not found in your company.' });
    }

    // Clear existing permissions
    await supabase
      .from('employee_permissions')
      .delete()
      .eq('employee_id', employee_id);

    // Insert new permissions
    if (permissions.length > 0) {
      const inserts = permissions.map((key) => ({
        employee_id,
        permission_key: key,
      }));

      const { error: insErr } = await supabase.from('employee_permissions').insert(inserts);
      if (insErr) {
        console.error('Error inserting permissions:', insErr);
        return res.status(500).json({ error: 'Failed to save permissions.' });
      }
    }

    return res.status(200).json({
      message: 'Employee permissions updated successfully.',
      employee_id,
      permissions,
    });
  } catch (error) {
    next(error);
  }
};
