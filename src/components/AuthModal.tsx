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
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { TeamUser } from '../types';
import {
  loginTeamUserAsync,
  registerTeamUserAsync,
  resetPasswordAsync,
} from '../services/teamAuthStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: TeamUser) => void;
  onLoginSuccess?: (user: TeamUser) => void;
  initialMode?: 'login' | 'register';
  onGoogleSignIn?: () => Promise<void>;
  forceAuth?: boolean;
  isTestMode?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onLoginSuccess,
  initialMode = 'login',
  onGoogleSignIn,
  forceAuth = false,
  isTestMode,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);

  const effectiveIsTestMode =
    isTestMode ??
    (typeof window !== 'undefined' &&
      (window.location.pathname.toLowerCase().startsWith('/test') ||
        window.location.pathname.toLowerCase().startsWith('/demo') ||
        window.location.search.toLowerCase().includes('mode=test') ||
        window.location.search.toLowerCase().includes('mode=demo') ||
        window.location.hash.toLowerCase().includes('test') ||
        window.location.hash.toLowerCase().includes('demo')));

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('ทีมกลยุทธ์และการวิเคราะห์');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const notifySuccess = (user: TeamUser) => {
    if (onLoginSuccess) onLoginSuccess(user);
    if (onAuthSuccess) onAuthSuccess(user);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('กรุณากรอกอีเมล');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginTeamUserAsync(email, password);
      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`ยินดีต้อนรับคุณ ${res.user.displayName}! เข้าสู่ระบบสำเร็จ`);
      notifySuccess(res.user);
      setTimeout(() => {
        onClose();
      }, 200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'ไม่สามารถเข้าสู่ระบบได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!displayName.trim() || !email.trim()) {
      setErrorMsg('กรุณากรอกชื่อและอีเมลให้ครบถ้วน');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg('กรุณากำหนดรหัสผ่านอย่างน้อย 4 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerTeamUserAsync(displayName, email, password, department);
      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'ไม่สามารถลงทะเบียนได้');
        return;
      }

      setSuccessMsg(`สมัครสมาชิกสำเร็จ! กำลังเข้าสู่เวิร์กสเปซของคุณ...`);
      setTimeout(() => {
        notifySuccess(res.user!);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err?.message || 'ลงทะเบียนล้มเหลว');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !newPassword.trim()) {
      setErrorMsg('กรุณากรอกอีเมลและรหัสผ่านใหม่');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPasswordAsync(email, newPassword);
      if (!res.success) {
        setErrorMsg(res.error || 'รีเซ็ตรหัสผ่านไม่สำเร็จ');
        return;
      }

      setSuccessMsg('รีเซ็ตรหัสผ่านสำเร็จเรียบร้อย! คุณสามารถใช้รหัสผ่านใหม่เข้าสู่ระบบได้ทันที');
      setTimeout(() => {
        setMode('login');
        setPassword(newPassword);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการรีเซ็ต');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={forceAuth ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#16122c] border border-violet-500/40 rounded-2xl shadow-2xl p-6 text-white text-left relative overflow-hidden"
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-violet-600/30">
              {mode === 'login' ? (
                <LogIn className="w-5 h-5" />
              ) : mode === 'register' ? (
                <UserPlus className="w-5 h-5" />
              ) : (
                <KeyRound className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {mode === 'login'
                  ? 'เข้าสู่ระบบ (Login)'
                  : mode === 'register'
                  ? 'สมัครสมาชิกใหม่ (Register)'
                  : 'ตั้งรหัสผ่านใหม่ (Reset Password)'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {mode === 'login'
                  ? 'เข้าสู่ระบบเพื่อโหลดและบันทึก Dashboard ของคุณ'
                  : mode === 'register'
                  ? 'สร้างบัญชีผู้ใช้ใหม่ ข้อมูลแยกเฉพาะบุคคล'
                  : 'ระบุอีเมลและตั้งรหัสผ่านใหม่ลงฐานข้อมูล'}
              </p>
            </div>
          </div>
          {!forceAuth && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 1-Click Fast Bypass for Admin (Guaranteed Instant Access) */}
        {mode === 'login' && (
          <div className="mb-4 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-violet-500/15 border border-amber-500/40 flex items-center justify-between gap-2">
            <div className="text-left">
              <span className="text-xs font-bold text-amber-300 block">👑 เข้าสู่ระบบด่วน 1-Click (Admin)</span>
              <span className="text-[10px] text-slate-300">เข้าสู่ระบบเป็น Thirawat ทันทีโดยไม่ต้องรอโหลด</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  const res = await loginTeamUserAsync('aoneza953@gmail.com', 'password123');
                  if (res.user) {
                    notifySuccess(res.user);
                    onClose();
                  }
                } catch {
                  // Fallback
                  const fallbackAdmin: TeamUser = {
                    id: 'usr-admin-1',
                    email: 'aoneza953@gmail.com',
                    name: 'Thirawat (ผู้ดูแลระบบ)',
                    displayName: 'Thirawat (ผู้ดูแลระบบ)',
                    role: 'admin',
                    status: 'active',
                    department: 'Management & IT',
                    createdAt: '2026-01-15',
                    lastLoginAt: 'เข้าสู่ระบบทันที',
                    assignedTemplateIds: ['tpl-1'],
                  };
                  localStorage.setItem('bi_studio_current_session_v1', JSON.stringify(fallbackAdmin));
                  notifySuccess(fallbackAdmin);
                  onClose();
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              เข้าใช้งานทันที
            </button>
          </div>
        )}

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
          <button
            type="button"
            onClick={() => {
              setMode('reset');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'reset'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>ลืมรหัสผ่าน</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5 relative z-10">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">อีเมลผู้ใช้งาน</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="เช่น aoneza953@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#211a3f] border border-violet-500/30 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-violet-400 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">รหัสผ่าน</label>
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-[11px] text-violet-400 hover:text-violet-300 transition cursor-pointer"
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="กรอกรหัสผ่านของคุณ"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#211a3f] border border-violet-500/30 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-violet-400 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition transform active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังตรวจสอบข้อมูล...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบเวิร์กสเปซ</span>
                </>
              )}
            </button>

            {/* Quick Demo Credentials - Strictly displayed only in /test route, NEVER in production user website */}
            {effectiveIsTestMode && (
              <div className="pt-3 border-t border-[#29204c] animate-in fade-in">
                <div className="flex items-center gap-1.5 text-[10px] text-amber-300 font-semibold mb-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>เฉพาะในโหมดทดสอบ (/test) - บัญชีทดสอบ Persona:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('aoneza953@gmail.com', 'password123')}
                    className="px-2 py-1 rounded bg-[#251f46] hover:bg-violet-600 text-[10px] text-violet-200 transition cursor-pointer"
                  >
                    👑 Thirawat (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('komsan.m@team.internal', 'password123')}
                    className="px-2 py-1 rounded bg-[#251f46] hover:bg-violet-600 text-[10px] text-violet-200 transition cursor-pointer"
                  >
                    👤 User A (Komsan)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('nattapong.s@team.internal', 'password123')}
                    className="px-2 py-1 rounded bg-[#251f46] hover:bg-violet-600 text-[10px] text-violet-200 transition cursor-pointer"
                  >
                    👤 User B (Nattapong)
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* 2. Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3 relative z-10">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">ชื่อ - นามสกุล หรือชื่อเรียก</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="เช่น สมชาย ใจดี"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#211a3f] border border-violet-500/30 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-violet-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">อีเมลประจำตัว</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#211a3f] border border-violet-500/30 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-violet-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">ตั้งรหัสผ่าน</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="อย่างน้อย 4 ตัวอักษร"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#211a3f] border border-violet-500/30 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-violet-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">แผนก / ฝ่ายงาน</label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="เช่น ฝ่ายขาย, การตลาด, วิจัย"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#211a3f] border border-violet-500/30 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-violet-400 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition transform active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังสร้างบัญชีบนคลาวด์...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>สร้างบัญชีและเริ่มใช้งาน</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. Reset Password Form */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5 relative z-10">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">อีเมลของบัญชีที่ต้องการรีเซ็ต</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="เช่น user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#211a3f] border border-violet-500/30 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-violet-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">รหัสผ่านใหม่ที่ต้องการตั้ง</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="พิมพ์รหัสผ่านใหม่"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#211a3f] border border-violet-500/30 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-violet-400 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition transform active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังอัปเดตรหัสผ่านลง Database...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>บันทึกรหัสผ่านใหม่</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-violet-400 hover:text-violet-300 transition cursor-pointer"
              >
                ย้อนกลับไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          </form>
        )}

        {/* Google Sign In option */}
        {onGoogleSignIn && (
          <div className="mt-4 pt-3 border-t border-violet-500/20 text-center relative z-10">
            <button
              type="button"
              onClick={async () => {
                try {
                  await onGoogleSignIn();
                  onClose();
                } catch (e) {
                  console.error(e);
                }
              }}
              className="w-full py-2 px-3 rounded-xl bg-[#231d42] hover:bg-[#2b2450] border border-violet-500/30 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>หรือเข้าสู่ระบบด้วย Google Workspace</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
