import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import VirtualIdCardModal from './VirtualIdCardModal';
import { LogOut, Shield, Sparkles, Menu, ChevronLeft, Bell, CreditCard } from 'lucide-react';

const Navbar = ({
  currentView,
  setCurrentView,
  openInviteModal,
  openDailyUpdateModal,
  isSidebarCollapsed,
  toggleSidebar,
}) => {
  const { user, company, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 12000); // poll unread count
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/messages/unread-count');
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      // Ignore background fetch error
    }
  };

  const logoSrc = company?.logo_url || '/logo.png';

  return (
    <>
      <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Left section: Sidebar toggle & Company branding */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            {isSidebarCollapsed ? <Menu className="w-5 h-5 text-blue-600" /> : <ChevronLeft className="w-5 h-5 text-blue-600" />}
          </button>

          {/* Company Branding: Logo & Name */}
          <div className="flex items-center space-x-2.5">
            <img
              src={logoSrc}
              alt="Company Logo"
              className="h-8 max-w-[130px] object-contain rounded"
              onError={(e) => {
                e.target.src = '/logo.png';
              }}
            />
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight truncate max-w-[160px] sm:max-w-xs">
                {company?.name || 'TaskBoard'}
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-2 hidden sm:block"></div>

          <h1 className="text-xs font-semibold text-slate-500 capitalize hidden md:block">
            Workspace / <span className="text-blue-600 font-bold">{currentView.replace('-', ' ')}</span>
          </h1>
        </div>

        {/* Right section: Notifications, Virtual ID Card, Quick actions & User profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Virtual Employee ID Card Button */}
          <button
            onClick={() => setIsIdCardOpen(true)}
            title="View My Virtual Employee ID Card"
            className="flex items-center space-x-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs"
          >
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">My ID Card</span>
          </button>

          {/* Red Bell Message Notification */}
          <button
            onClick={() => setCurrentView('messages')}
            title="Workplace Messages & Notifications"
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition relative"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-rose-600 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse border border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Quick Action: Log Daily Update */}
          <button
            onClick={openDailyUpdateModal}
            className="hidden lg:flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Log Daily Update</span>
          </button>

          {/* Quick Action: Invite Employee */}
          {(user?.role === 'admin' || user?.permissions?.includes('manage_team_members')) && (
            <button
              onClick={openInviteModal}
              className="hidden md:flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <span>+ Invite Employee</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          {/* User Badge (Clickable to view ID Card) */}
          <button
            onClick={() => setIsIdCardOpen(true)}
            className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 p-1 pr-3 rounded-full border border-slate-200 text-left transition cursor-pointer"
            title="Click to view Virtual ID Card"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</div>
              <div className="text-[10px] text-blue-600 font-medium capitalize flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5" />
                {user?.role}
              </div>
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Virtual Employee ID Card Modal */}
      <VirtualIdCardModal
        isOpen={isIdCardOpen}
        onClose={() => setIsIdCardOpen(false)}
        targetUser={user}
      />
    </>
  );
};

export default Navbar;
