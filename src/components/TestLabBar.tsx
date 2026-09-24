import React, { useState } from 'react';
import {
  FlaskConical,
  ArrowRight,
  UserCheck,
  Shield,
  User,
  LogOut,
  Sparkles,
  ExternalLink,
  Info,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { TeamUser } from '../types';

interface TestLabBarProps {
  currentUser: TeamUser | null;
  onSwitchUser: (email: string) => Promise<void>;
  onLogout: () => void;
  onNavigateToUserPortal: () => void;
  recordCount: number;
  widgetCount: number;
}

export const TestLabBar: React.FC<TestLabBarProps> = ({
  currentUser,
  onSwitchUser,
  onLogout,
  onNavigateToUserPortal,
  recordCount,
  widgetCount,
}) => {
  const [switching, setSwitching] = useState<string | null>(null);

  const handleQuickSwitch = async (email: string, label: string) => {
    setSwitching(label);
    try {
      await onSwitchUser(email);
    } finally {
      setTimeout(() => setSwitching(null), 300);
    }
  };

  const isUserA = currentUser?.email === 'komsan.m@team.internal';
  const isUserB = currentUser?.email === 'nattapong.s@team.internal';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'aoneza953@gmail.com';

  return (
    <aside aria-label="แถบจำลองการทดสอบระบบ" className="w-full bg-gradient-to-r from-amber-950/90 via-[#1f1738] to-[#120e24] border-b border-amber-500/40 px-4 py-2 text-white shadow-lg relative z-40 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Test Lab Route Identity */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold shadow-xs">
            <FlaskConical className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-mono">QA Sandbox Domain</span>
            <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-bold uppercase">
              Dev / Test
            </span>
          </div>
          <div className="hidden sm:block">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span>ห้องทดสอบมุมมองผู้ใช้ (Sandbox Domain)</span>
            </div>
            <p className="text-[10px] text-amber-200/80">
              {isAdmin
                ? '👑 มุมมอง Admin: เข้าถึงข้อมูลและจัดการได้ทุกระบบ'
                : isUserA
                ? '🔒 มุมมอง User A: ข้อมูลถูกแยกเฉพาะของ Komsan เท่านั้น (ไม่ปนกับ User B)'
                : isUserB
                ? '🔒 มุมมอง User B: ข้อมูลถูกแยกเฉพาะของ Nattapong เท่านั้น (ไม่ปนกับ User A)'
                : 'ยังไม่ได้เลือก Persona สำหรับทดสอบ'}
            </p>
          </div>
        </div>

        {/* Center: Quick Persona Switcher for Testers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
            สลับ Persona:
          </span>

          {/* Admin Persona */}
          <button
            onClick={() => handleQuickSwitch('aoneza953@gmail.com', 'Admin')}
            disabled={switching !== null}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-xs ${
              isAdmin
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                : 'bg-[#2a224a] hover:bg-[#392e66] text-slate-200 border border-white/10'
            }`}
            title="สลับเป็นผู้ดูแลระบบ (Admin) เพื่อดูแดชบอร์ดทั้งหมด"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-300" />
            <span>Thirawat (Admin)</span>
            {isAdmin && <CheckCircle2 className="w-3 h-3 text-white ml-0.5" />}
          </button>

          {/* User A Persona */}
          <button
            onClick={() => handleQuickSwitch('komsan.m@team.internal', 'User A')}
            disabled={switching !== null}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-xs ${
              isUserA
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 ring-1 ring-violet-400'
                : 'bg-[#2a224a] hover:bg-[#392e66] text-slate-200 border border-white/10'
            }`}
            title="สลับเป็น User A (Komsan) - ทดสอบการแยกแดชบอร์ดเฉพาะคน"
          >
            <User className="w-3.5 h-3.5 text-violet-300" />
            <span>User A (Komsan)</span>
            {isUserA && <CheckCircle2 className="w-3 h-3 text-white ml-0.5" />}
          </button>

          {/* User B Persona */}
          <button
            onClick={() => handleQuickSwitch('nattapong.s@team.internal', 'User B')}
            disabled={switching !== null}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-xs ${
              isUserB
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                : 'bg-[#2a224a] hover:bg-[#392e66] text-slate-200 border border-white/10'
            }`}
            title="สลับเป็น User B (Nattapong) - ทดสอบการแยกแดชบอร์ดเฉพาะคน"
          >
            <User className="w-3.5 h-3.5 text-indigo-300" />
            <span>User B (Nattapong)</span>
            {isUserB && <CheckCircle2 className="w-3 h-3 text-white ml-0.5" />}
          </button>

          {currentUser && (
            <button
              onClick={onLogout}
              className="p-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white transition cursor-pointer"
              title="ออกจากระบบ / เคลียร์ Session ทดสอบ"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}

          {switching && (
            <div className="flex items-center gap-1 text-[10px] text-amber-300 animate-pulse ml-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>สลับเป็น {switching}...</span>
            </div>
          )}
        </div>

        {/* Right: Button to Switch to Clean Production User Portal */}
        <div className="flex items-center gap-2">
          <button
            id="btn-goto-user-portal"
            onClick={onNavigateToUserPortal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition transform active:scale-95 cursor-pointer"
            title="สลับไปยังโดเมนผู้ใช้งานจริง (Production Domain) - สะอาดตา ไม่มีปุ่มหรือเครื่องมือเทสใดๆ ทั้งสิ้น"
          >
            <span>เปิดโดเมนผู้ใช้งานจริง (Prod Domain)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
