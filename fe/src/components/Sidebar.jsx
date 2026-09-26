import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Kanban,
  Network,
  ShieldCheck,
  Clock,
  MessageSquare,
  Building,
  UserPlus,
  Layers,
  BarChart3,
  CheckSquare,
} from 'lucide-react';

const Sidebar = ({ currentView, setCurrentView, openInviteModal, isCollapsed }) => {
  const { user, hasPermission } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      id: 'tasks',
      label: 'Task Board',
      icon: Kanban,
      show: true,
    },
    {
      id: 'my-tasks',
      label: 'My Assigned Tasks',
      icon: CheckSquare,
      show: true,
    },
    {
      id: 'reports',
      label: 'Performance & Reports',
      icon: BarChart3,
      show: user?.role === 'admin' || user?.role === 'manager' || hasPermission('view_subordinate_tasks'),
    },
    {
      id: 'hierarchy',
      label: 'Employee Hierarchy',
      icon: Network,
      show: hasPermission('view_employee_details') || user?.role === 'admin',
    },
    {
      id: 'permissions',
      label: 'Roles & Permissions',
      icon: ShieldCheck,
      show: hasPermission('manage_permissions') || user?.role === 'admin',
    },
    {
      id: 'updates',
      label: 'Daily Work Updates',
      icon: Clock,
      show: true,
    },
    {
      id: 'messages',
      label: 'Workplace Messages',
      icon: MessageSquare,
      show: hasPermission('send_messages') || user?.role === 'admin',
    },
    {
      id: 'company',
      label: 'Company Profile',
      icon: Building,
      show: user?.role === 'admin',
    },
  ];

  return (
    <aside
      className={`border-r border-slate-200 bg-white flex flex-col justify-between p-3 hidden md:flex transition-all duration-300 min-h-[calc(100vh-4rem)] ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="space-y-6">
        <div>
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Main Navigation
            </p>
          )}
          <nav className="space-y-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    title={isCollapsed ? item.label : ''}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-0 py-3' : 'space-x-3 px-3.5 py-2.5'
                    } rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
          </nav>
        </div>

        {!isCollapsed && (user?.role === 'admin' || hasPermission('manage_team_members')) && (
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 relative overflow-hidden">
            <h4 className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              Grow Your Team
            </h4>
            <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
              Invite managers, TLs, and employees via email with custom permissions.
            </p>
            <button
              onClick={openInviteModal}
              className="w-full bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 text-xs py-1.5 rounded-lg font-bold transition shadow-2xs"
            >
              Send Invitation
            </button>
          </div>
        )}
      </div>

      <div className={`pt-3 border-t border-slate-100 ${isCollapsed ? 'text-center' : ''}`}>
        <div className="flex items-center space-x-2 text-[11px] text-slate-400 justify-center">
          <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {!isCollapsed && <span className="font-medium">TaskBoard v1.0</span>}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
