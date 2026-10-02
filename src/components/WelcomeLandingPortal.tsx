import React, { useState } from 'react';
import {
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Layers,
  Database,
  Share2,
  FileSpreadsheet,
  UserCheck,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';
import { TeamUser } from '../types';
import { loginTeamUserAsync, registerTeamUserAsync } from '../services/teamAuthStore';

interface WelcomeLandingPortalProps {
  onLoginSuccess: (user: TeamUser) => void;
}

export const WelcomeLandingPortal: React.FC<WelcomeLandingPortalProps> = ({
  onLoginSuccess,
}) => {
  // Modal State for Entering the App (Only login or register)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeAuthTab, setActiveAuthTab] = useState<'login' | 'register'>('login');
  const [selectedStep, setSelectedStep] = useState<number>(1);

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
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const res = await registerTeamUserAsync(
        regName.trim(),
        regEmail.trim(),
        regPassword || 'password123',
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

  const openAuthWithTab = (tab: 'login' | 'register') => {
    setActiveAuthTab(tab);
    setAuthError(null);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen w-screen bg-[#0a0718] text-slate-100 flex flex-col overflow-x-hidden font-sans selection:bg-violet-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-violet-600/20 via-indigo-600/10 to-transparent blur-[120px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 -right-40 w-[600px] h-[600px] bg-violet-800/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Navigation Header */}
      <header className="relative z-20 border-b border-violet-500/15 bg-[#0e0a22]/80 backdrop-blur-md sticky top-0 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
              <p className="text-[11px] text-slate-400">ระบบบริหารและวิเคราะห์แดชบอร์ดข้อมูลอัจฉริยะ</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openAuthWithTab('login')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-violet-300" />
              <span>เข้าสู่ระบบ</span>
            </button>
            <button
              onClick={() => openAuthWithTab('register')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-white" />
              <span>สมัครสมาชิก</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-6 py-12 lg:py-16 flex flex-col items-center">
        {/* Top Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-900/40 border border-violet-500/30 text-violet-300 text-xs font-medium mb-6 shadow-inner">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>ระบบพร้อมให้บริการ • เชื่อมต่อข้อมูลสด & บันทึกเซิร์ฟเวอร์แบบเรียลไทม์</span>
          <ChevronRight className="w-3.5 h-3.5 text-violet-400" />
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-center text-white tracking-tight leading-[1.15] max-w-4xl mb-6">
          แพลตฟอร์มวิเคราะห์และออกแบบ{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-300">
            แดชบอร์ดข้อมูลระดับมืออาชีพ
          </span>
        </h1>

        <p className="text-slate-300 text-center text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed mb-8">
          แปลงข้อมูลจาก Google Sheets และ Excel ให้กลายเป็นกราฟสรุปผลและรายงานเชิงลึก
          ปรับแต่งกราฟิกได้อย่างอิสระ พร้อมระบบจัดการผู้ใช้และบันทึกผลงานปลอดภัย
        </p>

        {/* Action Buttons: Only Login & Register */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <button
            onClick={() => openAuthWithTab('login')}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-violet-600/30 flex items-center gap-2 transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4 text-violet-200" />
            <span>เข้าสู่ระบบเพื่อใช้งาน</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={() => openAuthWithTab('register')}
            className="px-7 py-3.5 rounded-2xl bg-[#1a1438] hover:bg-[#231b4b] text-violet-200 hover:text-white font-bold text-sm border border-violet-500/30 flex items-center gap-2 transition cursor-pointer shadow-lg hover:border-violet-400/50"
          >
            <UserPlus className="w-4 h-4 text-violet-400" />
            <span>สมัครสมาชิกใหม่</span>
          </button>
        </div>

        {/* 4 Steps Section */}
        <section className="w-full max-w-5xl mb-16">
          <div className="text-center mb-8">
            <span className="text-xs uppercase font-extrabold tracking-widest text-violet-400 block mb-1">
              HOW IT WORKS • ขั้นตอนการเริ่มต้นใช้งาน
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">4 สเตปการเข้าใช้งาน VISTA BI Studio</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              เข้าถึงการวิเคราะห์ข้อมูลระดับองค์กรได้ง่ายๆ ใน 4 ขั้นตอน
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div
              onClick={() => setSelectedStep(1)}
              className={`p-5 rounded-2xl border transition cursor-pointer text-left relative overflow-hidden ${
                selectedStep === 1
                  ? 'bg-gradient-to-b from-[#201845] to-[#161131] border-violet-400 shadow-xl shadow-violet-900/20'
                  : 'bg-[#140f2b]/80 border-violet-500/20 hover:border-violet-400/40'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-400/40 text-violet-300 font-black text-sm flex items-center justify-center mb-3">
                1
              </div>
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-violet-400" />
                เข้าสู่ระบบ / บัญชี
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                เข้าสู่ระบบด้วยบัญชีของคุณ ข้อมูลและการปรับแต่งผลงานจะถูกบันทึกแยกส่วนตัวอย่างปลอดภัย
              </p>
              <div className="mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openAuthWithTab('login');
                  }}
                  className="text-[11px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  <span>เข้าสู่ระบบตอนนี้</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div
              onClick={() => setSelectedStep(2)}
              className={`p-5 rounded-2xl border transition cursor-pointer text-left relative overflow-hidden ${
                selectedStep === 2
                  ? 'bg-gradient-to-b from-[#201845] to-[#161131] border-violet-400 shadow-xl shadow-violet-900/20'
                  : 'bg-[#140f2b]/80 border-violet-500/20 hover:border-violet-400/40'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 font-black text-sm flex items-center justify-center mb-3">
                2
              </div>
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                เชื่อมต่อแหล่งข้อมูล
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                นำเข้าไฟล์ Excel (.xlsx, .xls) หรือต่อ Google Sheets ลิงก์สาธารณะเพื่ออัปเดตข้อมูลสด
              </p>
              <div className="mt-3 text-[11px] text-slate-400">รองรับ Google Sheets สด</div>
            </div>

            {/* Step 3 */}
            <div
              onClick={() => setSelectedStep(3)}
              className={`p-5 rounded-2xl border transition cursor-pointer text-left relative overflow-hidden ${
                selectedStep === 3
                  ? 'bg-gradient-to-b from-[#201845] to-[#161131] border-violet-400 shadow-xl shadow-violet-900/20'
                  : 'bg-[#140f2b]/80 border-violet-500/20 hover:border-violet-400/40'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-fuchsia-600/30 border border-fuchsia-400/40 text-fuchsia-300 font-black text-sm flex items-center justify-center mb-3">
                3
              </div>
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
                ปรับแต่งแดชบอร์ด
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                เลือกวิดเจ็ต KPI, Bar, Donut, กรองข้อมูลแบบเรียลไทม์ และเปลี่ยนรูปไอคอนมุมขวาวิดเจ็ตได้อิสระ
              </p>
              <div className="mt-3 text-[11px] text-slate-400">10+ วิดเจ็ตอัจฉริยะ</div>
            </div>

            {/* Step 4 */}
            <div
              onClick={() => setSelectedStep(4)}
              className={`p-5 rounded-2xl border transition cursor-pointer text-left relative overflow-hidden ${
                selectedStep === 4
                  ? 'bg-gradient-to-b from-[#201845] to-[#161131] border-violet-400 shadow-xl shadow-violet-900/20'
                  : 'bg-[#140f2b]/80 border-violet-500/20 hover:border-violet-400/40'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-400/40 text-emerald-300 font-black text-sm flex items-center justify-center mb-3">
                4
              </div>
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                บันทึก & เผยแพร่
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                กดบันทึกเพื่ออัปเดตผลงานล่าสุดลงเซิร์ฟเวอร์ และแชร์ลิงก์ให้ผู้ชมภายนอกได้ทันที
              </p>
              <div className="mt-3 text-[11px] text-emerald-400 font-medium">บันทึกผลงานล่าสุดปลอดภัย</div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-[#120e29] border border-violet-500/20 rounded-2xl p-6 text-left hover:border-violet-400/40 transition">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">เชื่อมต่อ Google Sheets & Excel</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              รองรับทั้งไฟล์ Excel สเปรดชีต และลิงก์ Google Sheets สาธารณะ พร้อมระบบดึงข้อมูลอัปเดตอัตโนมัติ
            </p>
          </div>

          <div className="bg-[#120e29] border border-violet-500/20 rounded-2xl p-6 text-left hover:border-violet-400/40 transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">แคนวาสอิสระ & ปรับแต่งยืดหยุ่น</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              จัดวางวิดเจ็ต ปรับแต่งไอคอนรูปภาพมุมขวาหัวกราฟ สลับธีมสี และตกแต่งแดชบอร์ดตามใจชอบ
            </p>
          </div>

          <div className="bg-[#120e29] border border-violet-500/20 rounded-2xl p-6 text-left hover:border-violet-400/40 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">ความปลอดภัย & การจัดการสิทธิ์</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              ระบบแยกรหัสผ่านและฐานข้อมูลของแต่ละผู้ใช้งานอย่างเป็นอิสระ ปลอดภัย และเซฟลงเซิร์ฟเวอร์แบบเรียลไทม์
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-violet-500/15 bg-[#0a0718] py-8 px-6 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-600/30 flex items-center justify-center text-violet-400 font-bold text-xs">
              V
            </div>
            <span className="text-slate-300 font-semibold">VISTA BI Studio Platform</span>
          </div>
          <div>© 2026 VISTA BI Studio. All rights reserved. • ระบบวิเคราะห์ข้อมูลและแดชบอร์ดอัจฉริยะ</div>
        </div>
      </footer>

      {/* Clean Authentication Modal (Only Sign In & Register) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#15102d] border border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-violet-950/50 flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm transition cursor-pointer"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/30 border border-violet-400/30">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">
                  {activeAuthTab === 'login' ? 'เข้าสู่ระบบแดชบอร์ด' : 'ลงทะเบียนสมาชิกใหม่'}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeAuthTab === 'login'
                    ? 'กรอกข้อมูลบัญชีเพื่อเข้าสู่หน้าแดชบอร์ดของคุณ'
                    : 'สร้างบัญชีผู้ใช้ใหม่เพื่อเริ่มต้นใช้งาน'}
                </p>
              </div>
            </div>

            {/* 2 Tabs: เข้าสู่ระบบ / สมัครสมาชิก */}
            <div className="grid grid-cols-2 gap-1 bg-[#0e0a22] p-1.5 rounded-2xl border border-violet-500/20 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveAuthTab('login');
                  setAuthError(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeAuthTab === 'login'
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
                  setActiveAuthTab('register');
                  setAuthError(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeAuthTab === 'register'
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

            {/* TAB 1: เข้าสู่ระบบ */}
            {activeAuthTab === 'login' && (
              <form onSubmit={handlePerformLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    อีเมล หรือ ชื่อผู้ใช้ / User ID
                  </label>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="เช่น user1 หรืออีเมลของคุณ"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0e0a22] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
                    autoFocus
                  />
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
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านของคุณ"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0e0a22] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
                  />
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
                    onClick={() => setActiveAuthTab('register')}
                    className="text-violet-400 hover:underline font-bold cursor-pointer"
                  >
                    ลงทะเบียนสร้างบัญชีใหม่
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: สมัครสมาชิก */}
            {activeAuthTab === 'register' && (
              <form onSubmit={handlePerformRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ชื่อ-นามสกุล / Display Name
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี หรือ user1"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0e0a22] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    อีเมล หรือ ชื่อบัญชี (สำหรับใช้เข้าสู่ระบบ)
                  </label>
                  <input
                    type="text"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="เช่น user1@company.com หรือ user1"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0e0a22] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">แผนก / บทบาท</label>
                  <input
                    type="text"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    placeholder="เช่น ฝ่ายขาย, การตลาด, วิจัยและพัฒนา"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0e0a22] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">กำหนดรหัสผ่าน</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="กำหนดรหัสผ่าน (อย่างน้อย 4 ตัวอักษร)"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0e0a22] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
                  />
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
                      <span>สร้างบัญชีและเข้าสู่ระบบทันที</span>
                    </>
                  )}
                </button>

                <div className="pt-2 text-center text-xs text-slate-400">
                  มีบัญชีอยู่แล้วใช่หรือไม่?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveAuthTab('login')}
                    className="text-violet-400 hover:underline font-bold cursor-pointer"
                  >
                    เข้าสู่ระบบที่นี่
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
