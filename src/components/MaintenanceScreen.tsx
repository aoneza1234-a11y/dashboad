import React, { useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { SiteStatus, startSiteStatusSync } from '../services/siteStatusStore';

interface MaintenanceScreenProps {
  status: SiteStatus;
  onRefresh: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  status,
  onRefresh,
}) => {
  // Auto-detect when Admin turns site back online across any browser
  useEffect(() => {
    const unsub = startSiteStatusSync((updated) => {
      if (updated.isOnline) {
        onRefresh();
      }
    });
    return () => unsub();
  }, [onRefresh]);

  return (
    <div className="min-h-screen w-screen bg-[#0d0a1a] text-white flex flex-col items-center justify-center p-6 select-none relative overflow-hidden font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 max-w-xl w-full bg-[#16122d]/95 border border-violet-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center flex flex-col items-center">
        {/* Animated Status Icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-violet-600/30 border border-amber-400/40 flex items-center justify-center mb-6 shadow-xl relative">
          <ShieldAlert className="w-10 h-10 text-amber-400 animate-pulse" />
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
          </span>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>สถานะ: เว็บไซต์ปิดปรับปรุงชั่วคราว</span>
        </div>

        {/* Title & Message as configured by Admin */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          {status.maintenanceTitle || 'เว็บไซต์ปิดปรับปรุงชั่วคราว'}
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed mb-6 max-w-md">
          {status.maintenanceMessage ||
            'ขณะนี้ผู้ดูแลระบบกำลังอัปเดตข้อมูลและปรับปรุงแดชบอร์ด ระบบจะเปิดให้บริการตามปกติเร็วๆ นี้ กรุณากลับมาใหม่อีกครั้งในภายหลัง'}
        </p>

        {/* Status Information Box */}
        <div className="w-full bg-[#1f193d] border border-violet-500/20 rounded-2xl p-4 text-left space-y-2.5 mb-6 text-xs text-slate-300">
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              แจ้งเตือนเมื่อ
            </span>
            <span className="font-mono text-slate-200">
              {status.updatedAt ? new Date(status.updatedAt).toLocaleString('th-TH') : new Date().toLocaleString('th-TH')}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-slate-400">สถานะระบบ</span>
            <span className="text-amber-400 font-semibold">ปิดปรับปรุงชั่วคราว</span>
          </div>

          {status.contactEmail && (
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                ติดต่อผู้ดูแลระบบ
              </span>
              <span className="font-mono text-cyan-300">{status.contactEmail}</span>
            </div>
          )}
        </div>

        {/* Action button: Refresh only - NO bypass, NO backdoor */}
        <button
          onClick={onRefresh}
          className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-violet-900/30 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>รีเฟรชหน้าเว็บเพื่อตรวจสอบสถานะ</span>
        </button>
      </div>

      {/* Footer copyright */}
      <div className="mt-8 text-xs text-slate-500 text-center relative z-10">
        <p>VISTA BI Studio Platform • ระบบบริหารจัดการข้อมูลและแดชบอร์ด</p>
      </div>
    </div>
  );
};
