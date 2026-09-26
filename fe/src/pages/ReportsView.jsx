import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { BarChart3, Trophy, Search, CheckCircle2, Clock, Users, PieChart as PieIcon, Award } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#64748b'];

const ReportsView = ({ refreshKey }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchReports();
  }, [refreshKey]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/reports');
      setReports(res.data.reports || []);
    } catch (err) {
      console.error('Failed to load performance reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(
    (rep) =>
      rep.name.toLowerCase().includes(search.toLowerCase()) ||
      rep.department.toLowerCase().includes(search.toLowerCase())
  );

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold shadow-2xs';
      case 2:
        return 'bg-slate-200 text-slate-800 border-slate-300 font-bold';
      case 3:
        return 'bg-orange-100 text-orange-800 border-orange-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200 font-semibold';
    }
  };

  // Aggregate stats for Pie & Bar charts
  const totalCompleted = reports.reduce((acc, r) => acc + (r.completed || 0), 0);
  const totalInProgress = reports.reduce((acc, r) => acc + (r.inProgress || 0), 0);
  const totalReview = reports.reduce((acc, r) => acc + (r.review || 0), 0);
  const totalTodo = reports.reduce((acc, r) => acc + (r.todo || 0), 0);

  const pieData = [
    { name: 'Completed', value: totalCompleted },
    { name: 'In Progress', value: totalInProgress },
    { name: 'Under Review', value: totalReview },
    { name: 'To Do', value: totalTodo },
  ].filter((d) => d.value > 0);

  const barData = reports.slice(0, 7).map((r) => ({
    name: r.name.split(' ')[0],
    Completed: r.completed,
    InProgress: r.inProgress,
    Hours: r.totalHours,
  }));

  const topPerformer = reports.length > 0 ? reports[0] : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Rank-wise Employee Performance & Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Executive visual metrics: Pie chart task distribution, completion rates, and rank leaderboard.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search employee or dept..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pro-input pl-9 pr-3 py-1.5 rounded-xl text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="pro-card p-4 flex items-center space-x-3 bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-200">
              <div className="p-3 bg-amber-500 text-white rounded-xl shadow-xs">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Top Performer #1</span>
                <h4 className="text-sm font-extrabold text-slate-900 truncate max-w-[140px]">{topPerformer?.name || 'N/A'}</h4>
                <p className="text-[10px] text-amber-700 font-semibold">{topPerformer ? `${topPerformer.completed} tasks completed` : 'No data'}</p>
              </div>
            </div>

            <div className="pro-card p-4 flex items-center space-x-3">
              <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Completed</span>
                <h4 className="text-base font-extrabold text-slate-900">{totalCompleted} Tasks</h4>
                <p className="text-[10px] text-emerald-600 font-semibold">Across all company departments</p>
              </div>
            </div>

            <div className="pro-card p-4 flex items-center space-x-3">
              <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Work Logged</span>
                <h4 className="text-base font-extrabold text-slate-900">{reports.reduce((acc, r) => acc + (r.totalHours || 0), 0)} Hours</h4>
                <p className="text-[10px] text-blue-600 font-semibold">Verified daily work logs</p>
              </div>
            </div>

            <div className="pro-card p-4 flex items-center space-x-3">
              <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Employees</span>
                <h4 className="text-base font-extrabold text-slate-900">{reports.length} Members</h4>
                <p className="text-[10px] text-indigo-600 font-semibold">Ranked by execution speed</p>
              </div>
            </div>
          </div>

          {/* Graphical Pie & Bar Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Pie Chart: Task Status Distribution */}
            <div className="pro-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-emerald-600" />
                  Overall Task Execution Distribution (Pie Chart)
                </h3>
              </div>

              {pieData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400 text-xs italic">
                  No task data available to render Pie Chart.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Bar Chart: Completed Tasks per Employee */}
            <div className="pro-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  Top Performers Task Solved & Logged Hours (Bar Chart)
                </h3>
              </div>

              {barData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400 text-xs italic">
                  No performer data available.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="InProgress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Rank-wise Leaderboard Table */}
          <div className="pro-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>Rank-Wise Employee Performance Leaderboard</span>
              <span className="text-[11px] font-normal text-slate-500">Sorted by completed tasks & completion rate</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4 text-center">Rank</th>
                    <th className="p-4">Employee Name</th>
                    <th className="p-4">Department</th>
                    <th className="p-4 text-center">Assigned Tasks</th>
                    <th className="p-4 text-center">Completed</th>
                    <th className="p-4 text-center">In Progress</th>
                    <th className="p-4 text-center">Completion Rate</th>
                    <th className="p-4 text-center">Logged Hours</th>
                    <th className="p-4 text-center">Approved Logs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs border ${getRankBadge(rep.rank)}`}>
                          {rep.rank === 1 ? '🥇 #1' : rep.rank === 2 ? '🥈 #2' : rep.rank === 3 ? '🥉 #3' : `#${rep.rank}`}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{rep.name}</div>
                        <div className="text-[10px] text-slate-400">{rep.position} • {rep.email}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{rep.department}</td>
                      <td className="p-4 text-center font-bold text-slate-900">{rep.totalAssigned}</td>
                      <td className="p-4 text-center font-bold text-emerald-600">{rep.completed}</td>
                      <td className="p-4 text-center font-bold text-blue-600">{rep.inProgress}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="font-bold text-slate-900">{rep.completionRate}%</span>
                          <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${rep.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold text-blue-700">⏱️ {rep.totalHours} hrs</td>
                      <td className="p-4 text-center">
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                          {rep.approvedUpdates} Approved
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsView;
