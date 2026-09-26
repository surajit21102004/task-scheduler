import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import VirtualIdCardModal from '../components/VirtualIdCardModal';
import { Network, Users, ChevronDown, ChevronRight, UserPlus, Building, Shield, CreditCard } from 'lucide-react';

const OrgHierarchyView = ({ openInviteModal }) => {
  const { user, hasPermission } = useAuth();
  const [hierarchy, setHierarchy] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tree');
  const [selectedIdCardUser, setSelectedIdCardUser] = useState(null);

  useEffect(() => {
    fetchHierarchyData();
  }, []);

  const fetchHierarchyData = async () => {
    setLoading(true);
    try {
      const [treeRes, empRes] = await Promise.all([
        api.get('/employees/hierarchy'),
        api.get('/employees'),
      ]);
      setHierarchy(treeRes.data.hierarchy || []);
      setEmployees(empRes.data.employees || []);
    } catch (err) {
      console.error('Failed to load hierarchy data:', err);
    } finally {
      setLoading(false);
    }
  };

  const TreeNode = ({ node }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.subordinates && node.subordinates.length > 0;

    return (
      <div className="flex flex-col items-center my-3 relative">
        {/* Node Card */}
        <div
          onClick={() => setSelectedIdCardUser(node)}
          className="pro-card p-4 w-64 border border-slate-200 shadow-sm relative group bg-white cursor-pointer hover:border-blue-300 transition"
          title="Click to view Virtual ID Card"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                {node.name ? node.name.substring(0, 2).toUpperCase() : 'EM'}
              </div>
              <div className="truncate">
                <h4 className="text-xs font-bold text-slate-900 truncate">{node.name}</h4>
                <p className="text-[10px] text-blue-600 font-bold truncate">
                  {node.position?.title || node.role.toUpperCase()}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{node.department?.name || 'General'}</p>
              </div>
            </div>

            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="p-1 text-slate-400 hover:text-slate-800 transition shrink-0"
              >
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Subordinates */}
        {hasChildren && expanded && (
          <div className="flex flex-col items-center mt-4 w-full">
            <div className="w-0.5 h-6 bg-blue-300"></div>

            <div className="flex flex-wrap justify-center gap-6 pt-2 border-t-2 border-blue-300 relative">
              {node.subordinates.map((child) => (
                <TreeNode key={child.id} node={child} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-600" />
            Company Organizational Hierarchy
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Flexible reporting structure & employee hierarchy. Click any employee to inspect their Virtual ID Card.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('tree')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'tree' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Org Tree View
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'directory' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Employee Directory
            </button>
          </div>

          {(user?.role === 'admin' || hasPermission('manage_team_members')) && (
            <button
              onClick={openInviteModal}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Employee</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeTab === 'tree' ? (
        <div className="pro-card p-8 overflow-x-auto min-h-[500px] flex justify-center bg-slate-50/50">
          {hierarchy.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Building className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-medium">No active hierarchy trees found. Invite employees to build your org chart.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* Root Company Node */}
              <div className="bg-blue-600 text-white p-4 rounded-2xl font-bold text-sm shadow-md flex items-center space-x-2 mb-4 border border-blue-500">
                <Building className="w-5 h-5 text-blue-100" />
                <span>{user?.company_name || 'Company Head Office'}</span>
              </div>

              <div className="w-0.5 h-6 bg-blue-300"></div>

              <div className="flex flex-wrap justify-center gap-8 border-t-2 border-blue-300 pt-4">
                {hierarchy.map((rootNode) => (
                  <TreeNode key={rootNode.id} node={rootNode} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="pro-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Employee Name</th>
                <th className="p-4">Department</th>
                <th className="p-4">Position</th>
                <th className="p-4">Reporting Manager</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      {emp.name ? emp.name.substring(0, 2).toUpperCase() : 'EM'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{emp.name}</div>
                      <div className="text-[11px] text-slate-500">{emp.email}</div>
                    </div>
                  </td>
                  <td className="p-4 font-medium">{emp.department?.name || 'General'}</td>
                  <td className="p-4 font-bold text-blue-600">{emp.position?.title || 'Team Member'}</td>
                  <td className="p-4 text-slate-500">
                    {emp.reporting_manager ? emp.reporting_manager.name : '— Root —'}
                  </td>
                  <td className="p-4 capitalize">
                    <span className="bg-blue-50 px-2 py-0.5 rounded text-[10px] font-bold text-blue-700 border border-blue-200">
                      {emp.role}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedIdCardUser(emp)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs flex items-center gap-1 mx-auto border border-blue-200 transition"
                      title="View Virtual Employee ID Pass"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      <span>ID Pass</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Virtual ID Card Modal */}
      <VirtualIdCardModal
        isOpen={!!selectedIdCardUser}
        onClose={() => setSelectedIdCardUser(null)}
        targetUser={selectedIdCardUser}
      />
    </div>
  );
};

export default OrgHierarchyView;
