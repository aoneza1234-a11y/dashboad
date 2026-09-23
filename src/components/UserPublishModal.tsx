import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Eye,
  Lock,
  Calendar,
  Download,
  Code,
  Shield,
  X,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { getSiteStatus, saveSiteStatus, ViewerShareConfig } from '../services/siteStatusStore';

interface UserPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardTitle: string;
  onPreviewViewer: () => void;
}

export const UserPublishModal: React.FC<UserPublishModalProps> = ({
  isOpen,
  onClose,
  dashboardTitle,
  onPreviewViewer,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'embed' | 'settings'>('link');

  // Load viewer settings
  const [viewerConfig, setViewerConfig] = useState<ViewerShareConfig>(() => {
    return getSiteStatus().viewerConfig;
  });

  if (!isOpen) return null;

  const viewerUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?portal=viewer`
    : '';

  const embedCode = `<iframe\n  src="${viewerUrl}"\n  width="100%"\n  height="800px"\n  frameborder="0"\n  allowfullscreen\n></iframe>`;

  const handleCopyLink = () => {
    if (!viewerUrl) return;
    navigator.clipboard.writeText(viewerUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  const handleSaveSettings = (updates: Partial<ViewerShareConfig>) => {
    const updated = { ...viewerConfig, ...updates };
    setViewerConfig(updated);
    saveSiteStatus({ viewerConfig: updated });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#17132e] border border-violet-500/40 rounded-3xl shadow-2xl text-white overflow-hidden text-left"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-violet-950/60 to-[#17132e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-400/40 flex items-center justify-center text-violet-300">
              <Share2 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">เผยแพร่ & แชร์ลิงก์สำหรับผู้ชม (Viewer Link)</h3>
              <p className="text-xs text-slate-400">
                แดชบอร์ด: <span className="text-violet-300 font-semibold">{dashboardTitle || 'รายงานสรุปภาพรวม'}</span>
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

        {/* Tab Selection */}
        <div className="flex items-center border-b border-white/10 px-6 pt-3 gap-2 bg-[#120e24]">
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'link'
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>ลิงก์เข้าดู (Viewer Link)</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'settings'
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>การจำกัดสิทธิ์เข้าดู</span>
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'embed'
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>โค้ดฝังเว็บไซต์ (Embed)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-5">
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-violet-950/40 border border-violet-500/30 flex items-start gap-3">
                <Shield className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-violet-300">
                    ลิงก์สำหรับผู้ชมทั่วไป (Read-only Viewer Link)
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    ผู้ที่เปิดผ่านลิงก์นี้จะสามารถค้นหา, กรองข้อมูล, ดูชาร์ตสถิติ และเปิดดูรูปภาพ/เอกสารได้เต็มรูปแบบ 
                    โดยไม่สามารถแก้ไขโครงสร้าง หรือลบข้อมูลใดๆ ของคุณได้
                  </p>
                </div>
              </div>

              {/* URL Box */}
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-medium block">
                  URL สาธารณะสำหรับส่งให้ผู้บริหารหรือลูกค้า:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={viewerUrl}
                    className="flex-1 bg-[#221c44] border border-violet-500/30 rounded-xl px-3.5 py-2.5 text-xs text-violet-200 font-mono select-all focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-violet-900/40"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
                  </button>
                </div>
              </div>

              {/* Active Protection Badges */}
              <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                {viewerConfig.passwordEnabled && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>ล็อกรหัสผ่าน</span>
                  </span>
                )}
                {viewerConfig.expiryEnabled && viewerConfig.expiryDate && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>หมดอายุ {viewerConfig.expiryDate}</span>
                  </span>
                )}
                <span className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                  viewerConfig.allowDownload
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  <Download className="w-3 h-3" />
                  <span>{viewerConfig.allowDownload ? 'ผู้ชมดาวน์โหลดข้อมูลได้' : 'ห้ามดาวน์โหลดข้อมูล'}</span>
                </span>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                กำหนดเงื่อนไขความปลอดภัยและการเข้าถึงสำหรับลิงก์ผู้ชม:
              </p>

              {/* Password Protection */}
              <div className="p-3.5 rounded-2xl bg-[#201a40] border border-violet-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold text-white">ตั้งรหัสผ่านสำหรับเข้าชม</div>
                      <div className="text-[11px] text-slate-400">ผู้ชมต้องกรอกรหัสผ่านก่อนเข้าดูแดชบอร์ด</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={viewerConfig.passwordEnabled}
                    onChange={(e) => handleSaveSettings({ passwordEnabled: e.target.checked })}
                    className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                  />
                </div>
                {viewerConfig.passwordEnabled && (
                  <input
                    type="text"
                    placeholder="ใส่รหัสผ่าน เช่น 1234 หรือ secure2026"
                    value={viewerConfig.password || ''}
                    onChange={(e) => handleSaveSettings({ password: e.target.value })}
                    className="w-full bg-[#181330] border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-amber-200 focus:outline-none"
                  />
                )}
              </div>

              {/* Expiry Date */}
              <div className="p-3.5 rounded-2xl bg-[#201a40] border border-violet-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-xs font-bold text-white">กำหนดวันหมดอายุของลิงก์</div>
                      <div className="text-[11px] text-slate-400">เมื่อพ้นกำหนด ลิงก์จะปิดการเข้าดูอัตโนมัติ</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={viewerConfig.expiryEnabled}
                    onChange={(e) => handleSaveSettings({ expiryEnabled: e.target.checked })}
                    className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                  />
                </div>
                {viewerConfig.expiryEnabled && (
                  <input
                    type="date"
                    value={viewerConfig.expiryDate || ''}
                    onChange={(e) => handleSaveSettings({ expiryDate: e.target.value })}
                    className="w-full bg-[#181330] border border-blue-500/40 rounded-xl px-3 py-2 text-xs text-blue-200 focus:outline-none"
                  />
                )}
              </div>

              {/* Allow Download */}
              <div className="p-3.5 rounded-2xl bg-[#201a40] border border-violet-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white">อนุญาตให้ผู้ชมดาวน์โหลดข้อมูล</div>
                    <div className="text-[11px] text-slate-400">อนุญาตให้ส่งออกเป็น Excel, CSV หรือรายงานสรุป</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={viewerConfig.allowDownload}
                  onChange={(e) => handleSaveSettings({ allowDownload: e.target.checked })}
                  className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'embed' && (
            <div className="space-y-3">
              <label className="text-xs text-slate-300 font-medium block">
                คัดลอกโค้ด HTML เพื่อนำไปฝังใน Intranet, Portal หรือเว็บไซต์ของคุณ:
              </label>
              <div className="relative">
                <pre className="w-full bg-[#0d0a1a] border border-violet-500/30 rounded-xl p-3.5 text-xs text-emerald-400 font-mono overflow-x-auto select-all leading-relaxed">
                  {embedCode}
                </pre>
                <button
                  onClick={handleCopyEmbed}
                  className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-violet-600/80 hover:bg-violet-600 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow"
                >
                  {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmbed ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                รองรับการนำไปฝังบน WordPress, Google Sites, Notion หรือระบบภายในองค์กร
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#120e24] border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => {
              if (viewerUrl) {
                window.open(viewerUrl, '_blank');
              }
            }}
            className="px-3.5 py-2 rounded-xl border border-violet-500/30 hover:bg-white/10 text-violet-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>เปิดทดสอบในแท็บใหม่</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onPreviewViewer();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>สลับไปดูมุมมองผู้ชมทันที</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
