import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Save, CheckCircle2 } from 'lucide-react';

const PermissionsMatrixView = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeePermissions, setEmployeePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, catRes] = await Promise.all([
        api.get('/employees'),
        api.get('/permissions/catalog'),
      ]);

      const emps = empRes.data.employees || [];
      setEmployees(emps);
      setCatalog(catRes.data.catalog || []);

      if (emps.length > 0) {
        setSelectedEmployee(emps[0]);
        setEmployeePermissions(emps[0].permissions || []);
      }
    } catch (err) {
      console.error('Failed to load permission matrix data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setEmployeePermissions(emp.permissions || []);
    setMessage('');
  };

  const handleTogglePermission = (key) => {
    if (employeePermissions.includes(key)) {
      setEmployeePermissions(employeePermissions.filter((k) => k !== key));
    } else {
      setEmployeePermissions([...employeePermissions, key]);
    }
  };

  const handleApplyPreset = (presetType) => {
    if (presetType === 'default') {
      setEmployeePermissions(['view_assigned_tasks', 'update_task_status', 'submit_daily_updates']);
    } else if (presetType === 'manager') {
      setEmployeePermissions([
        'view_assigned_tasks',
        'update_task_status',
        'submit_daily_updates',
        'view_subordinate_tasks',
        'view_daily_updates',
        'create_task',
        'assign_task',
        'send_messages',
        'view_employee_details',
      ]);
    } else if (presetType === 'admin') {
      setEmployeePermissions(catalog.map((c) => c.key));
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    setMessage('');
    try {
      await api.put('/permissions/update', {
        employee_id: selectedEmployee.id,
        permissions: employeePermissions,
      });

      setEmployees((prev) =>
        prev.map((e) => (e.id === selectedEmployee.id ? { ...e, permissions: employeePermissions } : e))
      );

      setMessage(`✅ Permissions updated for ${selectedEmployee.name}!`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update permissions.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Admin Panel & Granular Permissions Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure feature permissions for managers, team leads, and employees.
          </p>
        </div>

        {message && (
          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl">
            {message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Employee Selector */}
        <div className="pro-card p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Employee</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {employees.map((emp) => {
              const isSelected = selectedEmployee?.id === emp.id;
              return (
                <button
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp)}
                  className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'hover:bg-slate-50 border border-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center ${isSelected ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}>
                      {emp.name ? emp.name.substring(0, 2).toUpperCase() : 'EM'}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{emp.name}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        {emp.position?.title || emp.role} • {emp.department?.name || 'General'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${isSelected ? 'bg-blue-800 text-white' : 'bg-slate-100 text-blue-700'}`}>
                    {emp.permissions?.length || 0} Perms
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Permission Matrix */}
        <div className="lg:col-span-2 pro-card p-6 space-y-5">
          {selectedEmployee ? (
            <>
              {/* Header Info & Preset Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Permissions for:</span>
                    <span className="text-blue-600">{selectedEmployee.name}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Role: <span className="capitalize text-slate-800 font-bold">{selectedEmployee.role}</span>
                  </p>
                </div>

                {/* Preset Options */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleApplyPreset('default')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] px-2.5 py-1 rounded-lg font-bold transition"
                  >
                    Default Employee
                  </button>
                  <button
                    onClick={() => handleApplyPreset('manager')}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] px-2.5 py-1 rounded-lg font-bold transition"
                  >
                    Manager Preset
                  </button>
                  <button
                    onClick={() => handleApplyPreset('admin')}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] px-2.5 py-1 rounded-lg font-bold transition"
                  >
                    All Access
                  </button>
                </div>
              </div>

              {/* Matrix Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-1">
                {catalog.map((perm) => {
                  const isChecked = employeePermissions.includes(perm.key);
                  return (
                    <div
                      key={perm.key}
                      onClick={() => handleTogglePermission(perm.key)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start space-x-3 ${
                        isChecked
                          ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-500 opacity-80'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 accent-blue-600 rounded cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{perm.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{perm.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleSavePermissions}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-6 py-2.5 rounded-xl font-bold shadow-xs flex items-center space-x-2 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Permissions'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-400">Select an employee from the left panel.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionsMatrixView;
