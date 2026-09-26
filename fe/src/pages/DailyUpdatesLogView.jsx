import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Clock, Plus, AlertTriangle, Calendar, Sparkles, CheckCircle2, XCircle, Edit3 } from 'lucide-react';

const DailyUpdatesLogView = ({ openDailyUpdateModal, refreshKey }) => {
  const { user, hasPermission } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];
  const [dateFilterMode, setDateFilterMode] = useState('all'); // 'all' | 'today' | 'custom'
  const [selectedDate, setSelectedDate] = useState('');
  const [editingUpdate, setEditingUpdate] = useState(null);

  // Edit modal state
  const [editSummary, setEditSummary] = useState('');
  const [editHours, setEditHours] = useState('');
  const [editBlockers, setEditBlockers] = useState('');

  useEffect(() => {
    fetchUpdates();
  }, [dateFilterMode, selectedDate, refreshKey]);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFilterMode === 'today') {
        params.date = todayStr;
      } else if (dateFilterMode === 'custom' && selectedDate) {
        params.date = selectedDate;
      }

      const res = await api.get('/updates', { params });
      setUpdates(res.data.updates || []);
    } catch (err) {
      console.error('Failed to load daily updates log:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id, newStatus) => {
    try {
      const res = await api.patch(`/updates/${id}/approval`, { status: newStatus });
      setUpdates((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: newStatus, approver: { name: user.name } } : u))
      );
      toast.success(`Daily update log ${newStatus}!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update approval status.');
    }
  };

  const openEditModal = (up) => {
    setEditingUpdate(up);
    setEditSummary(up.summary || '');
    setEditHours(up.hours_spent || '');
    setEditBlockers(up.blockers || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUpdate) return;
    try {
      const res = await api.put(`/updates/${editingUpdate.id}`, {
        summary: editSummary.trim(),
        hours_spent: editHours,
        blockers: editBlockers.trim(),
      });
      setUpdates((prev) =>
        prev.map((u) => (u.id === editingUpdate.id ? { ...u, summary: editSummary, hours_spent: editHours, blockers: editBlockers } : u))
      );
      setEditingUpdate(null);
      toast.success('Daily update edited successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to edit daily update.');
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const canApprove = user?.role === 'admin' || user?.role === 'manager' || hasPermission('view_subordinate_tasks');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Daily Work Updates & Manager Approvals
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review, approve, and track daily work logs submitted across your company.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Date Filter Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setDateFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateFilterMode === 'all' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDateFilterMode('today')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateFilterMode === 'today' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilterMode('custom')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateFilterMode === 'custom' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom Date
            </button>
          </div>

          {dateFilterMode === 'custom' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pro-input px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700"
            />
          )}

          <button
            onClick={openDailyUpdateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-xl font-bold shadow-xs flex items-center space-x-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Submit Update</span>
          </button>
        </div>
      </div>

      {/* Log Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : updates.length === 0 ? (
        <div className="pro-card p-12 text-center">
          <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-500">No daily updates found for the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <div key={update.id} className="pro-card p-5 space-y-3 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {update.employee?.name ? update.employee.name.substring(0, 2).toUpperCase() : 'EM'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{update.employee?.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {update.employee?.position?.title || 'Team Member'} • {update.employee?.department?.name || 'General'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-[11px]">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold border uppercase text-[10px] ${getStatusBadge(update.status)}`}>
                    {update.status || 'pending'}
                  </span>
                  <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-semibold flex items-center gap-1 border border-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    {update.update_date}
                  </span>
                  {update.hours_spent > 0 && (
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg font-bold">
                      ⏱️ {update.hours_spent} Hours
                    </span>
                  )}
                </div>
              </div>

              {/* Task Reference */}
              {update.task && (
                <div className="text-[11px] font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 inline-block">
                  Task: {update.task.title}
                </div>
              )}

              {/* Summary */}
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">{update.summary}</p>

              {/* Blockers */}
              {update.blockers && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start space-x-2 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <span className="font-bold">Blockers Encountered:</span>
                    <p className="mt-0.5">{update.blockers}</p>
                  </div>
                </div>
              )}

              {/* Approval & Edit Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div className="text-[11px] text-slate-500">
                  {update.approver ? (
                    <span className="text-emerald-600 font-bold">Approved by {update.approver.name}</span>
                  ) : update.status === 'rejected' ? (
                    <span className="text-rose-600 font-bold">Rejected</span>
                  ) : (
                    <span className="text-amber-600 font-semibold">Pending Approval</span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {/* Edit Button */}
                  {(user?.role === 'admin' || update.employee_id === user?.id) && (
                    <button
                      onClick={() => openEditModal(update)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] flex items-center gap-1 border border-slate-200"
                    >
                      <Edit3 className="w-3 h-3 text-slate-600" />
                      <span>Edit Log</span>
                    </button>
                  )}

                  {/* Approve / Reject Buttons for Admin & Managers */}
                  {canApprove && (
                    <>
                      <button
                        onClick={() => handleApproval(update.id, 'approved')}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] flex items-center gap-1 border border-emerald-200 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleApproval(update.id, 'rejected')}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] flex items-center gap-1 border border-rose-200 shadow-2xs"
                      >
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setEditingUpdate(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              ✕
            </button>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Edit Daily Work Log</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hours Logged</label>
                <input
                  type="number"
                  step="0.5"
                  value={editHours}
                  onChange={(e) => setEditHours(e.target.value)}
                  className="w-full pro-input px-3 py-2 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Summary *</label>
                <textarea
                  rows={4}
                  required
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full pro-input px-3 py-2 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Blockers</label>
                <textarea
                  rows={2}
                  value={editBlockers}
                  onChange={(e) => setEditBlockers(e.target.value)}
                  className="w-full pro-input px-3 py-2 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingUpdate(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyUpdatesLogView;
