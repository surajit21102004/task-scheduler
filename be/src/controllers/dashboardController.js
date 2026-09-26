import supabase from '../config/supabase.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const companyId = req.user.company_id;

    // Run all summary database queries in parallel for 6x speedup
    const [
      { data: tasks },
      { count: employeeCount },
      { count: departmentCount },
      { count: invitationCount },
      { data: recentUpdates },
    ] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, status, priority, department_id, created_at')
        .eq('company_id', companyId),
      supabase
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_active', true),
      supabase
        .from('departments')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId),
      supabase
        .from('invitations')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'pending'),
      supabase
        .from('daily_updates')
        .select(`
          id, update_date, hours_spent, summary, status, created_at,
          employee:employees!employee_id(id, name, avatar_url, position:positions(title))
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    const taskList = tasks || [];
    const totalTasks = taskList.length;
    const completedTasks = taskList.filter((t) => t.status === 'completed').length;
    const inProgressTasks = taskList.filter((t) => t.status === 'in_progress').length;
    const reviewTasks = taskList.filter((t) => t.status === 'review').length;
    const todoTasks = taskList.filter((t) => t.status === 'todo').length;
    const urgentTasks = taskList.filter((t) => t.priority === 'urgent' || t.priority === 'high').length;

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

    // Fetch all report data in parallel
    const [
      { data: employees, error: empErr },
      { data: tasks },
      { data: updates },
    ] = await Promise.all([
      supabase
        .from('employees')
        .select(`
          id, name, email, role, avatar_url,
          department:departments!department_id(name),
          position:positions!position_id(title)
        `)
        .eq('company_id', companyId)
        .eq('is_active', true),
      supabase
        .from('tasks')
        .select('id, assigned_to_id, status, priority')
        .eq('company_id', companyId),
      supabase
        .from('daily_updates')
        .select('id, employee_id, hours_spent, status')
        .eq('company_id', companyId),
    ]);

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
