import supabase from '../config/supabase.js';

/**
 * Send Direct Message or Task Comment
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { receiver_id, task_id, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty.' });
    }

    if (!receiver_id && !task_id) {
      return res.status(400).json({ error: 'Either receiver_id or task_id must be provided.' });
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert([
        {
          company_id: req.user.company_id,
          sender_id: req.user.id,
          receiver_id: receiver_id || null,
          task_id: task_id || null,
          content: content.trim(),
        },
      ])
      .select(`
        *,
        sender:employees!sender_id(id, name, email, avatar_url)
      `)
      .single();

    if (error || !message) {
      console.error('Error sending message:', error);
      return res.status(500).json({ error: 'Failed to send message.' });
    }

    return res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Task Comments/Messages
 */
export const getTaskMessages = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:employees!sender_id(id, name, email, avatar_url)
      `)
      .eq('company_id', req.user.company_id)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch task comments.' });
    }

    return res.status(200).json({ messages: messages || [] });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Direct Conversation between Current User and another Employee
 */
export const getDirectMessages = async (req, res, next) => {
  try {
    const { otherUserId } = req.params;

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:employees!sender_id(id, name, email, avatar_url)
      `)
      .eq('company_id', req.user.company_id)
      .is('task_id', null)
      .or(`and(sender_id.eq.${req.user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${req.user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat:', error);
      return res.status(500).json({ error: 'Failed to load conversation.' });
    }

    return res.status(200).json({ messages: messages || [] });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Unread Messages Count for Bell Notification
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', req.user.company_id)
      .eq('receiver_id', req.user.id);

    if (error) {
      return res.status(200).json({ unreadCount: 0 });
    }

    return res.status(200).json({ unreadCount: count || 0 });
  } catch (error) {
    return res.status(200).json({ unreadCount: 0 });
  }
};

/**
 * Delete Single Message directly from Database
 */
export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)
      .eq('company_id', req.user.company_id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete message from database.' });
    }

    return res.status(200).json({ message: 'Message permanently deleted from database.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete All Messages in Conversation directly from Database
 */
export const deleteConversation = async (req, res, next) => {
  try {
    const { otherUserId } = req.params;

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('company_id', req.user.company_id)
      .is('task_id', null)
      .or(`and(sender_id.eq.${req.user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${req.user.id})`);

    if (error) {
      return res.status(500).json({ error: 'Failed to clear conversation.' });
    }

    return res.status(200).json({ message: 'All conversation messages deleted from database.' });
  } catch (error) {
    next(error);
  }
};
