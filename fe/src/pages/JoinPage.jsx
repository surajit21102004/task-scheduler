import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mail, AlertTriangle } from 'lucide-react';

const JoinPage = () => {
  const { acceptInvitation } = useAuth();
  const [token, setToken] = useState('');
  const [invitation, setInvitation] = useState(null);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tok = urlParams.get('token');
    if (tok) {
      setToken(tok);
      fetchInvitation(tok);
    } else {
      setError('Invalid invitation link. Token parameter missing.');
      setLoading(false);
    }
  }, []);

  const fetchInvitation = async (tok) => {
    try {
      const res = await api.get(`/auth/invitation?token=${tok}`);
      setInvitation(res.data.invitation);
      setName(res.data.invitation.name || '');
    } catch (err) {
      setError(err.response?.data?.error || 'Invitation is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (e) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await acceptInvitation({
        token,
        password,
        name: name.trim(),
      });
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 border border-slate-200 shadow-xl relative z-10">
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="TaskBoard Logo"
            className="h-12 w-auto mx-auto mb-2 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <h2 className="text-2xl font-bold text-slate-900">Accept Invitation</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Join your company's TaskBoard workspace</p>
        </div>

        {error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs text-center space-y-2 font-bold">
            <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
            <p>{error}</p>
          </div>
        ) : invitation ? (
          <div className="space-y-4 text-xs">
            {/* Invitation Details Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Company:</span>
                <span className="font-bold text-slate-900">{invitation.company?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Position:</span>
                <span className="font-bold text-blue-600">{invitation.position?.title || 'Team Member'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="font-bold text-slate-800">{invitation.department?.name || 'General'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Invited Email:</span>
                <span className="font-mono text-slate-700">{invitation.email}</span>
              </div>
            </div>

            <form onSubmit={handleAccept} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pro-input px-3.5 py-2 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Create Password (Min 8 Chars)</label>
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

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 mt-2"
              >
                {submitting ? 'Setting up Account...' : 'Accept & Join Workspace'}
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default JoinPage;
