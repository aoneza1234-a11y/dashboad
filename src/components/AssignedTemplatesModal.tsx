import React, { useMemo } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Check,
  X,
  Send,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { DashboardTemplate } from '../types';
import { getAssignedTemplatesForUser, getDashboardTemplates } from '../services/templateStore';

interface AssignedTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates?: DashboardTemplate[];
  userName?: string;
  currentUserId?: string;
  onAdoptTemplate?: (template: DashboardTemplate) => void;
  onSelectTemplate?: (template: DashboardTemplate) => void;
}

export const AssignedTemplatesModal: React.FC<AssignedTemplatesModalProps> = ({
  isOpen,
  onClose,
  templates,
  userName = 'คุณ',
  currentUserId = 'all',
  onAdoptTemplate,
  onSelectTemplate,
}) => {
  const displayTemplates = useMemo(() => {
    if (templates && Array.isArray(templates)) {
      return templates;
    }
    if (currentUserId) {
      return getAssignedTemplatesForUser(currentUserId);
    }
    return getDashboardTemplates();
  }, [templates, currentUserId]);

  if (!isOpen) return null;

  const handleSelect = (tpl: DashboardTemplate) => {
    if (onSelectTemplate) onSelectTemplate(tpl);
    if (onAdoptTemplate) onAdoptTemplate(tpl);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#16122c] border border-violet-500/40 rounded-2xl shadow-2xl p-6 text-white text-left max-h-[85vh] flex flex-col relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#29204e] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-500/50 flex items-center justify-center text-violet-300">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                เทมเพลตที่ได้รับมอบหมาย (Assigned Dashboard Templates)
              </h2>
              <p className="text-xs text-slate-400">
                แม่แบบสำเร็จรูปที่แอดมินระบบหลังบ้านส่งมาให้คุณ ({userName}) นำไปใช้งานหรือปรับแต่งต่อ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
          {displayTemplates.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <LayoutDashboard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">ยังไม่มีเทมเพลตที่ส่งถึงคุณในขณะนี้</p>
              <p className="text-xs text-slate-500 mt-1">
                เมื่อผู้ดูแลระบบสร้างและแจกจ่ายเทมเพลตมายังบัญชีของคุณ จะแสดงขึ้นที่นี่โดยอัตโนมัติ
              </p>
            </div>
          ) : (
            displayTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-4 rounded-xl bg-[#1d1738] border border-violet-500/30 hover:border-violet-400/60 transition group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-bold">
                      {tpl.category}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {tpl.createdAt}
                    </span>
                    <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      โดย {tpl.createdBy}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white group-hover:text-violet-200 transition">
                    {tpl.title || tpl.name}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{tpl.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-violet-400" />
                      {tpl.widgets?.length || 0} วิชวลชาร์ตพร้อมใช้งาน
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">แก้ไขและปรับแต่งได้อย่างอิสระ</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => handleSelect(tpl)}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md shadow-violet-800/30 flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>นำไปสร้างแดชบอร์ด</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-[#29204e] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>คุณสามารถปรับแต่ง ย้ายขนาด และบันทึกเป็นแดชบอร์ดส่วนตัวของคุณได้ 100%</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-[#241c47] hover:bg-[#322663] text-slate-300 text-xs transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
