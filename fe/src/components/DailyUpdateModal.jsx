import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, Sparkles } from 'lucide-react';

import toast from 'react-hot-toast';

const DailyUpdateModal = ({ isOpen, onClose, onSubmitted }) => {
  const [taskId, setTaskId] = useState('');
  const [updateDate, setUpdateDate] = useState(new Date().toISOString().split('T')[0]);
  const [hoursSpent, setHoursSpent] = useState('');
  const [summary, setSummary] = useState('');
  const [blockers, setBlockers] = useState('');

  const [tasks, setTasks] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserTasks();
    }
  }, [isOpen]);

  const fetchUserTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Failed to load user tasks:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!summary.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/updates', {
        task_id: taskId || null,
        update_date: updateDate,
        hours_spent: hoursSpent ? parseFloat(hoursSpent) : 0,
        summary: summary.trim(),
        blockers: blockers.trim() || null,
      });

      toast.success('Daily update log submitted successfully!');
      if (onSubmitted) onSubmitted();
      onClose();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit daily update.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTaskId('');
    setHoursSpent('');
    setSummary('');
    setBlockers('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-slate-200 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          Submit Daily Work Update
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Record your daily achievements, hours worked, and any blockers.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Related Task</label>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full pro-input px-3 py-2 rounded-xl text-xs"
              >
                <option value="">General Work (No Task)</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date & Hours Spent</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={updateDate}
                  onChange={(e) => setUpdateDate(e.target.value)}
                  className="w-full pro-input px-2.5 py-2 rounded-xl text-xs"
                />
                <input
                  type="number"
                  step="0.5"
                  placeholder="Hours"
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(e.target.value)}
                  className="w-20 pro-input px-2.5 py-2 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Work Summary *</label>
            <textarea
              rows={4}
              required
              placeholder="What did you complete today? (e.g. Implemented auth logic, fixed issue #12)..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full pro-input px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Blockers / Challenges (Optional)</label>
            <textarea
              rows={2}
              placeholder="Any issues blocking your progress?..."
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              className="w-full pro-input px-3.5 py-2 rounded-xl text-xs"
            />
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyUpdateModal;
