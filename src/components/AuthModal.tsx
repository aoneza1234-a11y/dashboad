import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  X,
  Mail,
  Lock,
  User,
  Building,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { TeamUser } from '../types';
import {
  getTeamUsers,
  loginTeamUser,
  registerTeamUser,
} from '../services/teamAuthStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: TeamUser) => void;
  onLoginSuccess?: (user: TeamUser) => void;
  initialMode?: 'login' | 'register';
  onGoogleSignIn?: () => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onLoginSuccess,
  initialMode = 'login',
  onGoogleSignIn,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('ทีมกลยุทธ์และการวิเคราะห์');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const notifySuccess = (user: TeamUser) => {
    if (onLoginSuccess) onLoginSuccess(user);
    if (onAuthSuccess) onAuthSuccess(user);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('กรุณากรอกอีเมล');
      return;
    }

    const res = loginTeamUser(email, password);
    if (!res.success || !res.user) {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      return;
    }

    setSuccessMsg(`ยินดีต้อนรับคุณ ${res.user.displayName}!`);
    setTimeout(() => {
      notifySuccess(res.user!);
      onClose();
    }, 400);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!displayName.trim() || !email.trim()) {
      setErrorMsg('กรุณากรอกชื่อและอีเมลให้ครบถ้วน');
      return;
    }

    const res = registerTeamUser(displayName, email, password, department);
    if (!res.success || !res.user) {
      setErrorMsg(res.error || 'ไม่สามารถลงทะเบียนได้');
      return;
    }

    setSuccessMsg(`สมัครสมาชิกสำเร็จ! กำลังเข้าสู่เวิร์กสเปซของคุณ...`);
    setTimeout(() => {
      notifySuccess(res.user!);
      onClose();
    }, 600);
  };

  const handleQuickDemoLogin = (userEmail: string, userPass: string = 'password123') => {
    setEmail(userEmail);
    setPassword(userPass);
    setErrorMsg(null);
    const res = loginTeamUser(userEmail, userPass);
    if (res.success && res.user) {
      setSuccessMsg(`เข้าสู่ระบบเป็น ${res.user.displayName} เรียบร้อย!`);
      setTimeout(() => {
        notifySuccess(res.user!);
        onClose();
      }, 300);
    } else {
      setErrorMsg(res.error || 'ไม่สามารถเข้าสู่ระบบได้');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#16122c] border border-violet-500/40 rounded-2xl shadow-2xl p-6 text-white text-left relative overflow-hidden"
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-violet-600/30">
              {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {mode === 'login' ? 'เข้าสู่ระบบทีมงาน (Team Login)' : 'สมัครใช้งานสมาชิกใหม่ (Register)'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {mode === 'login'
                  ? 'เข้าใช้งานสตูดิโอสร้างและออกแบบแดชบอร์ด'
                  : 'ร่วมเป็นสมาชิกทีมเพื่อสร้างและจัดการแดชบอร์ดของคุณ'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-[#211a3f] rounded-xl border border-violet-500/20 mb-5 relative z-10">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>เข้าสู่ระบบ</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>สมัครสมาชิก</span>
          </button>
        </div>

        {/* Error / Success Alert Box */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="font-medium">{successMsg}</div>
          </div>
        )}

        {/* Form Container */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3.5 relative z-10">
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-violet-400" />
                <span>อีเมล (Email Address)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="เช่น aoneza953@gmail.com หรือ team@company.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#20193d] border border-violet-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-violet-400" />
                  <span>รหัสผ่าน (Password)</span>
                </label>
                <span className="text-[10px] text-slate-400">สำหรับทดสอบใส่รหัสใดก็ได้</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#20193d] border border-violet-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-700/30 transition cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>เข้าสู่ระบบทันที</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3 relative z-10">
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-violet-400" />
                <span>ชื่อ - นามสกุล หรือ ชื่อเรียก</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="เช่น สมชาย ใจดี (ฝ่ายวิเคราะห์)"
                className="w-full px-3.5 py-2 rounded-xl bg-[#20193d] border border-violet-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-violet-400" />
                <span>อีเมล</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2 rounded-xl bg-[#20193d] border border-violet-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-violet-400" />
                <span>แผนก / ทีมงาน</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="เช่น การตลาด, ฝ่ายขาย, วิจัยและพัฒนา"
                className="w-full px-3.5 py-2 rounded-xl bg-[#20193d] border border-violet-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-violet-400" />
                <span>ตั้งรหัสผ่าน</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ตั้งรหัสผ่านอย่างน้อย 4 ตัวอักษร"
                className="w-full px-3.5 py-2 rounded-xl bg-[#20193d] border border-violet-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-violet-950/40 border border-violet-500/30 text-[11px] text-violet-200">
              💡 สมาชิกใหม่จะได้รับสิทธิ์ <strong>ผู้ใช้ในทีม (Team Editor)</strong> สามารถสร้างแดชบอร์ด, เพิ่มกราฟ, ปรับแต่งธีมของตนเองได้ทุกอย่าง โดยไม่มีระบบหลังบ้านมารบกวน
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-700/30 transition cursor-pointer flex items-center justify-center gap-2 mt-1"
            >
              <span>ยืนยันการสมัครสมาชิก</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Quick Demo Login Preset Buttons for easy testing */}
        <div className="mt-5 pt-4 border-t border-white/10 relative z-10">
          <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
            <span>⚡ บัญชีทดสอบด่วน (Quick Test Accounts):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('aoneza953@gmail.com')}
              className="px-2.5 py-1.5 rounded-lg bg-[#221b42] hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-[11px] font-medium transition cursor-pointer flex items-center justify-between"
              title="สิทธิ์แอดมิน: เข้าถึงได้ทุกอย่างรวมถึงระบบหลังบ้านและจัดการผู้ใช้"
            >
              <span>👑 แอดมิน (Admin)</span>
              <span className="text-[9px] bg-purple-500/30 px-1 rounded font-mono">Full</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('komsan.m@team.internal')}
              className="px-2.5 py-1.5 rounded-lg bg-[#221b42] hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 text-[11px] font-medium transition cursor-pointer flex items-center justify-between"
              title="สิทธิ์ผู้ใช้ในทีม: สร้าง/แก้แดชบอร์ดได้ทุกอย่าง ไม่มีระบบหลังบ้าน"
            >
              <span>👥 สมาชิก (Member)</span>
              <span className="text-[9px] bg-emerald-500/30 px-1 rounded font-mono">Editor</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('somchai.blocked@team.internal')}
              className="px-2.5 py-1.5 rounded-lg bg-[#221b42] hover:bg-rose-900/60 border border-rose-500/40 text-rose-200 text-[11px] font-medium transition cursor-pointer flex items-center justify-between"
              title="ทดสอบบัญชีที่ถูกแอดมินบล็อกไว้"
            >
              <span>🚫 บัญชีถูกบล็อก</span>
              <span className="text-[9px] bg-rose-500/30 px-1 rounded font-mono">Blocked</span>
            </button>
          </div>
        </div>

        {/* Google Sign-in Option */}
        {onGoogleSignIn && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={async () => {
                try {
                  await onGoogleSignIn();
                  onClose();
                } catch (e) {
                  // error handled in caller
                }
              }}
              className="w-full py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 border border-slate-300 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>เข้าสู่ระบบด้วยบัญชี Google</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
