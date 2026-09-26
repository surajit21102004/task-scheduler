import supabase from '../config/supabase.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const companyId = req.user.company_id;

    // 1. Task Counts
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, status, priority, department_id, created_at')
      .eq('company_id', companyId);

    const taskList = tasks || [];
    const totalTasks = taskList.length;
    const completedTasks = taskList.filter((t) => t.status === 'completed').length;
    const inProgressTasks = taskList.filter((t) => t.status === 'in_progress').length;
    const reviewTasks = taskList.filter((t) => t.status === 'review').length;
    const todoTasks = taskList.filter((t) => t.status === 'todo').length;
    const urgentTasks = taskList.filter((t) => t.priority === 'urgent' || t.priority === 'high').length;

    // 2. Active Employees
    const { count: employeeCount } = await supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_active', true);

    // 3. Departments Count
    const { count: departmentCount } = await supabase
      .from('departments')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId);

    // 4. Pending Invitations Count
    const { count: invitationCount } = await supabase
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'pending');

    // 5. Recent Daily Updates
    const { data: recentUpdates } = await supabase
      .from('daily_updates')
      .select(`
        id, update_date, hours_spent, summary, status, created_at,
        employee:employees(id, name, avatar_url, position:positions(title))
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(6);

    return res.status(200).json({
      summary: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        reviewTasks,
        todoTasks,
        urgentTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        activeEmployees: employeeCount || 0,
        totalDepartments: departmentCount || 0,
        pendingInvitations: invitationCount || 0,
      },
      recentUpdates: recentUpdates || [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Rank-wise Employee Performance & Task Execution Reports
 */
export const getEmployeeReports = async (req, res, next) => {
  try {
    const companyId = req.user.company_id;

    // Fetch all employees in company
    const { data: employees, error: empErr } = await supabase
      .from('employees')
      .select(`
        id, name, email, role, avatar_url,
        department:departments(name),
        position:positions(title)
      `)
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (empErr) {
      return res.status(500).json({ error: 'Failed to fetch employee list for reports.' });
    }

    // Fetch all tasks in company
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, assigned_to_id, status, priority')
      .eq('company_id', companyId);

    // Fetch all daily updates in company
    const { data: updates } = await supabase
      .from('daily_updates')
      .select('id, employee_id, hours_spent, status')
      .eq('company_id', companyId);

    const taskList = tasks || [];
    const updateList = updates || [];

    // Aggregate metrics per employee
    const reports = employees.map((emp) => {
      const empTasks = taskList.filter((t) => t.assigned_to_id === emp.id);
      const totalAssigned = empTasks.length;
      const completed = empTasks.filter((t) => t.status === 'completed').length;
      const inProgress = empTasks.filter((t) => t.status === 'in_progress').length;
      const review = empTasks.filter((t) => t.status === 'review').length;
      const todo = empTasks.filter((t) => t.status === 'todo').length;
      const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

      const empUpdates = updateList.filter((u) => u.employee_id === emp.id);
      const totalHours = empUpdates.reduce((acc, curr) => acc + (parseFloat(curr.hours_spent) || 0), 0);
      const approvedUpdates = empUpdates.filter((u) => u.status === 'approved').length;

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        department: emp.department?.name || 'General',
        position: emp.position?.title || 'Team Member',
        totalAssigned,
        completed,
        inProgress,
        review,
        todo,
        completionRate,
        totalHours: Math.round(totalHours * 10) / 10,
        approvedUpdates,
      };
    });

    // Rank employees by completed tasks descending, then completion rate descending
    reports.sort((a, b) => {
      if (b.completed !== a.completed) {
        return b.completed - a.completed;
      }
      return b.completionRate - a.completionRate;
    });

    // Add rank index
    const rankedReports = reports.map((rep, idx) => ({
      ...rep,
      rank: idx + 1,
    }));

    return res.status(200).json({ reports: rankedReports });
  } catch (error) {
    next(error);
  }
};
