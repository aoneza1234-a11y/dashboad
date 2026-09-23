import React from 'react';
import { X, Check, Palette, Sparkles, Type, Square, Box } from 'lucide-react';
import { ThemeConfig, ThemePreset } from '../types';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeConfig: ThemeConfig;
  onUpdateTheme: (newConfig: ThemeConfig) => void;
}

interface PresetOption {
  id: ThemePreset;
  label: string;
  sub: string;
  bgClass: string;
  cardBg: string;
  accent: string;
  borderClass: string;
  previewColor: string;
}

const PRESETS: PresetOption[] = [
  {
    id: 'light',
    label: 'สว่าง',
    sub: 'สะอาด สบายตา ไฮคอนทราสต์',
    bgClass: 'bg-slate-100',
    cardBg: 'bg-white',
    accent: '#7c3aed',
    borderClass: 'border-slate-300',
    previewColor: '#f8fafc',
  },
  {
    id: 'midnight',
    label: 'มิดไนท์',
    sub: 'โทนเข้มเนวี คมชัด ไร้แสงสะท้อน',
    bgClass: 'bg-[#090d16]',
    cardBg: 'bg-[#0f172a]',
    accent: '#38bdf8',
    borderClass: 'border-slate-700',
    previewColor: '#0b0f19',
  },
  {
    id: 'ocean',
    label: 'โอเชียน',
    sub: 'โทนสีน้ำทะเลลึก ไซอัน มินต์',
    bgClass: 'bg-[#071326]',
    cardBg: 'bg-[#0e2240]',
    accent: '#06b6d4',
    borderClass: 'border-cyan-900',
    previewColor: '#0a192f',
  },
  {
    id: 'violet',
    label: 'ไวโอเล็ต',
    sub: 'สีม่วงหรูหรา ธีมหลักของ VISTA',
    bgClass: 'bg-[#141224]',
    cardBg: 'bg-[#221c42]',
    accent: '#a855f7',
    borderClass: 'border-purple-800',
    previewColor: '#18152b',
  },
  {
    id: 'forest',
    label: 'ฟอเรสต์',
    sub: 'โทนเขียวมรกต ธรรมชาติ ผ่อนคลาย',
    bgClass: 'bg-[#091611]',
    cardBg: 'bg-[#122a21]',
    accent: '#10b981',
    borderClass: 'border-emerald-800',
    previewColor: '#0d1f18',
  },
  {
    id: 'sunset',
    label: 'ซันเซ็ต',
    sub: 'โทนอาทิตย์อัสดง ส้มชมพูอบอุ่น',
    bgClass: 'bg-[#170c12]',
    cardBg: 'bg-[#2a1721]',
    accent: '#f43f5e',
    borderClass: 'border-rose-900',
    previewColor: '#1f1118',
  },
];

const COLOR_SWATCHES = [
  '#7c3aed', // Violet
  '#6366f1', // Indigo
  '#2563eb', // Blue
  '#0d9488', // Teal
  '#059669', // Emerald
  '#d97706', // Amber
  '#ea580c', // Orange
  '#e11d48', // Rose
  '#c026d3', // Fuchsia
  '#475569', // Slate
];

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  themeConfig,
  onUpdateTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="modal-workspace-theme"
        className="w-full max-w-lg bg-[#1a1630] border border-[#352c5c] rounded-2xl shadow-2xl text-slate-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2d254e] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/30 text-violet-300 flex items-center justify-center border border-violet-500/40">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">ธีมของพื้นที่ทำงาน</h2>
              <p className="text-xs text-slate-400">เลือกโทนสี ปรับสีหลัก ฟอนต์ มุม และเงาได้</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#282147] text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Preset Grid (6 cards) */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
              <span>เลือกชุดธีมสำเร็จรูป</span>
              <span className="text-[11px] text-violet-400 font-normal">6 สไตล์ที่พร้อมใช้</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PRESETS.map((p) => {
                const isSelected = themeConfig.preset === p.id;
                return (
                  <button
                    key={p.id}
                    id={`theme-preset-${p.id}`}
                    onClick={() =>
                      onUpdateTheme({
                        ...themeConfig,
                        preset: p.id,
                        primaryColor: p.accent,
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between h-24 ${
                      isSelected
                        ? 'border-violet-400 bg-[#251f47] shadow-md ring-2 ring-violet-500/50'
                        : 'border-[#2f2754] bg-[#161329] hover:border-slate-500 hover:bg-[#201a3b]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Mini preview bar */}
                      <div className="flex items-center gap-1">
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: p.accent }}
                        ></span>
                        <span
                          className="w-4 h-2 rounded-xs"
                          style={{ backgroundColor: p.previewColor }}
                        ></span>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-violet-500 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white">{p.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{p.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Color Picker */}
          <div className="pt-2 border-t border-[#2a2249]">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              สีหลัก (Primary Color)
            </label>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateTheme({ ...themeConfig, primaryColor: color })}
                  className={`w-7 h-7 rounded-full transition flex items-center justify-center border ${
                    themeConfig.primaryColor === color
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {themeConfig.primaryColor === color && (
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  )}
                </button>
              ))}
              {/* Custom input */}
              <div className="flex items-center gap-1.5 ml-auto">
                <input
                  type="color"
                  value={themeConfig.primaryColor}
                  onChange={(e) =>
                    onUpdateTheme({ ...themeConfig, primaryColor: e.target.value })
                  }
                  className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-[11px] font-mono text-slate-400">
                  {themeConfig.primaryColor}
                </span>
              </div>
            </div>
          </div>

          {/* Font Family Selection */}
          <div className="pt-2 border-t border-[#2a2249]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
              <Type className="w-3.5 h-3.5 text-violet-400" />
              <span>ฟอนต์ของข้อความ (Font Family)</span>
            </div>
            <select
              value={themeConfig.fontFamily}
              onChange={(e) =>
                onUpdateTheme({
                  ...themeConfig,
                  fontFamily: e.target.value as any,
                })
              }
              className="w-full px-3 py-2 bg-[#161329] border border-[#2f2754] rounded-lg text-white text-xs outline-none focus:border-violet-400"
            >
              <option value="Prompt">Prompt (พร้อมต์ - มาตรฐาน UI ไทยสมัยใหม่)</option>
              <option value="Sarabun">Sarabun (สารบรรณ - เรียบร้อย ทางการ อ่านง่าย)</option>
              <option value="Kanit">Kanit (คณิต - สไตล์ทันสมัย กราฟิกชัดเจน)</option>
              <option value="Inter">Inter (อินเตอร์ - คมชัด เหมาะกับตัวเลขและแดชบอร์ด)</option>
              <option value="system">ระบบ (System Default Font)</option>
            </select>
          </div>

          {/* Corner Radius and Shadow */}
          <div className="pt-2 border-t border-[#2a2249] grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                <Square className="w-3.5 h-3.5 text-violet-400" />
                <span>มุมการ์ด</span>
              </div>
              <select
                value={themeConfig.borderRadius}
                onChange={(e) =>
                  onUpdateTheme({
                    ...themeConfig,
                    borderRadius: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 bg-[#161329] border border-[#2f2754] rounded-lg text-white text-xs outline-none focus:border-violet-400"
              >
                <option value="rounded-none">เหลี่ยม (0px)</option>
                <option value="rounded-lg">มาตรฐาน (10px)</option>
                <option value="rounded-2xl">มนมาก (18px)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                <Box className="w-3.5 h-3.5 text-violet-400" />
                <span>เงาการ์ด</span>
              </div>
              <select
                value={themeConfig.shadowStyle}
                onChange={(e) =>
                  onUpdateTheme({
                    ...themeConfig,
                    shadowStyle: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 bg-[#161329] border border-[#2f2754] rounded-lg text-white text-xs outline-none focus:border-violet-400"
              >
                <option value="shadow-none">ไม่มีเงา</option>
                <option value="shadow-sm">นุ่มตา (Soft)</option>
                <option value="shadow-xl">ชัดเจน (Distinct)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#2d254e] bg-[#151226] flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            ธีมที่เลือก:{' '}
            <span className="text-white font-semibold capitalize">{themeConfig.preset}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};
