import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_task_scheduler_jwt_key_2026_antigravity';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    // Fetch fresh employee data & permissions
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*, company:companies(*), department:departments(*), position:positions(*)')
      .eq('id', decoded.id)
      .single();

    if (error || !employee || !employee.is_active) {
      return res.status(403).json({ error: 'User account inactive or not found.' });
    }

    // Fetch user permissions
    const { data: permRecords } = await supabase
      .from('employee_permissions')
      .select('permission_key')
      .eq('employee_id', employee.id);

    const userPermissions = (permRecords || []).map((p) => p.permission_key);

    req.user = {
      id: employee.id,
      company_id: employee.company_id,
      company_name: employee.company?.name,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department_id: employee.department_id,
      position_id: employee.position_id,
      reporting_manager_id: employee.reporting_manager_id,
      permissions: userPermissions,
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};
