import supabase from '../config/supabase.js';

/**
 * Get Company Details, Departments, Positions
 */
export const getCompanyProfile = async (req, res, next) => {
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', req.user.company_id)
      .single();

    if (error || !company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    const { data: departments } = await supabase
      .from('departments')
      .select('*')
      .eq('company_id', req.user.company_id)
      .order('name');

    const { data: positions } = await supabase
      .from('positions')
      .select('*')
      .eq('company_id', req.user.company_id)
      .order('level');

    return res.status(200).json({ company, departments, positions });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Company Details (Admin only)
 */
export const updateCompany = async (req, res, next) => {
  try {
    const { name, logo_url } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (logo_url !== undefined) updateData.logo_url = logo_url;

    const { data: updated, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', req.user.company_id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update company.' });
    }

    return res.status(200).json({ message: 'Company updated successfully.', company: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Department
 */
export const createDepartment = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Department name is required.' });
    }

    const { data: dept, error } = await supabase
      .from('departments')
      .insert([
        {
          company_id: req.user.company_id,
          name: name.trim(),
          description: description ? description.trim() : null,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create department.' });
    }

    return res.status(201).json({ message: 'Department created.', department: dept });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Position / Role Title
 */
export const createPosition = async (req, res, next) => {
  try {
    const { title, level } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Position title is required.' });
    }

    const { data: pos, error } = await supabase
      .from('positions')
      .insert([
        {
          company_id: req.user.company_id,
          title: title.trim(),
          level: level ? parseInt(level) : 1,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create position.' });
    }

    return res.status(201).json({ message: 'Position created.', position: pos });
  } catch (error) {
    next(error);
  }
};
