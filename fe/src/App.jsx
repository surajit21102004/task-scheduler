import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './pages/DashboardView';
import TaskBoardView from './pages/TaskBoardView';
import OrgHierarchyView from './pages/OrgHierarchyView';
import PermissionsMatrixView from './pages/PermissionsMatrixView';
import DailyUpdatesLogView from './pages/DailyUpdatesLogView';
import WorkplaceMessagesView from './pages/WorkplaceMessagesView';
import CompanyProfileView from './pages/CompanyProfileView';
import ReportsView from './pages/ReportsView';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JoinPage from './pages/JoinPage';

import TaskModal from './components/TaskModal';
import TaskDetailModal from './components/TaskDetailModal';
import InviteModal from './components/InviteModal';
import DailyUpdateModal from './components/DailyUpdateModal';
import ChatDrawer from './components/ChatDrawer';

const MainApp = () => {
  const { token, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modal & Drawer states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDailyUpdateModalOpen, setIsDailyUpdateModalOpen] = useState(false);
  const [selectedTaskForChat, setSelectedTaskForChat] = useState(null);

  // Refresh key state for smooth, reload-free UI updates
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  const pathname = window.location.pathname;
  if (pathname === '/join') {
    return <JoinPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token) {
    return authMode === 'login' ? (
      <LoginPage onNavigateRegister={() => setAuthMode('register')} />
    ) : (
      <RegisterPage onNavigateLogin={() => setAuthMode('login')} />
    );
  }

  const openTaskModal = (task = null) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        openInviteModal={() => setIsInviteModalOpen(true)}
        openDailyUpdateModal={() => setIsDailyUpdateModalOpen(true)}
        isSidebarCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex flex-1">
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          openInviteModal={() => setIsInviteModalOpen(true)}
          isCollapsed={isSidebarCollapsed}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
          {currentView === 'dashboard' && (
            <DashboardView
              refreshKey={refreshKey}
              setCurrentView={setCurrentView}
              openDailyUpdateModal={() => setIsDailyUpdateModalOpen(true)}
            />
          )}

          {currentView === 'tasks' && (
            <TaskBoardView
              refreshKey={refreshKey}
              openTaskModal={openTaskModal}
              setSelectedTaskForChat={(task) => setSelectedTaskForChat(task)}
              setSelectedTaskForDetail={(task) => setSelectedTaskForDetail(task)}
            />
          )}

          {currentView === 'my-tasks' && (
            <TaskBoardView
              refreshKey={refreshKey}
              isMyAssignedOnly={true}
              openTaskModal={openTaskModal}
              setSelectedTaskForChat={(task) => setSelectedTaskForChat(task)}
              setSelectedTaskForDetail={(task) => setSelectedTaskForDetail(task)}
            />
          )}

          {currentView === 'reports' && <ReportsView refreshKey={refreshKey} />}

          {currentView === 'hierarchy' && (
            <OrgHierarchyView refreshKey={refreshKey} openInviteModal={() => setIsInviteModalOpen(true)} />
          )}

          {currentView === 'permissions' && <PermissionsMatrixView />}

          {currentView === 'updates' && (
            <DailyUpdatesLogView
              refreshKey={refreshKey}
              openDailyUpdateModal={() => setIsDailyUpdateModalOpen(true)}
            />
          )}

          {currentView === 'messages' && <WorkplaceMessagesView />}

          {currentView === 'company' && <CompanyProfileView />}
        </main>
      </div>

      {/* Modals & Slideover Drawers */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        onSave={triggerRefresh}
      />

      <TaskDetailModal
        isOpen={!!selectedTaskForDetail}
        task={selectedTaskForDetail}
        onClose={() => setSelectedTaskForDetail(null)}
        onTaskUpdated={triggerRefresh}
      />

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      <DailyUpdateModal
        isOpen={isDailyUpdateModalOpen}
        onClose={() => setIsDailyUpdateModalOpen(false)}
        onSubmitted={triggerRefresh}
      />

      <ChatDrawer
        task={selectedTaskForChat}
        onClose={() => setSelectedTaskForChat(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <MainApp />
    </AuthProvider>
  );
}
