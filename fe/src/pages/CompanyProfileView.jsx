import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Building, Upload, Save, Plus, Layers, Award, CheckCircle2, Shield } from 'lucide-react';

const CompanyProfileView = () => {
  const { user, company, setCompany } = useAuth();
  const [profile, setProfile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit form state
  const [name, setName] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Department & Position form state
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [newPosTitle, setNewPosTitle] = useState('');
  const [newPosLevel, setNewPosLevel] = useState('1');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/company/profile');
      setProfile(res.data.company);
      setName(res.data.company?.name || '');
      setLogoPreview(res.data.company?.logo_url || '/logo.png');
      setDepartments(res.data.departments || []);
      setPositions(res.data.positions || []);
    } catch (err) {
      console.error('Failed to load company profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Image File Uploader handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await api.put('/company/profile', {
        name: name.trim(),
        logo_url: logoPreview,
      });

      setProfile(res.data.company);
      if (setCompany) setCompany(res.data.company);
      setMessage('✅ Company details updated successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update company.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    try {
      const res = await api.post('/company/departments', {
        name: newDeptName.trim(),
        description: newDeptDesc.trim(),
      });
      setDepartments((prev) => [...prev, res.data.department]);
      setNewDeptName('');
      setNewDeptDesc('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create department.');
    }
  };

  const handleCreatePosition = async (e) => {
    e.preventDefault();
    if (!newPosTitle.trim()) return;
    try {
      const res = await api.post('/company/positions', {
        title: newPosTitle.trim(),
        level: parseInt(newPosLevel),
      });
      setPositions((prev) => [...prev, res.data.position]);
      setNewPosTitle('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create position.');
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
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            Company Profile & Structure Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company branding, upload company logo, and configure departments & positions.
          </p>
        </div>

        {message && (
          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Edit Company Profile & Logo Upload */}
        <div className="pro-card p-6 space-y-5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            Company Details
          </h3>

          <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
            {/* Logo Preview & Upload */}
            <div>
              <label className="block font-bold text-slate-700 mb-2">Company Logo</label>
              <div className="flex items-center space-x-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-14 h-14 object-contain rounded-lg border border-slate-200 bg-white p-1" />
                ) : (
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 font-bold text-lg rounded-lg flex items-center justify-center border border-blue-200">
                    CO
                  </div>
                )}
                <div>
                  <label className="bg-white hover:bg-slate-100 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image File</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">PNG, JPG or WebP (Max 5MB)</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pro-input px-3.5 py-2 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Company Email</label>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full bg-slate-100 border border-slate-200 text-slate-500 px-3.5 py-2 rounded-xl text-xs font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Company System ID</label>
              <input
                type="text"
                disabled
                value={profile?.id || ''}
                className="w-full bg-slate-100 border border-slate-200 text-slate-500 px-3.5 py-2 rounded-xl text-xs font-mono cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Company Profile'}</span>
            </button>
          </form>
        </div>

        {/* Right 2 Columns: Departments & Positions Setup */}
        <div className="lg:col-span-2 space-y-6">
          {/* Departments Card */}
          <div className="pro-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Departments Management ({departments.length})
            </h3>

            {/* Create Dept Form */}
            <form onSubmit={handleCreateDepartment} className="flex gap-2 text-xs">
              <input
                type="text"
                required
                placeholder="New Department Name (e.g. Finance)"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="flex-1 pro-input px-3 py-2 rounded-xl text-xs"
              />
              <input
                type="text"
                placeholder="Description"
                value={newDeptDesc}
                onChange={(e) => setNewDeptDesc(e.target.value)}
                className="flex-1 pro-input px-3 py-2 rounded-xl text-xs"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shrink-0 flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Dept</span>
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
              {departments.map((dept) => (
                <div key={dept.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                  <div className="font-bold text-slate-800 text-xs">{dept.name}</div>
                  <div className="text-[10px] text-slate-500">{dept.description || 'No description provided'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Positions Card */}
          <div className="pro-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              Positions & Title Titles ({positions.length})
            </h3>

            {/* Create Position Form */}
            <form onSubmit={handleCreatePosition} className="flex gap-2 text-xs">
              <input
                type="text"
                required
                placeholder="New Position Title (e.g. Senior Tech Lead)"
                value={newPosTitle}
                onChange={(e) => setNewPosTitle(e.target.value)}
                className="flex-1 pro-input px-3 py-2 rounded-xl text-xs"
              />
              <select
                value={newPosLevel}
                onChange={(e) => setNewPosLevel(e.target.value)}
                className="pro-input px-3 py-2 rounded-xl text-xs"
              >
                <option value="1">Level 1 (Executive/Manager)</option>
                <option value="2">Level 2 (Team Lead)</option>
                <option value="3">Level 3 (Senior Staff)</option>
                <option value="4">Level 4 (Member)</option>
              </select>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shrink-0 flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Title</span>
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
              {positions.map((pos) => (
                <div key={pos.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                  <div className="font-bold text-slate-800 text-xs">{pos.title}</div>
                  <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    Level {pos.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfileView;
