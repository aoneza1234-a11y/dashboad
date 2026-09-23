import React, { useState, useEffect } from 'react';
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Power,
  X,
  AlertTriangle,
  Lock,
  Sparkles,
  Info,
  Clock,
  Eye,
} from 'lucide-react';
import {
  SiteStatus,
  getSiteStatus,
  saveSiteStatus,
  toggleSiteOnline,
} from '../services/siteStatusStore';

interface SharePublicPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardTitle: string;
  onPreviewViewer?: () => void;
}

export const SharePublicPortalModal: React.FC<SharePublicPortalModalProps> = ({
  isOpen,
  onClose,
  dashboardTitle,
  onPreviewViewer,
}) => {
  const [siteStatus, setSiteStatus] = useState<SiteStatus>(getSiteStatus());
  const [copiedLink, setCopiedLink] = useState(false);
  const [editingMessage, setEditingMessage] = useState(false);
  const [mTitle, setMTitle] = useState(siteStatus.maintenanceTitle);
  const [mMessage, setMMessage] = useState(siteStatus.maintenanceMessage);

  useEffect(() => {
    if (isOpen) {
      const current = getSiteStatus();
      setSiteStatus(current);
      setMTitle(current.maintenanceTitle);
      setMMessage(current.maintenanceMessage);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?portal=viewer`
      : '';

  const handleCopy = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleToggleOnline = () => {
    const updated = toggleSiteOnline();
    setSiteStatus(updated);
  };

  const handleSaveMaintenanceInfo = () => {
    const updated = saveSiteStatus({
      maintenanceTitle: mTitle,
      maintenanceMessage: mMessage,
    });
    setSiteStatus(updated);
    setEditingMessage(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#171330] border border-violet-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-violet-500/20 bg-gradient-to-r from-violet-950/70 to-indigo-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <span>จัดการเว็บไซต์สำหรับผู้ใช้งาน</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-600/30 border border-violet-500/40 text-violet-200">
                  คนละเว็บกับแอดมิน
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                ตั้งค่าการเปิด-ปิดเว็บ และส่งลิงก์ดูแดชบอร์ดเฉพาะผู้ใช้งานปลายทาง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* 1. Master Web Status Toggle (ระบบเปิด-ปิดเว็บ) */}
          <div className="p-4 rounded-2xl bg-[#1e1840] border border-violet-500/30">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">
                    สถานะการเปิดให้บริการเว็บไซต์ผู้ใช้งาน:
                  </span>
                  {siteStatus.isOnline ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      ออนไลน์ (เปิดให้เข้าชมปกติ)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      ปิดปรับปรุงชั่วคราว (Maintenance)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {siteStatus.isOnline
                    ? 'ผู้ใช้ทั่วไปที่มีลิงก์สามารถเปิดดูแดชบอร์ด กรองข้อมูล และดูตัวเลขได้ตามปกติ'
                    : 'ผู้ใช้ทั่วไปที่เปิดลิงก์จะเห็นหน้า "เว็บไซต์ปิดปรับปรุงชั่วคราว" และไม่เห็นข้อมูลแดชบอร์ด'}
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleOnline}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-md ${
                  siteStatus.isOnline ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
                title={siteStatus.isOnline ? 'คลิกเพื่อปิดปรับปรุงเว็บ' : 'คลิกเพื่อเปิดเว็บออนไลน์'}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    siteStatus.isOnline ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* If offline, allow editing maintenance message */}
            {!siteStatus.isOnline && (
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    ข้อความที่จะแสดงเมื่อผู้ใช้เข้าเว็บขณะปิดปรับปรุง:
                  </span>
                  {!editingMessage && (
                    <button
                      onClick={() => setEditingMessage(true)}
                      className="text-[11px] text-violet-300 hover:text-violet-200 underline cursor-pointer"
                    >
                      แก้ไขข้อความ
                    </button>
                  )}
                </div>

                {editingMessage ? (
                  <div className="space-y-2 mt-2">
                    <input
                      type="text"
                      value={mTitle}
                      onChange={(e) => setMTitle(e.target.value)}
                      placeholder="หัวข้อปิดปรับปรุง..."
                      className="w-full px-3 py-1.5 bg-[#120d26] border border-violet-500/40 rounded-lg text-xs text-white outline-none focus:border-violet-400"
                    />
                    <textarea
                      rows={2}
                      value={mMessage}
                      onChange={(e) => setMMessage(e.target.value)}
                      placeholder="ข้อความชี้แจง..."
                      className="w-full px-3 py-1.5 bg-[#120d26] border border-violet-500/40 rounded-lg text-xs text-white outline-none focus:border-violet-400"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingMessage(false)}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleSaveMaintenanceInfo}
                        className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold"
                      >
                        บันทึกข้อความ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#140e2b] p-2.5 rounded-xl border border-white/5 text-xs text-slate-300">
                    <strong className="text-white block mb-0.5">{siteStatus.maintenanceTitle}</strong>
                    <span className="text-slate-400">{siteStatus.maintenanceMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Public Link URL Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>ลิงก์เฉพาะผู้ใช้งานทั่วไป (Public Viewer Link):</span>
              <span className="text-[11px] text-violet-400 font-normal">
                (มีพารามิเตอร์ <code className="bg-violet-950 px-1 py-0.5 rounded font-mono">?portal=viewer</code>)
              </span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 bg-[#130f29] border border-violet-500/40 rounded-xl px-3.5 py-2.5 text-xs text-violet-200 font-mono select-all focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>คัดลอกลิงก์</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3. Security Guarantee: Separate system */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-emerald-300">
                แยกคนละระบบ คนละเว็บกับแอดมิน 100%
              </p>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                ผู้ใช้งานที่เข้าชมผ่านลิงก์นี้จะไม่มีปุ่ม 'ระบบหลังบ้าน', ไม่มีแถบเมนูปรับแต่งชาร์ต, ไม่เห็นคอนโซลนักพัฒนา และไม่สามารถเปลี่ยนแปลงโครงสร้างแดชบอร์ดได้เลย
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#140f2b] border-t border-violet-500/20 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            อัปเดตสถานะล่าสุด: {new Date(siteStatus.updatedAt).toLocaleTimeString('th-TH')}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                window.open(publicUrl, '_blank');
              }}
              className="px-3.5 py-2 rounded-xl border border-violet-500/40 hover:bg-white/10 text-violet-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดดูในแท็บใหม่</span>
            </button>

            {onPreviewViewer && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPreviewViewer();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>ดูตัวอย่างมุมมองผู้ใช้</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
