import React, { useState } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  X,
  Send,
  Sparkles,
} from 'lucide-react';

interface UserNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserNotificationsModal: React.FC<UserNotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState<'realtime' | 'daily' | 'weekly'>('daily');
  const [lineEnabled, setLineEnabled] = useState(false);
  const [lineToken, setLineToken] = useState('');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [testSent, setTestSent] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestLine = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1500);
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
            <div className="w-10 h-10 rounded-2xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300">
              <Bell className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">การแจ้งเตือน (Notifications)</h3>
              <p className="text-xs text-slate-400">
                ตั้งค่ารับแจ้งเตือนเมื่อยอดขายถึงเป้า หรือมีข้อมูลผิดปกติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Email Notification */}
          <div className="p-4 rounded-2xl bg-[#201a40] border border-violet-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-violet-400" />
                <div>
                  <div className="text-xs font-bold text-white">แจ้งเตือนทางอีเมล (Email Alerts)</div>
                  <div className="text-[11px] text-slate-400">ส่งรายงานสรุปยอดขายไปยังกล่องจดหมายของคุณ</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
              />
            </div>
            {emailEnabled && (
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-slate-400">ความถี่:</span>
                <select
                  value={emailFrequency}
                  onChange={(e: any) => setEmailFrequency(e.target.value)}
                  className="bg-[#181330] border border-violet-500/30 rounded-lg px-2.5 py-1 text-xs text-violet-200 focus:outline-none"
                >
                  <option value="realtime">ทันทีที่มีออเดอร์ใหม่</option>
                  <option value="daily">สรุปประจำวัน (09:00 น.)</option>
                  <option value="weekly">สรุปประจำสัปดาห์ (วันจันทร์)</option>
                </select>
              </div>
            )}
          </div>

          {/* Line Notify */}
          <div className="p-4 rounded-2xl bg-[#201a40] border border-violet-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold text-white">Line Notify Webhook</div>
                  <div className="text-[11px] text-slate-400">แจ้งเตือนเข้ากลุ่มไลน์หรือแชตส่วนตัวแบบเรียลไทม์</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={lineEnabled}
                onChange={(e) => setLineEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
              />
            </div>
            {lineEnabled && (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  placeholder="กรอก Line Notify Access Token ของคุณ"
                  value={lineToken}
                  onChange={(e) => setLineToken(e.target.value)}
                  className="w-full bg-[#181330] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestLine}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testSent ? 'ส่งข้อความทดสอบแล้ว!' : 'ทดสอบส่งข้อความเข้า Line'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Web Push */}
          <div className="p-4 rounded-2xl bg-[#201a40] border border-violet-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-xs font-bold text-white">การแจ้งเตือนบนเบราว์เซอร์ (Push Notification)</div>
                <div className="text-[11px] text-slate-400">แจ้งเตือนบนหน้าจอคอมพิวเตอร์และมือถือ</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={(e) => setPushEnabled(e.target.checked)}
              className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
            />
          </div>

          {savedSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกการตั้งค่าการแจ้งเตือนเรียบร้อยแล้ว</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#120e24] border-t border-white/10 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-violet-900/30"
          >
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
};
