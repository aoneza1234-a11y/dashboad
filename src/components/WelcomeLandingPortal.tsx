import React, { useState } from 'react';
import {
  BarChart3,
  UserCheck,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Database,
  Lock,
  Mail,
  User,
  Building,
} from 'lucide-react';
import { TeamUser } from '../types';
import { loginTeamUserAsync, registerTeamUserAsync } from '../services/teamAuthStore';

interface WelcomeLandingPortalProps {
  onLoginSuccess: (user: TeamUser) => void;
}

export const WelcomeLandingPortal: React.FC<WelcomeLandingPortalProps> = ({
  onLoginSuccess,
}) => {
  // Active Tab: Login or Register
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDepartment, setRegDepartment] = useState('ฝ่ายวิเคราะห์ข้อมูล');
  const [regPassword, setRegPassword] = useState('');

  // Handle Login
  const handlePerformLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const identifier = loginIdentifier.trim();
    if (!identifier) {
      setAuthError('กรุณากรอกอีเมล ชื่อผู้ใช้ หรือ User ID');
      return;
    }
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const res = await loginTeamUserAsync(identifier, loginPassword || 'password123');
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setAuthError(res.error || 'ไม่พบบัญชีผู้ใช้นี้ หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: any) {
      setAuthError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Register
  const handlePerformRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setAuthError('กรุณากรอกชื่อ-นามสกุลของคุณ');
      return;
    }
    if (!regEmail.trim()) {
      setAuthError('กรุณากรอกอีเมลหรือชื่อผู้ใช้สำหรับเข้าสู่ระบบ');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setAuthError('กรุณากำหนดรหัสผ่านอย่างน้อย 4 ตัวอักษร');
      return;
    }
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const res = await registerTeamUserAsync(
        regName.trim(),
        regEmail.trim(),
        regPassword,
        regDepartment
      );
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setAuthError(res.error || 'การสมัครสมาชิกล้มเหลว กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      setAuthError(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#0a0718] text-slate-100 flex flex-col justify-between overflow-x-hidden font-sans selection:bg-violet-600 selection:text-white relative">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-violet-600/20 via-indigo-600/10 to-transparent blur-[120px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 -right-40 w-[600px] h-[600px] bg-violet-800/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Simple Header */}
      <header className="relative z-20 border-b border-violet-500/15 bg-[#0e0a22]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-600/30 border border-violet-400/30">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">VISTA BI Studio</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-400/30">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-400">ระบบเข้าใช้งานแดชบอร์ดและการวิเคราะห์ข้อมูล</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('login');
                setAuthError(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setAuthError(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10 max-w-md mx-auto w-full">
        {/* Portal Card */}
        <div className="w-full bg-[#130d2a]/95 border border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-violet-950/60 backdrop-blur-xl">
          {/* Card Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/30 border border-violet-400/30 shrink-0">
              {activeTab === 'login' ? (
                <LogIn className="w-6 h-6 text-white" />
              ) : (
                <UserPlus className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                {activeTab === 'login' ? 'เข้าสู่ระบบ VISTA BI' : 'สมัครสมาชิกใหม่'}
              </h2>
              <p className="text-xs text-slate-400">
                {activeTab === 'login'
                  ? 'กรอกชื่อผู้ใช้หรืออีเมลของคุณเพื่อเปิดแดชบอร์ด'
                  : 'กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้งานส่วนตัว'}
              </p>
            </div>
          </div>

          {/* 2 Tabs: เข้าสู่ระบบ / สมัครสมาชิก */}
          <div className="grid grid-cols-2 gap-1 bg-[#0b071e] p-1.5 rounded-2xl border border-violet-500/20 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setAuthError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'login'
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
                setActiveTab('register');
                setAuthError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>สมัครสมาชิก</span>
            </button>
          </div>

          {/* Error Message */}
          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{authError}</span>
            </div>
          )}

          {/* 1. Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handlePerformLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  อีเมล, ชื่อผู้ใช้ หรือ User ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="เช่น user1 หรืออีเมลของคุณ"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090619] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">รหัสผ่าน</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'ซ่อนรหัส' : 'แสดงรหัส'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านของคุณ"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090619] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs transition shadow-lg shadow-violet-600/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>กำลังตรวจสอบ...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบทันที</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-slate-400">
                ยังไม่มีบัญชีใช่หรือไม่?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setAuthError(null);
                  }}
                  className="text-violet-400 hover:underline font-bold cursor-pointer"
                >
                  สมัครสมาชิกใหม่ที่นี่
                </button>
              </div>
            </form>
          )}

          {/* 2. Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handlePerformRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ชื่อ-นามสกุล / Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี หรือชื่อของคุณ"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090619] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  อีเมล หรือ ชื่อผู้ใช้สำหรับล็อกอิน
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="เช่น myname@company.com หรือ user1"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090619] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">แผนก / ฝ่ายงาน</label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    placeholder="เช่น ฝ่ายขาย, การตลาด, วิจัยและพัฒนา"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090619] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">กำหนดรหัสผ่าน</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="อย่างน้อย 4 ตัวอักษร"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090619] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs transition shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>กำลังสร้างบัญชี...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>สร้างบัญชีและเข้าสู่ระบบ</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-slate-400">
                มีบัญชีอยู่แล้วใช่หรือไม่?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setAuthError(null);
                  }}
                  className="text-violet-400 hover:underline font-bold cursor-pointer"
                >
                  เข้าสู่ระบบที่นี่
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-violet-500/15 bg-[#080514] py-4 px-6 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-slate-400 font-medium">VISTA BI Studio Platform</span>
          <span>© 2026 VISTA BI Studio • เข้าใช้งานระบบอย่างปลอดภัย</span>
        </div>
      </footer>
    </div>
  );
};
