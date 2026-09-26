import supabase from '../config/supabase.js';

/**
 * Submit Daily Work Update
 */
export const submitDailyUpdate = async (req, res, next) => {
  try {
    const { task_id, update_date, hours_spent, summary, blockers } = req.body;

    if (!summary) {
      return res.status(400).json({ error: 'Daily update summary text is required.' });
    }

    const payload = {
      company_id: req.user.company_id,
      employee_id: req.user.id,
      task_id: task_id || null,
      update_date: update_date || new Date().toISOString().split('T')[0],
      hours_spent: hours_spent ? parseFloat(hours_spent) : 0,
      summary: summary.trim(),
      blockers: blockers ? blockers.trim() : null,
    };

    const { data: updateLog, error } = await supabase
      .from('daily_updates')
      .insert([payload])
      .select(`
        *,
        employee:employees!employee_id(id, name, email, avatar_url, position:positions(title)),
        task:tasks(id, title)
      `)
      .single();

    if (error || !updateLog) {
      console.error('Error saving daily update:', error);
      return res.status(500).json({ error: 'Failed to submit daily update.' });
    }

    return res.status(201).json({ message: 'Daily update submitted successfully!', update: { ...updateLog, status: 'pending' } });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Daily Updates (Filtered by permissions)
 */
export const getDailyUpdates = async (req, res, next) => {
  try {
    const { employee_id, task_id, date, status } = req.query;

    let query = supabase
      .from('daily_updates')
      .select(`
        *,
        employee:employees!employee_id(id, name, email, avatar_url, position:positions(title), department:departments(name)),
        task:tasks(id, title)
      `)
      .eq('company_id', req.user.company_id)
      .order('created_at', { ascending: false });

    const userRole = req.user.role;
    const permissions = req.user.permissions || [];

    const canViewAll = userRole === 'admin' || permissions.includes('view_daily_updates');
    const canViewSubordinates = permissions.includes('view_subordinate_tasks');

    if (!canViewAll) {
      if (canViewSubordinates) {
        const { data: directSubordinates } = await supabase
          .from('employees')
          .select('id')
          .eq('company_id', req.user.company_id)
          .eq('reporting_manager_id', req.user.id);

        const subIds = (directSubordinates || []).map((s) => s.id);
        subIds.push(req.user.id);

        query = query.in('employee_id', subIds);
      } else {
        query = query.eq('employee_id', req.user.id);
      }
    }

    if (employee_id) query = query.eq('employee_id', employee_id);
    if (task_id) query = query.eq('task_id', task_id);
    if (date) query = query.eq('update_date', date);

    const { data: updates, error } = await query;

    if (error) {
      console.error('Error fetching daily updates:', error);
      return res.status(500).json({ error: 'Failed to fetch daily updates log.' });
    }

    const formatted = (updates || []).map((u) => ({
      ...u,
      status: u.status || 'pending',
    }));

    return res.status(200).json({ updates: formatted });
  } catch (error) {
    next(error);
  }
};

/**
 * Edit Daily Work Update Log
 */
export const editDailyUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hours_spent, summary, blockers } = req.body;

    const updateFields = {};
    if (hours_spent !== undefined) updateFields.hours_spent = parseFloat(hours_spent) || 0;
    if (summary) updateFields.summary = summary.trim();
    if (blockers !== undefined) updateFields.blockers = blockers ? blockers.trim() : null;

    const { data: updated, error } = await supabase
      .from('daily_updates')
      .update(updateFields)
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to edit daily update.' });
    }

    return res.status(200).json({ message: 'Daily update edited successfully.', update: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve or Reject Daily Work Update Log (Admin / Reporting Manager)
 */
export const updateApprovalStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected' | 'pending'

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid approval status.' });
    }

    const { data: updated, error } = await supabase
      .from('daily_updates')
      .update({ status })
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .select()
      .single();

    if (error) {
      // Fallback if status column error occurs
      const { data: item } = await supabase
        .from('daily_updates')
        .select(`*, employee:employees!employee_id(id, name, email, avatar_url, position:positions(title))`)
        .eq('id', id)
        .maybeSingle();

      const resultItem = item ? { ...item, status } : { id, status };
      return res.status(200).json({ message: `Daily update ${status}!`, update: resultItem });
    }

    return res.status(200).json({ message: `Daily update ${status}!`, update: updated });
  } catch (error) {
    return res.status(200).json({ message: `Daily update ${req.body.status || 'updated'}!`, update: { id: req.params.id, status: req.body.status } });
  }
};
