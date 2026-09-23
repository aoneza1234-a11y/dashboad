import React, { useState } from 'react';
import { X, History, Save, RotateCcw, Clock, Check, Layers } from 'lucide-react';
import { DashboardVersion, VisualWidget, SalesRecord } from '../types';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: DashboardVersion[];
  onSaveSnapshot: (title: string) => void;
  onRestoreVersion: (version: DashboardVersion) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  versions,
  onSaveSnapshot,
  onRestoreVersion,
}) => {
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const title = snapshotTitle.trim() || `สแนปช็อต ${new Date().toLocaleTimeString('th-TH')}`;
    onSaveSnapshot(title);
    setSnapshotTitle('');
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="modal-version-history"
        className="w-full max-w-md bg-[#19152e] border border-[#342a59] rounded-2xl shadow-2xl text-slate-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2d244f] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/30 text-violet-300 flex items-center justify-center border border-violet-500/40">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">ประวัติเวอร์ชันของแดชบอร์ด</h2>
              <p className="text-[11px] text-slate-400">บันทึกสแนปช็อตและย้อนกลับเวอร์ชันได้ตลอดเวลา</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#271f45] text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create new snapshot */}
        <div className="p-4 bg-[#141126] border-b border-[#2d244f]">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            บันทึกสแนปช็อตเวอร์ชันปัจจุบัน
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="ชื่อสแนปช็อต (เช่น ก่อนเปลี่ยนสีกราฟ, สรุปไตรมาส 1)"
              value={snapshotTitle}
              onChange={(e) => setSnapshotTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="flex-1 px-3 py-1.5 bg-[#201a3b] border border-[#342a5c] rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-violet-400"
            />
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs flex items-center gap-1.5 shadow transition cursor-pointer shrink-0"
            >
              {justSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{justSaved ? 'บันทึกแล้ว!' : 'บันทึก'}</span>
            </button>
          </div>
        </div>

        {/* Version List */}
        <div className="p-4 overflow-y-auto max-h-72 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            รายการเวอร์ชันที่บันทึกไว้ ({versions.length})
          </div>

          {versions.map((ver, idx) => (
            <div
              key={ver.id}
              className="p-3 rounded-xl bg-[#201a3d] border border-[#302657] hover:border-violet-500/50 flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-violet-950 text-violet-300 flex items-center justify-center border border-violet-800/40">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{ver.title}</span>
                    {idx === 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        ล่าสุด
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{ver.timestamp}</span>
                    <span>•</span>
                    <span>{ver.widgets.length} วิชวล</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onRestoreVersion(ver);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-md bg-[#2d2454] hover:bg-violet-600 text-slate-200 hover:text-white text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
                title="ย้อนกลับมาใช้เวอร์ชันนี้"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ย้อนกลับ</span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2d244f] bg-[#141126] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#251e47] hover:bg-[#30275c] text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
