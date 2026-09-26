import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Building,
  Mail,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const DashboardView = ({ setCurrentView, openDailyUpdateModal, refreshKey }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardSummary();
  }, [refreshKey]);

  const fetchDashboardSummary = async () => {
    try {
      const res = await api.get('/dashboard/summary');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { summary, recentUpdates } = data || {
    summary: { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, urgentTasks: 0, activeEmployees: 0, totalDepartments: 0, pendingInvitations: 0, completionRate: 0 },
    recentUpdates: [],
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <h2 className="text-2xl font-bold">
              Welcome back, <span className="text-blue-100">{user?.name}</span> 👋
            </h2>
            <p className="text-xs text-blue-100 mt-1 font-medium">
              Here is your company task overview and team performance summary.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('tasks')}
              className="bg-white hover:bg-slate-50 text-blue-700 text-xs px-4 py-2 rounded-xl font-bold shadow-sm flex items-center space-x-1.5 transition"
            >
              <span>View Task Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={openDailyUpdateModal}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3.5 py-2 rounded-xl font-bold flex items-center space-x-1.5 shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Log Today's Work</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks Card */}
        <div className="pro-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tasks</span>
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{summary.totalTasks}</span>
            <span className="text-xs font-bold text-emerald-600">{summary.completionRate}% Done</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${summary.completionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Completed Tasks Card */}
        <div className="pro-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</span>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-emerald-600">{summary.completedTasks}</span>
            <span className="text-xs text-slate-500 font-medium">tasks finished</span>
          </div>
        </div>

        {/* In Progress Card */}
        <div className="pro-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Progress</span>
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-blue-600">{summary.inProgressTasks}</span>
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {summary.urgentTasks} High Priority
            </span>
          </div>
        </div>

        {/* Active Team Members */}
        <div className="pro-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team Size</span>
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{summary.activeEmployees}</span>
            <span className="text-xs text-slate-500 font-medium">{summary.totalDepartments} Departments</span>
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Daily Updates */}
        <div className="lg:col-span-2 pro-card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Recent Daily Work Logs
            </h3>
            <button
              onClick={() => setCurrentView('updates')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold transition"
            >
              View All Updates →
            </button>
          </div>

          {recentUpdates.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
              <p className="text-xs text-slate-400">No daily updates logged yet today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentUpdates.map((up) => (
                <div key={up.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {up.employee?.name ? up.employee.name.substring(0, 2).toUpperCase() : 'EMP'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{up.employee?.name}</h4>
                      <span className="text-[10px] text-slate-400 font-medium">{up.update_date}</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{up.summary}</p>
                    {up.hours_spent > 0 && (
                      <span className="inline-block mt-1.5 text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        ⏱️ {up.hours_spent} Hours Logged
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Quick Company Details */}
        <div className="space-y-4">
          <div className="pro-card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              Company Workspace Info
            </h3>
            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Company Name</span>
                <span className="font-bold text-slate-900">{user?.company_name || 'My Company'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Departments</span>
                <span className="font-bold text-slate-900">{summary.totalDepartments} Active</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Pending Invitations</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {summary.pendingInvitations} Pending
                </span>
              </div>
            </div>
          </div>

          {/* Hierarchy Promo Card */}
          <div className="pro-card p-5 bg-blue-50/50 border border-blue-200">
            <h4 className="text-xs font-bold text-blue-900 mb-1">Employee Hierarchy Tree</h4>
            <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
              Explore your organization reporting structure from Managers down to Team Leads and Employees.
            </p>
            <button
              onClick={() => setCurrentView('hierarchy')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded-xl font-bold transition shadow-xs"
            >
              Open Org Tree
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
