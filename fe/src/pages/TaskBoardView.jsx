import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Kanban,
  List,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  Calendar,
  Layers,
  Paperclip,
  Eye,
} from 'lucide-react';

const TaskBoardView = ({ openTaskModal, setSelectedTaskForChat, setSelectedTaskForDetail, isMyAssignedOnly = false, refreshKey }) => {
  const { user, hasPermission } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [search, priorityFilter, isMyAssignedOnly, refreshKey]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (priorityFilter) params.priority = priorityFilter;
      if (isMyAssignedOnly) params.my_assigned = 'true';

      const res = await api.get('/tasks', { params });
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus, e) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, updated_at: res.data.task.updated_at } : t))
      );
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update task status.');
    }
  };

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success('Task deleted.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete task.');
    }
  };

  const columns = [
    { id: 'todo', title: 'To Do', color: 'border-slate-200 text-slate-700 bg-slate-100' },
    { id: 'in_progress', title: 'In Progress', color: 'border-blue-200 text-blue-700 bg-blue-50' },
    { id: 'review', title: 'Under Review', color: 'border-amber-200 text-amber-800 bg-amber-50' },
    { id: 'completed', title: 'Completed', color: 'border-emerald-200 text-emerald-800 bg-emerald-50' },
  ];

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
    <div className="space-y-5">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pro-input pl-9 pr-3 py-1.5 rounded-xl text-xs placeholder:text-slate-400"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="pro-input px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent 🔥</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {/* View Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline">List</span>
            </button>
          </div>

          {(user?.role === 'admin' || hasPermission('create_task')) && (
            <button
              onClick={() => openTaskModal(null)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold flex items-center space-x-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);

            return (
              <div key={col.id} className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-3 min-h-[500px]">
                {/* Column Header */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${col.color}`}>
                  <h3 className="text-xs font-bold">{col.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white shadow-2xs">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-[11px] border border-dashed border-slate-200 rounded-xl bg-white">
                      No tasks in this stage
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskForDetail(task)}
                        className="pro-card p-4 space-y-3 relative group cursor-pointer hover:border-blue-300 transition"
                      >
                        {/* Priority Badge & Actions */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                          <div className="flex items-center space-x-1">
                            {task.attachments && task.attachments.length > 0 && (
                              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-0.5 mr-1" title="Attachments">
                                <Paperclip className="w-3 h-3 text-blue-600" />
                                {task.attachments.length}
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTaskForChat(task);
                              }}
                              title="Discussion & Comments"
                              className="p-1 text-slate-400 hover:text-blue-600 transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            {(user?.role === 'admin' || task.created_by_id === user?.id) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTaskModal(task);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-800 transition"
                                title="Edit Task"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug hover:text-blue-600 transition">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Assignee & Status Select */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                          <div className="flex items-center space-x-1.5 text-slate-700">
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                              {task.assignee?.name ? task.assignee.name.substring(0, 2).toUpperCase() : '?'}
                            </div>
                            <span className="truncate max-w-[90px] font-medium">{task.assignee?.name || 'Unassigned'}</span>
                          </div>

                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value, e)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-50 border border-slate-200 text-[10px] text-slate-700 font-semibold rounded px-1.5 py-0.5 focus:outline-none"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="pro-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Task Name</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Assignee</th>
                  <th className="p-4">Department</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTaskForDetail(task)}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{task.title}</div>
                      {task.description && <div className="text-[11px] text-slate-500 truncate max-w-xs">{task.description}</div>}
                    </td>
                    <td className="p-4">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value, e)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white border border-slate-200 text-xs px-2 py-1 rounded font-semibold text-slate-700"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      {task.assignee ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                            {task.assignee.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium">{task.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500">{task.department?.name || 'General'}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskForChat(task);
                        }}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold"
                        title="Discussion"
                      >
                        💬 Discussion
                      </button>
                      {(user?.role === 'admin' || task.created_by_id === user?.id) && (
                        <button
                          onClick={(e) => handleDeleteTask(task.id, e)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold"
                          title="Delete Task"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoardView;
