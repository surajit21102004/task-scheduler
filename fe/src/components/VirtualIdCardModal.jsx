import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Shield, Award, Building, Mail, QrCode, CreditCard, RotateCw, Printer } from 'lucide-react';

const VirtualIdCardModal = ({ isOpen, onClose, targetUser }) => {
  const { user: currentUser, company } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);

  if (!isOpen) return null;

  const emp = targetUser || currentUser;
  const logoSrc = company?.logo_url || '/logo.png';
  const empIdCode = `EMP-${(emp?.id || '00000000').substring(0, 8).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl relative flex flex-col items-center">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title Header */}
        <div className="text-center mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center justify-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Virtual Employee ID Card
          </h3>
          <p className="text-xs text-slate-500">Official digital identity pass for {company?.name || 'Company'}</p>
        </div>

        {/* CARD CONTAINER WITH FLIP TRANSITION */}
        <div className="w-full max-w-sm my-2" style={{ perspective: '1000px' }}>
          <div
            className="w-full rounded-2xl border border-slate-700 shadow-xl overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white relative"
            style={{
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Holographic Security Overlay strip */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-teal-400 to-indigo-500 z-10"></div>

            {!isFlipped ? (
              /* FRONT OF ID CARD */
              <div className="p-5 flex flex-col items-center space-y-4 relative">
                {/* Company Header */}
                <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <img
                      src={logoSrc}
                      alt="Company Logo"
                      className="h-7 w-auto object-contain bg-white/90 p-1 rounded-lg"
                      onError={(e) => {
                        e.target.src = '/logo.png';
                      }}
                    />
                    <span className="font-extrabold text-xs tracking-tight text-white uppercase">
                      {company?.name || 'TaskBoard System'}
                    </span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    Verified
                  </span>
                </div>

                {/* Employee Photo / Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white text-2xl font-black flex items-center justify-center border-2 border-white/80 shadow-lg">
                    {emp?.name ? emp.name.substring(0, 2).toUpperCase() : 'EMP'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-900 p-1 rounded-full text-[9px] font-bold shadow-xs">
                    <Award className="w-3 h-3" />
                  </div>
                </div>

                {/* Employee Details */}
                <div className="text-center space-y-1">
                  <h4 className="text-base font-black tracking-tight text-white">{emp?.name}</h4>
                  <p className="text-xs text-blue-300 font-bold uppercase tracking-wider">
                    {emp?.position?.title || emp?.position || emp?.role || 'Team Executive'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {emp?.department?.name || emp?.department || 'General Operations'}
                  </p>
                </div>

                {/* ID Code & Barcode Graphic */}
                <div className="w-full bg-white/5 border border-white/10 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Employee ID</span>
                    <span className="font-mono font-bold text-amber-400 text-xs">{empIdCode}</span>
                  </div>

                  <div className="flex items-center space-x-1 opacity-80">
                    <QrCode className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="w-full text-center pt-1 border-t border-white/10">
                  <span className="text-[9px] text-slate-400 tracking-widest uppercase font-semibold">
                    Authorized Personnel Pass
                  </span>
                </div>
              </div>
            ) : (
              /* BACK OF ID CARD (Counter-rotated 180deg so text renders left-to-right) */
              <div
                className="p-5 flex flex-col justify-between space-y-4 text-xs bg-slate-900 min-h-[320px]"
                style={{ transform: 'rotateY(180deg)' }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Card Metadata</span>
                    <span className="text-[9px] text-slate-400">Security Level 1</span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Email Address</span>
                      <span className="font-semibold text-white truncate block">{emp?.email}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Role Access</span>
                      <span className="font-bold text-emerald-400 capitalize">{emp?.role || 'Employee'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Company ID</span>
                      <span className="font-mono text-slate-300 text-[10px] truncate block">{company?.id || emp?.company_id}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-[10px] text-slate-300 leading-relaxed">
                  <p className="font-bold text-white mb-0.5">Notice of Ownership</p>
                  This virtual pass remains the property of {company?.name || 'Company'}. If found, please return to HR department.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="flex items-center justify-between w-full mt-4 pt-3 border-t border-slate-100 gap-2">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-600" />
            <span>{isFlipped ? 'Show Front' : 'Flip Card'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print ID Pass</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VirtualIdCardModal;
