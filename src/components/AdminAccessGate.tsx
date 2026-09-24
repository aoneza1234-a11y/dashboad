import React, { useState } from 'react';
import { ShieldAlert, KeyRound, ArrowLeft, Eye, EyeOff, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { verifyAdminPasscode, setAdminAuthenticatedSession, getSiteStatus } from '../services/siteStatusStore';
import { getTeamUsers, setCurrentSessionUser } from '../services/teamAuthStore';

interface AdminAccessGateProps {
  onUnlockSuccess: () => void;
  onBackToUserPortal: () => void;
}

export const AdminAccessGate: React.FC<AdminAccessGateProps> = ({
  onUnlockSuccess,
  onBackToUserPortal,
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const siteStatus = getSiteStatus();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setErrorMsg('กรุณากรอกรหัสผ่านผู้ดูแลระบบ');
      return;
    }

    if (verifyAdminPasscode(passcode)) {
      setIsSuccess(true);
      setErrorMsg('');
      setAdminAuthenticatedSession(true);
      
      // Also ensure current session has admin role if admin user exists
      const allUsers = getTeamUsers();
      const adminUser = allUsers.find(u => u.role === 'admin');
      if (adminUser) {
        setCurrentSessionUser(adminUser);
      }

      setTimeout(() => {
        onUnlockSuccess();
      }, 400);
    } else {
      setErrorMsg('รหัสผ่าน Master Passcode ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleQuickAdminLogin = () => {
    const allUsers = getTeamUsers();
    const adminUser = allUsers.find(u => u.role === 'admin');
    if (adminUser) {
      setCurrentSessionUser(adminUser);
      setAdminAuthenticatedSession(true);
      setIsSuccess(true);
      setTimeout(() => {
        onUnlockSuccess();
      }, 300);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#0d0a1a] flex items-center justify-center p-4 relative overflow-hidden font-['Prompt',sans-serif]">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-rose-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#16122b]/95 border border-rose-500/40 rounded-3xl p-7 shadow-2xl backdrop-blur-xl relative z-10 text-white text-left">
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>พื้นที่จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ (Admin Only)</span>
          </div>
          <button
            onClick={onBackToUserPortal}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition py-1 px-2 rounded-lg hover:bg-white/5"
            title="ออกจากหน้าแอดมินและกลับสู่หน้าแดชบอร์ดผู้ใช้"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับหน้าผู้ใช้</span>
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-2 mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-rose-400" />
            <span>ระบบหลังบ้าน (Admin Platform)</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            หน้านี้แยกออกจากลิงก์ของเว็บไซต์ผู้ใช้งานและผู้ชมทั่วไป เพื่อความปลอดภัย กรุณากรอกรหัสผ่าน 
            <span className="text-rose-300 font-semibold"> Master Passcode </span> 
            เพื่อเข้าสู่ระบบควบคุมหลังบ้าน
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 block">
              รหัสผ่านผู้ดูแลระบบ (Master Passcode):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4 text-violet-400" />
              </div>
              <input
                type={showPasscode ? 'text' : 'password'}
                autoFocus
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="กรอกรหัสผ่านแอดมิน..."
                className="w-full pl-10 pr-10 py-2.5 bg-[#0f0b21] border border-violet-500/40 rounded-xl text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/50"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>(รหัสผ่านเริ่มต้นของระบบ: <code className="text-violet-300 font-mono">admin1234</code>)</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>ยืนยันสิทธิ์สำเร็จ! กำลังเข้าสู่ระบบหลังบ้าน...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSuccess}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>เข้าสู่ระบบหลังบ้าน (Admin Platform)</span>
          </button>
        </form>

        {/* Alternative Action */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-2.5 text-center">
          <button
            type="button"
            onClick={handleQuickAdminLogin}
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-violet-300 hover:text-white transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>👑 เข้าสู่ระบบทันทีด้วยบัญชี Owner / Admin</span>
          </button>

          <button
            type="button"
            onClick={onBackToUserPortal}
            className="w-full py-2 rounded-xl bg-transparent hover:bg-white/5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ไม่ใช่ผู้ดูแลระบบ? คลิกที่นี่เพื่อกลับสู่หน้าเว็บผู้ใช้งาน</span>
          </button>
        </div>
      </div>
    </div>
  );
};
