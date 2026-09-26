import supabase from '../config/supabase.js';

/**
 * Get Tasks with Hierarchy & Granular Visibility Filters
 */
export const getTasks = async (req, res, next) => {
  try {
    const { status, priority, department_id, assigned_to_id, my_assigned, search } = req.query;

    let query = supabase
      .from('tasks')
      .select(`
        *,
        creator:employees!created_by_id(id, name, email, avatar_url),
        assignee:employees!assigned_to_id(id, name, email, avatar_url, position:positions(title)),
        department:departments(id, name)
      `)
      .eq('company_id', req.user.company_id)
      .order('created_at', { ascending: false });

    // Filter specifically for My Assigned Tasks portal
    if (my_assigned === 'true') {
      query = query.eq('assigned_to_id', req.user.id);
    } else {
      const userRole = req.user.role;
      const permissions = req.user.permissions || [];

      const canViewAll = userRole === 'admin' || permissions.includes('view_all_tasks');
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

          query = query.or(`assigned_to_id.in.(${subIds.join(',')}),created_by_id.eq.${req.user.id}`);
        } else {
          // Show all company tasks or own assigned tasks
          query = query.or(`assigned_to_id.eq.${req.user.id},created_by_id.eq.${req.user.id}`);
        }
      }
    }

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (department_id) query = query.eq('department_id', department_id);
    if (assigned_to_id) query = query.eq('assigned_to_id', assigned_to_id);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return res.status(500).json({ error: 'Failed to fetch task board.' });
    }

    return res.status(200).json({ tasks: tasks || [] });
  } catch (error) {
    next(error);
  }
};

/**
 * Create New Task
 */
export const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, assigned_to_id, department_id, due_date, attachments } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([
        {
          company_id: req.user.company_id,
          created_by_id: req.user.id,
          title: title.trim(),
          description: description ? description.trim() : null,
          status: status || 'todo',
          priority: priority || 'medium',
          assigned_to_id: assigned_to_id || null,
          department_id: department_id || null,
          due_date: due_date || null,
          attachments: attachments || [],
        },
      ])
      .select(`
        *,
        creator:employees!created_by_id(id, name, email, avatar_url),
        assignee:employees!assigned_to_id(id, name, email, avatar_url),
        department:departments(id, name)
      `)
      .single();

    if (error || !task) {
      console.error('Error creating task:', error);
      return res.status(500).json({ error: 'Failed to create task.' });
    }

    return res.status(201).json({ message: 'Task created successfully.', task });
  } catch (error) {
    next(error);
  }
};

/**
 * Quick Update Task Status (Kanban drag & drop / quick status change)
 */
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['todo', 'in_progress', 'review', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .select(`
        *,
        creator:employees!created_by_id(id, name, email, avatar_url),
        assignee:employees!assigned_to_id(id, name, email, avatar_url),
        department:departments(id, name)
      `)
      .single();

    if (error || !updatedTask) {
      return res.status(500).json({ error: 'Failed to update task status.' });
    }

    return res.status(200).json({ message: 'Task status updated.', task: updatedTask });
  } catch (error) {
    next(error);
  }
};

/**
 * Edit Full Task Details
 */
export const updateTaskDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assigned_to_id, department_id, due_date, attachments } = req.body;

    const updateFields = { updated_at: new Date().toISOString() };
    if (title) updateFields.title = title.trim();
    if (description !== undefined) updateFields.description = description ? description.trim() : null;
    if (status) updateFields.status = status;
    if (priority) updateFields.priority = priority;
    if (assigned_to_id !== undefined) updateFields.assigned_to_id = assigned_to_id || null;
    if (department_id !== undefined) updateFields.department_id = department_id || null;
    if (due_date !== undefined) updateFields.due_date = due_date || null;
    if (attachments !== undefined) updateFields.attachments = attachments || [];

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(updateFields)
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .select(`
        *,
        creator:employees!created_by_id(id, name, email, avatar_url),
        assignee:employees!assigned_to_id(id, name, email, avatar_url),
        department:departments(id, name)
      `)
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update task.' });
    }

    return res.status(200).json({ message: 'Task updated successfully.', task: updatedTask });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Task
 */
export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('company_id', req.user.company_id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete task.' });
    }

    return res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
