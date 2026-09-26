import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  X,
  Calendar,
  User,
  Paperclip,
  MessageSquare,
  Send,
  Trash2,
  Building,
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

const TaskDetailModal = ({ isOpen, onClose, task, onTaskUpdated }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      fetchComments();
    }
  }, [isOpen, task]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await api.get(`/messages/task/${task.id}`);
      setComments(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load task discussion:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !task) return;

    setSending(true);
    try {
      const res = await api.post('/messages', {
        task_id: task.id,
        content: newComment.trim(),
      });

      setComments((prev) => [...prev, res.data.message]);
      setNewComment('');
      toast.success('Comment posted!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post comment.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment from database?')) return;
    try {
      await api.delete(`/messages/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Comment deleted from database.');
    } catch (err) {
      toast.error('Failed to delete comment.');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.patch(`/tasks/${task.id}/status`, { status: newStatus });
      toast.success(`Task status updated to ${newStatus.replace('_', ' ')}!`);
      if (onTaskUpdated) onTaskUpdated(res.data.task);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status.');
    }
  };

  if (!isOpen || !task) return null;

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'high':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-6 border border-slate-200 shadow-2xl relative max-h-[92vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>
                {task.priority} Priority
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Department: {task.department?.name || 'General'}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900">{task.title}</h2>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 text-xs">
          {/* Status & Assignment Quick Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Status</span>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="mt-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Under Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Assignee</span>
              <div className="mt-1 flex items-center space-x-1.5 font-bold text-slate-900">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center">
                  {task.assignee?.name ? task.assignee.name.substring(0, 2).toUpperCase() : '?'}
                </div>
                <span className="truncate">{task.assignee?.name || 'Unassigned'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Due Date</span>
              <div className="mt-1 flex items-center space-x-1 text-slate-800 font-bold">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{task.due_date || 'No due date'}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-bold text-slate-800 mb-1">Task Description</h4>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed text-slate-700 whitespace-pre-line">
              {task.description || 'No detailed description provided for this task.'}
            </div>
          </div>

          {/* Attachments Section */}
          {task.attachments && task.attachments.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-blue-600" />
                Task Attachments ({task.attachments.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {task.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-blue-50/60 hover:bg-blue-100/60 border border-blue-200 rounded-xl flex items-center space-x-2 transition text-blue-700 font-bold"
                  >
                    <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate text-xs">{att.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Embedded Discussion / Comments */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Task Comments & Discussion ({comments.length})
            </h4>

            {loadingComments ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-slate-400 italic text-[11px]">No comments posted yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {comments.map((msg) => (
                  <div key={msg.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative group">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-bold text-blue-700">{msg.sender?.name || 'User'}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {(user?.role === 'admin' || msg.sender_id === user?.id) && (
                          <button
                            onClick={() => handleDeleteComment(msg.id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-800 leading-snug">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Post Comment Form */}
            <form onSubmit={handleSendComment} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Post a comment on this task..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 pro-input px-3 py-2 rounded-xl text-xs"
              />
              <button
                type="submit"
                disabled={sending || !newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shadow-2xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
