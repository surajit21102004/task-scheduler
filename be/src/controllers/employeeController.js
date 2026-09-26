import { v4 as uuidv4 } from 'uuid';
import supabase from '../config/supabase.js';
import { sendInvitationEmail } from '../config/mailer.js';

/**
 * Get List of Employees in Company
 */
export const getEmployees = async (req, res, next) => {
  try {
    const { data: employees, error } = await supabase
      .from('employees')
      .select(`
        id, company_id, name, email, role, is_active, avatar_url, created_at,
        department:departments(id, name),
        position:positions(id, title, level),
        reporting_manager:employees!reporting_manager_id(id, name, email)
      `)
      .eq('company_id', req.user.company_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching employees:', error);
      return res.status(500).json({ error: 'Failed to fetch employee list.' });
    }

    // Fetch permission maps for each employee
    const { data: allPerms } = await supabase
      .from('employee_permissions')
      .select('employee_id, permission_key');

    const permMap = {};
    (allPerms || []).forEach((p) => {
      if (!permMap[p.employee_id]) permMap[p.employee_id] = [];
      permMap[p.employee_id].push(p.permission_key);
    });

    const formatted = employees.map((emp) => ({
      ...emp,
      permissions: permMap[emp.id] || [],
    }));

    return res.status(200).json({ employees: formatted });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Organizational Hierarchy Tree Structure
 */
export const getHierarchyTree = async (req, res, next) => {
  try {
    const { data: employees, error } = await supabase
      .from('employees')
      .select(`
        id, company_id, name, email, role, reporting_manager_id, avatar_url,
        department:departments(id, name),
        position:positions(id, title, level)
      `)
      .eq('company_id', req.user.company_id)
      .eq('is_active', true);

    if (error) {
      return res.status(500).json({ error: 'Failed to build hierarchy tree.' });
    }

    // Map by ID
    const empMap = {};
    employees.forEach((emp) => {
      empMap[emp.id] = { ...emp, subordinates: [] };
    });

    const rootNodes = [];

    employees.forEach((emp) => {
      if (emp.reporting_manager_id && empMap[emp.reporting_manager_id]) {
        empMap[emp.reporting_manager_id].subordinates.push(empMap[emp.id]);
      } else {
        rootNodes.push(empMap[emp.id]);
      }
    });

    return res.status(200).json({ hierarchy: rootNodes });
  } catch (error) {
    next(error);
  }
};

/**
 * Invite Employee via Email (Nodemailer)
 */
export const inviteEmployee = async (req, res, next) => {
  try {
    const {
      name,
      email,
      position_id,
      department_id,
      reporting_manager_id,
      role,
      custom_permissions,
    } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Employee name and email are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const { data: existingEmp } = await supabase
      .from('employees')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingEmp) {
      return res.status(400).json({ error: 'An employee with this email address already exists.' });
    }

    // Get company details
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', req.user.company_id)
      .single();

    // Get position & department names for email template
    let positionTitle = 'Team Member';
    if (position_id) {
      const { data: pos } = await supabase.from('positions').select('title').eq('id', position_id).single();
      if (pos) positionTitle = pos.title;
    }

    let departmentName = 'General';
    if (department_id) {
      const { data: dept } = await supabase.from('departments').select('name').eq('id', department_id).single();
      if (dept) departmentName = dept.name;
    }

    let managerName = 'N/A';
    if (reporting_manager_id) {
      const { data: mgr } = await supabase.from('employees').select('name').eq('id', reporting_manager_id).single();
      if (mgr) managerName = mgr.name;
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // Store invitation record
    const { data: invitation, error: invErr } = await supabase
      .from('invitations')
      .insert([
        {
          company_id: req.user.company_id,
          invited_by_id: req.user.id,
          name: name.trim(),
          email: cleanEmail,
          department_id: department_id || null,
          position_id: position_id || null,
          reporting_manager_id: reporting_manager_id || null,
          role: role || 'employee',
          token,
          custom_permissions: custom_permissions || [],
          status: 'pending',
          expires_at: expiresAt,
        },
      ])
      .select()
      .single();

    if (invErr || !invitation) {
      console.error('Error creating invitation:', invErr);
      return res.status(500).json({ error: 'Failed to create invitation record.' });
    }

    // Send email via Nodemailer
    const emailResult = await sendInvitationEmail({
      toEmail: cleanEmail,
      employeeName: name.trim(),
      companyName: company?.name || 'Your Company',
      positionTitle,
      departmentName,
      reportingManagerName: managerName,
      invitationToken: token,
    });

    return res.status(201).json({
      message: emailResult.success
        ? `Invitation successfully sent to ${cleanEmail} via email!`
        : `Invitation created! Note: Email delivery returned status warning: ${emailResult.error}`,
      invitation,
      emailSent: emailResult.success,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Invitations List
 */
export const getInvitations = async (req, res, next) => {
  try {
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select(`
        *,
        department:departments(name),
        position:positions(title),
        manager:employees!reporting_manager_id(name)
      `)
      .eq('company_id', req.user.company_id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch invitations.' });
    }

    return res.status(200).json({ invitations });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Employee Department, Position, Reporting Manager, Role
 */
export const updateEmployeeStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { department_id, position_id, reporting_manager_id, role, is_active } = req.body;

    const updateData = {};
    if (department_id !== undefined) updateData.department_id = department_id || null;
    if (position_id !== undefined) updateData.position_id = position_id || null;
    if (reporting_manager_id !== undefined) updateData.reporting_manager_id = reporting_manager_id || null;
    if (role) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updated, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update employee hierarchy details.' });
    }

    return res.status(200).json({ message: 'Employee updated successfully.', employee: updated });
  } catch (error) {
    next(error);
  }
};
