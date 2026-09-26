import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, ArrowRight, Building } from 'lucide-react';

const RegisterPage = ({ onNavigateLogin }) => {
  const { registerCompany } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCompanyLogo(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerCompany({
        company_name: companyName.trim(),
        company_email: companyEmail.trim(),
        company_logo: companyLogo || null,
        admin_name: adminName.trim(),
        admin_email: adminEmail.trim(),
        password,
      });
    } catch (err) {
      const rawErr = err.response?.data?.error || err.response?.data?.message || err.message;
      const displayErr = typeof rawErr === 'string' ? rawErr : (rawErr?.message || 'Registration failed. Please check inputs.');
      setError(displayErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-white w-full max-w-xl rounded-3xl p-8 border border-slate-200 shadow-xl relative z-10">
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="TaskBoard Logo"
            className="h-12 w-auto mx-auto mb-2 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <h2 className="text-2xl font-bold text-slate-900">Register Your Company</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Set up your company workspace & admin account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Company Details Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="font-bold text-blue-700 uppercase tracking-wider text-[10px]">1. Company Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Acme Corporation"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pro-input px-3.5 py-2 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Email *</label>
                <input
                  type="email"
                  required
                  placeholder="contact@acme.com"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="w-full pro-input px-3.5 py-2 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Logo Image File Upload */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company Logo (File Upload)</label>
              <div className="flex items-center space-x-3 p-2 bg-white border border-slate-200 rounded-xl">
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo preview" className="w-10 h-10 object-contain rounded border border-slate-200 p-0.5" />
                ) : (
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 font-bold text-xs rounded flex items-center justify-center border border-blue-200">
                    CO
                  </div>
                )}
                <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer inline-flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Choose Logo File</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Admin Credentials Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="font-bold text-blue-700 uppercase tracking-wider text-[10px]">2. Company Admin Account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Admin Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Sarah Connor"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full pro-input px-3.5 py-2 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Admin Email *</label>
                <input
                  type="email"
                  required
                  placeholder="sarah@acme.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pro-input px-3.5 py-2 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password (Min 8 Chars) *</label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pro-input px-3.5 py-2 rounded-xl text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <span>{loading ? 'Creating Company...' : 'Create Company Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Already registered?{' '}
            <button
              onClick={onNavigateLogin}
              className="text-blue-600 hover:text-blue-700 font-bold transition"
            >
              Sign In Here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
