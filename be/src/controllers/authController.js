import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_task_scheduler_jwt_key_2026_antigravity';

const DEFAULT_EMPLOYEE_PERMISSIONS = [
  'view_assigned_tasks',
  'update_task_status',
  'submit_daily_updates',
];

const ALL_PERMISSIONS = [
  'view_subordinate_tasks',
  'view_all_tasks',
  'view_daily_updates',
  'view_assigned_tasks',
  'create_task',
  'assign_task',
  'update_task_status',
  'submit_daily_updates',
  'send_messages',
  'view_employee_details',
  'manage_team_members',
  'manage_permissions',
];

/**
 * Register Company & Admin Account
 */
export const registerCompany = async (req, res, next) => {
  try {
    const {
      company_name,
      company_email,
      company_logo,
      admin_name,
      admin_email,
      password,
    } = req.body;

    if (!company_name || !company_email || !admin_name || !admin_email || !password) {
      return res.status(400).json({ error: 'All required registration fields must be provided.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Check if company or admin email already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('email', company_email.toLowerCase().trim())
      .maybeSingle();

    if (existingCompany) {
      return res.status(400).json({ error: 'Company email is already registered.' });
    }

    const { data: existingEmployee } = await supabase
      .from('employees')
      .select('id')
      .eq('email', admin_email.toLowerCase().trim())
      .maybeSingle();

    if (existingEmployee) {
      return res.status(400).json({ error: 'Admin email is already registered.' });
    }

    // 1. Create Company
    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .insert([
        {
          name: company_name.trim(),
          email: company_email.toLowerCase().trim(),
          logo_url: company_logo || null,
        },
      ])
      .select()
      .single();

    if (companyErr || !company) {
      console.error('Error creating company:', companyErr);
      return res.status(500).json({ error: 'Failed to register company.' });
    }

    // Hash admin password
    const passwordHash = await bcrypt.hash(password, 12);

    // 2. Create Admin Employee
    const { data: admin, error: adminErr } = await supabase
      .from('employees')
      .insert([
        {
          company_id: company.id,
          name: admin_name.trim(),
          email: admin_email.toLowerCase().trim(),
          password_hash: passwordHash,
          role: 'admin',
          is_active: true,
        },
      ])
      .select()
      .single();

    if (adminErr || !admin) {
      console.error('Error creating admin employee:', adminErr);
      return res.status(500).json({ error: 'Failed to create admin profile.' });
    }

    // 3. Grant all permissions to Admin
    const permInserts = ALL_PERMISSIONS.map((perm) => ({
      employee_id: admin.id,
      permission_key: perm,
    }));

    await supabase.from('employee_permissions').insert(permInserts);

    // 4. Create Default Departments and Positions for company
    const { data: defaultDepts } = await supabase
      .from('departments')
      .insert([
        { company_id: company.id, name: 'Management', description: 'Executive & Operational Leadership' },
        { company_id: company.id, name: 'Engineering', description: 'Software Development & Technical Infrastructure' },
        { company_id: company.id, name: 'Sales & Marketing', description: 'Business Development & Client Acquisition' },
      ])
      .select();

    const { data: defaultPositions } = await supabase
      .from('positions')
      .insert([
        { company_id: company.id, title: 'Department Manager', level: 1 },
        { company_id: company.id, title: 'Team Lead', level: 2 },
        { company_id: company.id, title: 'Senior Executive', level: 3 },
        { company_id: company.id, title: 'Team Member', level: 4 },
      ])
      .select();

    // 5. Generate JWT Token
    const token = jwt.sign(
      { id: admin.id, company_id: company.id, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    return res.status(201).json({
      message: 'Company registered successfully!',
      token,
      company,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        company_id: company.id,
        permissions: ALL_PERMISSIONS,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User Login (Admin / Manager / Employee)
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data: employee, error } = await supabase
      .from('employees')
      .select('*, company:companies!company_id(*), department:departments!department_id(*), position:positions!position_id(*)')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error || !employee) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!employee.is_active) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact your company admin.' });
    }

    const isMatch = await bcrypt.compare(password, employee.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Fetch user permissions
    const { data: permRecords } = await supabase
      .from('employee_permissions')
      .select('permission_key')
      .eq('employee_id', employee.id);

    const permissions = (permRecords || []).map((p) => p.permission_key);

    const token = jwt.sign(
      { id: employee.id, company_id: employee.company_id, role: employee.role },
      JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    return res.status(200).json({
      message: 'Login successful!',
      token,
      company: employee.company,
      user: {
        id: employee.id,
        company_id: employee.company_id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        position: employee.position,
        reporting_manager_id: employee.reporting_manager_id,
        avatar_url: employee.avatar_url,
        permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Authenticated User Details & Permissions
 */
export const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Invitation Details by Token (for Join page)
 */
export const getInvitationDetails = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required.' });
    }

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('*, company:companies(*), department:departments(*), position:positions(*), manager:employees!reporting_manager_id(id, name, email)')
      .eq('token', token)
      .maybeSingle();

    if (error || !invitation) {
      return res.status(404).json({ error: 'Invalid or missing invitation.' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: `This invitation has already been ${invitation.status}.` });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This invitation link has expired.' });
    }

    return res.status(200).json({ invitation });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept Invitation & Create Employee Account
 */
export const acceptInvitation = async (req, res, next) => {
  try {
    const { token, password, name } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const { data: invitation, error: invErr } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (invErr || !invitation || invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation is invalid or has expired.' });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invitation link has expired.' });
    }

    // Check if email already registered
    const { data: existingEmp } = await supabase
      .from('employees')
      .select('id')
      .eq('email', invitation.email.toLowerCase().trim())
      .maybeSingle();

    if (existingEmp) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create Employee record
    const { data: newEmployee, error: empErr } = await supabase
      .from('employees')
      .insert([
        {
          company_id: invitation.company_id,
          name: name ? name.trim() : invitation.name,
          email: invitation.email.toLowerCase().trim(),
          password_hash: passwordHash,
          role: invitation.role || 'employee',
          department_id: invitation.department_id,
          position_id: invitation.position_id,
          reporting_manager_id: invitation.reporting_manager_id,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (empErr || !newEmployee) {
      console.error('Error creating employee from invitation:', empErr);
      return res.status(500).json({ error: 'Failed to complete registration.' });
    }

    // Determine permissions: Custom permissions if provided by admin, otherwise DEFAULT_EMPLOYEE_PERMISSIONS
    let permissionsToGrant = DEFAULT_EMPLOYEE_PERMISSIONS;
    if (invitation.custom_permissions && Array.isArray(invitation.custom_permissions) && invitation.custom_permissions.length > 0) {
      permissionsToGrant = invitation.custom_permissions;
    }

    const permInserts = permissionsToGrant.map((p) => ({
      employee_id: newEmployee.id,
      permission_key: p,
    }));

    await supabase.from('employee_permissions').insert(permInserts);

    // Update invitation status
    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    // Generate token
    const jwtToken = jwt.sign(
      { id: newEmployee.id, company_id: newEmployee.company_id, role: newEmployee.role },
      JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    return res.status(200).json({
      message: 'Invitation accepted! Welcome to the company.',
      token: jwtToken,
      user: {
        id: newEmployee.id,
        company_id: newEmployee.company_id,
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        permissions: permissionsToGrant,
      },
    });
  } catch (error) {
    next(error);
  }
};
