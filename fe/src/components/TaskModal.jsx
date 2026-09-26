import React, { useState, useEffect } from 'react';
import api from '../services/api';
import SearchableSelect from './SearchableSelect';
import toast from 'react-hot-toast';
import { X, Calendar, Paperclip, Upload } from 'lucide-react';

const TaskModal = ({ isOpen, onClose, taskToEdit, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [assignedToId, setAssignedToId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [attachments, setAttachments] = useState([]);

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
      if (taskToEdit) {
        setTitle(taskToEdit.title || '');
        setDescription(taskToEdit.description || '');
        setStatus(taskToEdit.status || 'todo');
        setPriority(taskToEdit.priority || 'medium');
        setAssignedToId(taskToEdit.assigned_to_id || '');
        setDepartmentId(taskToEdit.department_id || '');
        setDueDate(taskToEdit.due_date || '');
        setAttachments(taskToEdit.attachments || []);
      } else {
        resetForm();
      }
    }
  }, [isOpen, taskToEdit]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('todo');
    setPriority('medium');
    setAssignedToId('');
    setDepartmentId('');
    setDueDate('');
    setAttachments([]);
  };

  const fetchMetadata = async () => {
    try {
      const [empRes, compRes] = await Promise.all([
        api.get('/employees'),
        api.get('/company/profile'),
      ]);
      setEmployees(empRes.data.employees || []);
      setDepartments(compRes.data.departments || []);
    } catch (err) {
      console.error('Failed to load modal metadata:', err);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 5MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments((prev) => [
          ...prev,
          { name: file.name, url: reader.result, type: file.type },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assigned_to_id: assignedToId || null,
        department_id: departmentId || null,
        due_date: dueDate || null,
        attachments,
      };

      if (taskToEdit) {
        await api.put(`/tasks/${taskToEdit.id}`, payload);
        toast.success('Task updated successfully!');
      } else {
        await api.post('/tasks', payload);
        toast.success('New Task created successfully!');
      }

      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const assigneeOptions = employees.map((emp) => ({
    id: emp.id,
    label: `${emp.name} (${emp.position?.title || emp.role})`,
  }));

  const departmentOptions = departments.map((dept) => ({
    id: dept.id,
    label: dept.name,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-slate-200 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-slate-900 mb-4">
          {taskToEdit ? 'Edit Task' : 'Create New Task'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Complete Q3 Sales Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full pro-input px-3.5 py-2 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Task details and instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full pro-input px-3.5 py-2 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full pro-input px-3 py-2 rounded-xl text-xs"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full pro-input px-3 py-2 rounded-xl text-xs"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent 🔥</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assign To Employee</label>
              <SearchableSelect
                options={assigneeOptions}
                value={assignedToId}
                onChange={(val) => setAssignedToId(val)}
                placeholder="Search Assignee"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <SearchableSelect
                options={departmentOptions}
                value={departmentId}
                onChange={(val) => setDepartmentId(val)}
                placeholder="Search Department"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Due Date (Date Picker)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full pro-input px-3.5 py-2 rounded-xl text-xs"
            />
          </div>

          {/* Task File Attachments */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Task File Attachments</label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="bg-white hover:bg-slate-100 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Task Files / Docs</span>
                <input type="file" multiple onChange={handleFileUpload} className="hidden" />
              </label>

              {attachments.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate font-semibold text-slate-800">{att.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Saving...' : taskToEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
