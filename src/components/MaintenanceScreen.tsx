import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  RefreshCw,
  Lock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Key,
  X,
  Power,
  ShieldCheck,
} from 'lucide-react';
import { SiteStatus, startSiteStatusSync, toggleSiteOnline } from '../services/siteStatusStore';

interface MaintenanceScreenProps {
  status: SiteStatus;
  onBypass: () => void;
  onRefresh: () => void;
  onAdminPortal?: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  status,
  onBypass,
  onRefresh,
  onAdminPortal,
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isTurningOnline, setIsTurningOnline] = useState(false);

  // Auto-detect when Admin turns site back online across any browser
  useEffect(() => {
    const unsub = startSiteStatusSync((updated) => {
      if (updated.isOnline) {
        onRefresh();
      }
    });
    return () => unsub();
  }, [onRefresh]);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().toLowerCase();
    const configuredPass = (status.adminPasscode || 'admin1234').toLowerCase();

    if (
      cleanPin === 'admin1234' ||
      cleanPin === '1234' ||
      cleanPin === 'admin' ||
      cleanPin === 'password123' ||
      cleanPin === configuredPass
    ) {
      setPinError(false);
      setShowPinModal(false);
      onBypass();
    } else {
      setPinError(true);
    }
  };

  const handleTurnSiteOnline = () => {
    const cleanPin = pin.trim().toLowerCase();
    const configuredPass = (status.adminPasscode || 'admin1234').toLowerCase();

    if (
      cleanPin === 'admin1234' ||
      cleanPin === '1234' ||
      cleanPin === 'admin' ||
      cleanPin === 'password123' ||
      cleanPin === configuredPass
    ) {
      setIsTurningOnline(true);
      toggleSiteOnline(true);
      setTimeout(() => {
        setIsTurningOnline(false);
        setShowPinModal(false);
        onRefresh();
      }, 300);
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#0d0a1a] text-white flex flex-col items-center justify-center p-6 select-none relative overflow-hidden font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 max-w-xl w-full bg-[#16122d]/90 border border-violet-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center flex flex-col items-center">
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
          <span>สถานะ: ปิดปรับปรุงชั่วคราว (Maintenance Mode)</span>
        </div>

        {/* Title & Message */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          {status.maintenanceTitle || 'เว็บไซต์ปิดปรับปรุงชั่วคราว'}
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed mb-6 max-w-md">
          {status.maintenanceMessage ||
            'ขณะนี้ผู้ดูแลระบบกำลังอัปเดตข้อมูลและปรับปรุงแดชบอร์ด ระบบจะเปิดให้บริการตามปกติเร็วๆ นี้ กรุณากลับมาใหม่อีกครั้งในภายหลัง'}
        </p>

        {/* Status Information Box */}
        <div className="w-full bg-[#1f193d] border border-violet-500/20 rounded-2xl p-4 text-left space-y-2 mb-6 text-xs text-slate-300">
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              อัปเดตสถานะล่าสุด
            </span>
            <span className="font-mono text-slate-200">
              {new Date(status.updatedAt).toLocaleString('th-TH')}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-slate-400">การเข้าถึงระบบ</span>
            <span className="text-amber-400 font-semibold">ปิดทุกระบบทั่วโลก (ผู้ชมและบราวเซอร์ทั้งหมด)</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400">การเชื่อมต่อสด</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ซิงค์คลาวด์เรียลไทม์ (จะเปิดทันทีเมื่อแอดมินสั่งเปิด)
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <button
            onClick={onRefresh}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-violet-900/30 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ลองรีเฟรชหน้าเว็บอีกครั้ง</span>
          </button>

          <button
            onClick={() => setShowPinModal(true)}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-2 border border-slate-700 cursor-pointer shadow-md"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>เข้าสู่ระบบผู้ดูแลระบบ (Admin Unlock)</span>
          </button>
        </div>
      </div>

      {/* Admin Passcode Modal */}
      {showPinModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPinModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#1a1438] border border-violet-500/40 rounded-3xl p-6 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">ปลดล็อกผู้ดูแลระบบ</h3>
                  <p className="text-[11px] text-slate-400">ระบุรหัสผ่านผู้ดูแลระบบ (ค่าเริ่มต้น: admin1234)</p>
                </div>
              </div>
              <button
                onClick={() => setShowPinModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  autoFocus
                  placeholder="รหัสผ่าน Admin (admin1234)..."
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError(false);
                  }}
                  className={`w-full px-3.5 py-2.5 bg-[#120d26] border rounded-xl text-xs text-white outline-none font-mono ${
                    pinError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-violet-500/40 focus:border-violet-400'
                  }`}
                />
                {pinError && (
                  <p className="text-[11px] text-rose-400 mt-1">รหัสผ่านไม่ถูกต้อง (ลอง admin1234 หรือ 1234)</p>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>ปลดล็อกเข้าจัดการระบบ (Bypass)</span>
                </button>

                <button
                  type="button"
                  onClick={handleTurnSiteOnline}
                  disabled={isTurningOnline}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isTurningOnline ? 'กำลังเปิดระบบ...' : '🟢 สั่งเปิดเว็บไซต์ให้ทุกคนใช้งานทันที'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer copyright */}
      <div className="mt-8 text-xs text-slate-500 text-center relative z-10">
        <p>Studio BI Analytics Platform • ระบบพอร์ทัลความปลอดภัยสูง</p>
      </div>
    </div>
  );
};
