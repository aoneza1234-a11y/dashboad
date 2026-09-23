import React, { useState } from 'react';
import {
  User,
  Key,
  Lock,
  Mail,
  Shield,
  Bell,
  Copy,
  Check,
  RefreshCw,
  X,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { TeamUser } from '../types';
import { switchSessionRole } from '../services/teamAuthStore';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: TeamUser | null;
  onUpdateUser?: (updated: Partial<TeamUser>) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'api_keys'>('profile');
  const [displayName, setDisplayName] = useState(currentUser?.displayName || 'Thirawat (ผู้ใช้งาน)');
  const [email] = useState(currentUser?.email || 'aoneza953@gmail.com');
  const [department, setDepartment] = useState(currentUser?.department || 'Analytics & Sales');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passSaved, setPassSaved] = useState(false);
  const [apiKey, setApiKey] = useState('bi_sec_live_99f2b8417c804ab182');
  const [copiedKey, setCopiedKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateUser) {
      onUpdateUser({ displayName, department });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass.trim()) return;
    setPassSaved(true);
    setCurrentPass('');
    setNewPass('');
    setTimeout(() => setPassSaved(false), 3000);
  };

  const handleGenerateKey = () => {
    const fresh = 'bi_sec_live_' + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 10);
    setApiKey(fresh);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#17132e] border border-violet-500/40 rounded-3xl shadow-2xl text-white overflow-hidden text-left"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-violet-950/60 to-[#17132e]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{displayName}</h3>
                {currentUser?.role === 'admin' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    👑 Admin
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                    👥 Member
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-white/10 px-6 pt-3 gap-2 bg-[#120e24]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'profile'
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>โปรไฟล์ของฉัน</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'security'
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>เปลี่ยนรหัสผ่าน</span>
          </button>
          <button
            onClick={() => setActiveTab('api_keys')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'api_keys'
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>จัดการ API Key</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Role description card */}
              <div className="p-3.5 rounded-2xl bg-[#201a40] border border-violet-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">ระดับสิทธิ์ในระบบ:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                    currentUser?.role === 'admin'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                  }`}>
                    {currentUser?.role === 'admin' ? '👑 ผู้ดูแลระบบ (Admin)' : '👥 ผู้ใช้งานทั่วไป (Member / Editor)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {currentUser?.role === 'admin'
                    ? 'สิทธิ์แอดมิน: สามารถเข้าถึงระบบหลังบ้าน (Admin Platform) เปิด-ปิดเว็บ จัดการผู้ใช้ และระบบผู้ใช้งาน (Studio) ได้เต็มรูปแบบ'
                    : 'สิทธิ์ผู้ใช้งาน: สามารถสร้าง ออกแบบแดชบอร์ด ซิงค์ Google Sheets และจัดการชิ้นงานของตนเอง โดยไม่มีสิทธิ์เข้าถึงระบบแอดมินหลังบ้าน'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium block">ชื่อที่ใช้แสดง:</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#201a40] border border-violet-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium block">อีเมลสมาชิก:</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full bg-[#181330] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium block">แผนก / ตำแหน่ง:</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#201a40] border border-violet-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
              </div>

              {savedSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-violet-900/30"
              >
                บันทึกการเปลี่ยนแปลง
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium block">รหัสผ่านปัจจุบัน:</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full bg-[#201a40] border border-violet-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium block">รหัสผ่านใหม่:</label>
                <input
                  type="password"
                  placeholder="รหัสผ่านใหม่ความยาวอย่างน้อย 8 ตัวอักษร"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full bg-[#201a40] border border-violet-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
              </div>

              {passSaved && (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-violet-900/30"
              >
                อัปเดตรหัสผ่าน
              </button>
            </form>
          )}

          {activeTab === 'api_keys' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                ใช้ API Key สำหรับยิงข้อมูลออเดอร์ยอดขายจาก ERP, POS หรือระบบภายนอกเข้ามายังแดชบอร์ดโดยอัตโนมัติ:
              </p>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-medium">Personal Secret API Key:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    readOnly
                    value={apiKey}
                    className="flex-1 bg-[#201a40] border border-violet-500/30 rounded-xl px-3.5 py-2.5 text-xs text-violet-200 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2500);
                    }}
                    className="px-3 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>
              </div>

              <button
                onClick={handleGenerateKey}
                className="px-3.5 py-2 rounded-xl border border-violet-500/30 hover:bg-white/5 text-violet-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>สร้าง API Key ชุดใหม่ (Revoke Old Key)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
