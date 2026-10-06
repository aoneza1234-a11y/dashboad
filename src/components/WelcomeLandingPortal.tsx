import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  Lock,
  Mail,
  User,
  Building,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  CheckCircle2,
  RefreshCw,
  Share2,
  Table,
  LineChart,
  Palette,
  Shield,
  HelpCircle,
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
    <div className="min-h-screen w-full bg-[#080915] text-slate-100 flex flex-col justify-between overflow-x-hidden font-sans selection:bg-violet-600 selection:text-white relative">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-violet-600/20 via-indigo-600/10 to-transparent blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 -right-20 w-[600px] h-[600px] bg-fuchsia-800/10 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed top-1/3 -left-32 w-[500px] h-[500px] bg-cyan-700/10 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Modern Top Header (Clean - No Admin Backdoor) */}
      <header className="relative z-20 border-b border-violet-500/15 bg-[#0d0f22]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-600/30 border border-violet-400/30">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">VISTA BI Studio</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-400/30">
                  Cloud BI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">ระบบสร้างแดชบอร์ดและการวิเคราะห์ข้อมูลอัจฉริยะ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('login');
                setAuthError(null);
                const el = document.getElementById('auth-box');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'login'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setAuthError(null);
                const el = document.getElementById('auth-box');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>สมัครสมาชิกใหม่</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-12 sm:gap-16">
        
        {/* Hero Section with Live Showcase Skin */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Hero Title & Value Proposition */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/15 border border-violet-400/30 text-violet-300 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              <span>ระบบบันทึกแยกบัญชีผู้ใช้งานอัตโนมัติ • เชื่อมโยงข้อมูลทุกเบราว์เซอร์</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
              วิเคราะห์ข้อมูลธุรกิจ <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                สร้างแดชบอร์ดระดับมืออาชีพ
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              แพลตฟอร์ม Business Intelligence ที่ให้คุณปรับแต่งกราฟิกอิสระ เชื่อมต่อข้อมูล Google Sheets หรือไฟล์เอกสาร 
              พร้อมระบบคลาวด์ที่บันทึกข้อมูลแยกตามบัญชีของคุณ ไม่ว่าจะเปิดใช้งานจากเครื่องใดหรือเบราว์เซอร์ไหน ข้อมูลจะเชื่อมโยงและตรงกันเสมอ
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-[#121428]/80 border border-violet-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-xs mb-1">
                  <Database className="w-3.5 h-3.5" />
                  <span>Google Sheets</span>
                </div>
                <div className="text-[11px] text-slate-400">ซิงค์ข้อมูลสดอัตโนมัติ</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#121428]/80 border border-violet-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs mb-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Real-time Sync</span>
                </div>
                <div className="text-[11px] text-slate-400">บันทึกเชื่อมโยงทุกอุปกรณ์</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#121428]/80 border border-violet-500/20 backdrop-blur-sm col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Isolated ID</span>
                </div>
                <div className="text-[11px] text-slate-400">แยกข้อมูลส่วนบุคคลปลอดภัย</div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={() => {
                  const el = document.getElementById('auth-box');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-sm transition shadow-xl shadow-violet-600/30 cursor-pointer flex items-center gap-2 group"
              >
                <span>เริ่มใช้งานทันที</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#guide"
                className="text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4 text-violet-400" />
                <span>ดูขั้นตอนการใช้งาน</span>
              </a>
            </div>
          </div>

          {/* Right Column: Live Showcase Skin (สกินแดชบอร์ดสวยงาม) */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl bg-gradient-to-b from-[#181b38] to-[#0f1124] p-3 sm:p-4 border border-violet-500/30 shadow-2xl shadow-violet-950/80 backdrop-blur-xl">
              
              {/* Window Header bar */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-violet-500/20 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium pl-2">ภาพรวมยอดขายและผลประกอบการ • VISTA BI Live</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    ซิงค์ข้อมูลกลาง
                  </span>
                </div>
              </div>

              {/* Mock Dashboard Top KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-[#121428] border border-violet-500/20">
                  <div className="text-[10px] text-slate-400 font-medium">ยอดขายรวม</div>
                  <div className="text-sm font-black text-white mt-0.5">฿2,450,000</div>
                  <div className="text-[9px] text-emerald-400 font-bold mt-0.5">+18.4% จากเดือนก่อน</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#121428] border border-violet-500/20">
                  <div className="text-[10px] text-slate-400 font-medium">กำไรสุทธิ</div>
                  <div className="text-sm font-black text-white mt-0.5">฿890,200</div>
                  <div className="text-[9px] text-indigo-400 font-bold mt-0.5">Margin 36.3%</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#121428] border border-violet-500/20">
                  <div className="text-[10px] text-slate-400 font-medium">คำสั่งซื้อ</div>
                  <div className="text-sm font-black text-white mt-0.5">3,420</div>
                  <div className="text-[9px] text-cyan-400 font-bold mt-0.5">เฉลี่ย ฿716/ออเดอร์</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#121428] border border-violet-500/20">
                  <div className="text-[10px] text-slate-400 font-medium">ลูกค้าใหม่</div>
                  <div className="text-sm font-black text-white mt-0.5">+640 ราย</div>
                  <div className="text-[9px] text-fuchsia-400 font-bold mt-0.5">Active 94.2%</div>
                </div>
              </div>

              {/* Mock Charts Body */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                
                {/* Mock Bar Chart */}
                <div className="p-3 rounded-2xl bg-[#121428] border border-violet-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200">ยอดขายแยกตามหมวดหมู่</span>
                    <span className="text-[9px] text-slate-400">รายเดือน</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                        <span>อิเล็กทรอนิกส์</span>
                        <span className="font-bold text-violet-400">฿980,000</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full w-[85%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                        <span>ของใช้ในบ้าน</span>
                        <span className="font-bold text-indigo-400">฿650,000</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full w-[65%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                        <span>สุขภาพ & ความงาม</span>
                        <span className="font-bold text-fuchsia-400">฿480,000</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full w-[45%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mock Donut Breakdown */}
                <div className="p-3 rounded-2xl bg-[#121428] border border-violet-500/20 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200">สัดส่วนตามภูมิภาค</span>
                    <span className="text-[9px] text-emerald-400">Live</span>
                  </div>
                  <div className="flex items-center justify-around py-1">
                    <div className="w-16 h-16 rounded-full border-4 border-violet-500 border-t-cyan-400 border-r-fuchsia-500 flex items-center justify-center">
                      <span className="text-[10px] font-black text-white">100%</span>
                    </div>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /><span>กรุงเทพฯ (42%)</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400" /><span>ภาคกลาง (24%)</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-fuchsia-500" /><span>ภาคเหนือ (18%)</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Mini Table */}
              <div className="p-3 rounded-2xl bg-[#121428] border border-violet-500/20 text-[11px]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200">รายการขายล่าสุด (อัปเดตอัตโนมัติ)</span>
                  <span className="text-[9px] text-slate-400">ทั้งหมด 20 รายการ</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-400 border-b border-slate-800 pb-1 font-bold">
                  <span>สินค้า</span>
                  <span>ภูมิภาค</span>
                  <span>ยอดเงิน</span>
                  <span className="text-right">สถานะ</span>
                </div>
                <div className="divide-y divide-slate-800/60 pt-1 space-y-1">
                  <div className="grid grid-cols-4 gap-2 text-[10px] pt-1 items-center">
                    <span className="text-slate-200 truncate font-medium">Smart TV 55" 4K</span>
                    <span className="text-slate-400">กรุงเทพฯ</span>
                    <span className="text-white font-bold">฿45,000</span>
                    <span className="text-right"><span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold">สำเร็จ</span></span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[10px] pt-1 items-center">
                    <span className="text-slate-200 truncate font-medium">หุ่นยนต์ดูดฝุ่นอัจฉริยะ</span>
                    <span className="text-slate-400">ตะวันออก</span>
                    <span className="text-white font-bold">฿36,000</span>
                    <span className="text-right"><span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold">สำเร็จ</span></span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Step-by-Step Explanation Guide ("อธิบายการใช้โปรแกรมหน้าเว็ปคร่าวๆ") */}
        <section id="guide" className="space-y-6 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ขั้นตอนการใช้งานโปรแกรมง่ายๆ 4 ขั้นตอน
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              ทุกสิ่งที่คุณปรับแต่ง ทั้งกราฟิก เทมเพลต และการตั้งค่า จะถูกบันทึกเชื่อมโยงกับบัญชีของคุณโดยอัตโนมัติ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Step 1 */}
            <div className="p-5 rounded-3xl bg-[#101226]/90 border border-violet-500/20 hover:border-violet-400/40 transition shadow-lg relative group">
              <div className="w-10 h-10 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center font-black text-sm mb-4 group-hover:scale-105 transition-transform">
                01
              </div>
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                <LogIn className="w-4 h-4 text-violet-400" />
                <span>ลงชื่อเข้าใช้หรือสมัครใหม่</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                เข้าสู่ระบบด้วยชื่อผู้ใช้ของคุณ เพื่อเปิดพื้นที่ทำงานส่วนตัว ทุกการกระทำจะถูกบันทึกแยกบัญชีอย่างอิสระ
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-3xl bg-[#101226]/90 border border-violet-500/20 hover:border-cyan-400/40 transition shadow-lg relative group">
              <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black text-sm mb-4 group-hover:scale-105 transition-transform">
                02
              </div>
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>เชื่อมต่อข้อมูลหรือชีต</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                เลือกใช้ข้อมูลตัวอย่างที่มีให้ หรือเชื่อมโยง Google Sheets / อัปโหลดไฟล์เพื่อนำเข้าข้อมูลธุรกิจสดๆ ทันที
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-3xl bg-[#101226]/90 border border-violet-500/20 hover:border-indigo-400/40 transition shadow-lg relative group">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-sm mb-4 group-hover:scale-105 transition-transform">
                03
              </div>
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>ปรับแต่งกราฟิกและธีม</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ลากวาง เพิ่มการ์ด KPI, กราฟแท่ง, กราฟวงกลม, ตาราง และเลือกชุดสีพร้อมระยะห่างเลย์เอาต์ตามใจชอบ
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-3xl bg-[#101226]/90 border border-violet-500/20 hover:border-emerald-400/40 transition shadow-lg relative group">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm mb-4 group-hover:scale-105 transition-transform">
                04
              </div>
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>บันทึกกลาง & ซิงค์ทุกที่</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ระบบจะเซฟขึ้นคลาวด์ เมื่อคุณเข้าใช้งานบัญชีเดิมจากเครื่องอื่น ข้อมูลจะเหมือนกันทุกประการ 100%
              </p>
            </div>

          </div>
        </section>

        {/* Authentication Card Section ("ค่อยให้ค่อยสมัครหรือลงชื่อเข้า") */}
        <section id="auth-box" className="pt-2 flex flex-col items-center">
          <div className="w-full max-w-md bg-[#12152e]/95 border border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-violet-950/70 backdrop-blur-xl">
            
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
                    ? 'กรอกชื่อผู้ใช้หรืออีเมลของคุณเพื่อเปิดแดชบอร์ดส่วนตัว'
                    : 'สร้างบัญชีผู้ใช้งานใหม่เพื่อเริ่มออกแบบแดชบอร์ด'}
                </p>
              </div>
            </div>

            {/* 2 Tabs: เข้าสู่ระบบ / สมัครสมาชิก */}
            <div className="grid grid-cols-2 gap-1 bg-[#090b1c] p-1.5 rounded-2xl border border-violet-500/20 mb-6">
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
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>สมัครสมาชิก</span>
              </button>
            </div>

            {/* Error Message Alert */}
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090b1c] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090b1c] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs transition shadow-lg shadow-violet-600/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังเข้าสู่ระบบ...</span>
                    </span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>เข้าสู่ระบบแดชบอร์ด</span>
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090b1c] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090b1c] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090b1c] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090b1c] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังสร้างบัญชี...</span>
                    </span>
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
        </section>

      </main>

      {/* Enterprise Footer */}
      <footer className="border-t border-violet-500/15 bg-[#090b1a] py-6 px-6 text-center text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">VISTA BI Studio Platform</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">ระบบคลาวด์วิเคราะห์ข้อมูลและแดชบอร์ด</span>
          </div>
          <div className="text-[11px] text-slate-500">
            © 2026 VISTA BI Studio • ระบบปลอดภัยและซิงค์ข้อมูลแยกรายบุคคล
          </div>
        </div>
      </footer>
    </div>
  );
};
