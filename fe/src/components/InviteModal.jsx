import React, { useState, useEffect } from 'react';
import api from '../services/api';
import SearchableSelect from './SearchableSelect';
import { X, Mail, Shield, Check, Plus, UserPlus } from 'lucide-react';

const InviteModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee');
  const [positionTitle, setPositionTitle] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [reportingManagerId, setReportingManagerId] = useState('');

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([
    'view_assigned_tasks',
    'update_task_status',
    'submit_daily_updates',
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setResultMessage(null);
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [empRes, compRes, catRes] = await Promise.all([
        api.get('/employees'),
        api.get('/company/profile'),
        api.get('/permissions/catalog'),
      ]);
      setEmployees(empRes.data.employees || []);
      setDepartments(compRes.data.departments || []);
      setPositions(compRes.data.positions || []);
      setCatalog(catRes.data.catalog || []);
    } catch (err) {
      console.error('Failed to load invitation options:', err);
    }
  };

  const handleTogglePerm = (key) => {
    if (selectedPermissions.includes(key)) {
      setSelectedPermissions(selectedPermissions.filter((k) => k !== key));
    } else {
      setSelectedPermissions([...selectedPermissions, key]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    setSubmitting(true);
    setResultMessage(null);

    try {
      // Find matching IDs or send custom strings
      const foundDept = departments.find(
        (d) => d.id === departmentName || d.name.toLowerCase() === departmentName.toLowerCase()
      );
      const foundPos = positions.find(
        (p) => p.id === positionTitle || p.title.toLowerCase() === positionTitle.toLowerCase()
      );

      const res = await api.post('/employees/invite', {
        name: name.trim(),
        email: email.trim(),
        role,
        department_id: foundDept ? foundDept.id : null,
        position_id: foundPos ? foundPos.id : null,
        reporting_manager_id: reportingManagerId || null,
        custom_permissions: selectedPermissions,
      });

      setResultMessage({
        success: true,
        text: res.data.message || 'Invitation sent successfully!',
      });

      setName('');
      setEmail('');
    } catch (err) {
      setResultMessage({
        success: false,
        text: err.response?.data?.error || 'Failed to send employee invitation.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const departmentOptions = departments.map((d) => ({ id: d.id, label: d.name }));
  const positionOptions = positions.map((p) => ({ id: p.id, label: p.title }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-2xl p-6 border border-slate-200 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 mb-1">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Invite Employee via Email</h3>
            <p className="text-xs text-slate-500">
              Send Nodemailer email invitation & configure initial permissions.
            </p>
          </div>
        </div>

        {resultMessage && (
          <div
            className={`p-3 rounded-xl text-xs my-3 font-semibold ${
              resultMessage.success
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {resultMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Employee Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pro-input px-3.5 py-2 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="john@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pro-input px-3.5 py-2 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Position / Title</label>
              <SearchableSelect
                options={positionOptions}
                value={positionTitle}
                onChange={(val) => setPositionTitle(val)}
                placeholder="Select / Search Position"
                allowCustom={true}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <SearchableSelect
                options={departmentOptions}
                value={departmentName}
                onChange={(val) => setDepartmentName(val)}
                placeholder="Select / Search Department"
                allowCustom={true}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Reporting Manager</label>
              <select
                value={reportingManagerId}
                onChange={(e) => setReportingManagerId(e.target.value)}
                className="w-full pro-input px-3 py-2 rounded-xl text-xs"
              >
                <option value="">None (Top Level)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.position?.title || emp.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">System Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full pro-input px-3 py-2 rounded-xl text-xs"
            >
              <option value="employee">Employee</option>
              <option value="tl">Team Lead (TL)</option>
              <option value="manager">Manager</option>
              <option value="admin">Company Admin</option>
            </select>
          </div>

          {/* Granular Permission Selection */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Shield className="w-4 h-4 text-blue-600" />
                Granular Permissions Selection
              </label>
              <span className="text-[11px] text-blue-600 font-semibold">
                {selectedPermissions.length} selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 bg-white p-2.5 rounded-lg border border-slate-200">
              {catalog.map((perm) => {
                const isChecked = selectedPermissions.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    className={`flex items-start space-x-2 p-2 rounded-lg cursor-pointer transition border ${
                      isChecked
                        ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-medium'
                        : 'hover:bg-slate-50 border-transparent text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePerm(perm.key)}
                      className="mt-0.5 accent-blue-600 rounded"
                    />
                    <div className="text-[11px]">
                      <div className="font-bold leading-tight">{perm.label}</div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{perm.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Sending Email...' : 'Send Invitation Mail'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;
