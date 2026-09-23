import React from 'react';
import { X, Filter, Check } from 'lucide-react';
import { FilterState } from '../types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterState: FilterState;
  onUpdateFilter: (newFilter: FilterState) => void;
  onResetFilter: () => void;
}

const REGIONS = ['กรุงเทพฯ', 'ตะวันออก', 'ใต้', 'เหนือ'];
const CATEGORIES = ['อิเล็กทรอนิกส์', 'ของใช้ในบ้าน', 'สุขภาพ'];

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filterState,
  onUpdateFilter,
  onResetFilter,
}) => {
  if (!isOpen) return null;

  const toggleRegion = (reg: string) => {
    const exists = filterState.regions.includes(reg);
    const updated = exists
      ? filterState.regions.filter((r) => r !== reg)
      : [...filterState.regions, reg];
    onUpdateFilter({ ...filterState, regions: updated });
  };

  const toggleCategory = (cat: string) => {
    const exists = filterState.categories.includes(cat);
    const updated = exists
      ? filterState.categories.filter((c) => c !== cat)
      : [...filterState.categories, cat];
    onUpdateFilter({ ...filterState, categories: updated });
  };

  return (
    <div
      id="modal-filter"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#18152b] text-slate-200 w-full max-w-md rounded-2xl border border-[#312a59] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#2d2652] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-bold text-white">ตัวกรองข้อมูลแดชบอร์ด</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#251f45] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Region filter */}
          <div>
            <label className="block text-slate-400 font-semibold mb-2">ภูมิภาค (Region)</label>
            <div className="grid grid-cols-2 gap-2">
              {REGIONS.map((reg) => {
                const checked = filterState.regions.includes(reg);
                return (
                  <button
                    key={reg}
                    onClick={() => toggleRegion(reg)}
                    className={`p-2 rounded-lg border text-left flex items-center justify-between transition ${
                      checked
                        ? 'border-violet-500 bg-violet-600/30 text-white font-medium'
                        : 'border-[#332b5e] bg-[#201a3d] text-slate-300 hover:bg-[#27204b]'
                    }`}
                  >
                    <span>{reg}</span>
                    {checked && <Check className="w-3.5 h-3.5 text-violet-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <label className="block text-slate-400 font-semibold mb-2">หมวดหมู่ (Category)</label>
            <div className="space-y-1.5">
              {CATEGORIES.map((cat) => {
                const checked = filterState.categories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition ${
                      checked
                        ? 'border-teal-500 bg-teal-600/30 text-white font-medium'
                        : 'border-[#332b5e] bg-[#201a3d] text-slate-300 hover:bg-[#27204b]'
                    }`}
                  >
                    <span>{cat}</span>
                    {checked && <Check className="w-3.5 h-3.5 text-teal-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#2a234e] bg-[#141124] flex items-center justify-between">
          <button
            onClick={onResetFilter}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            ล้างตัวกรองทั้งหมด
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg transition text-xs"
          >
            นำไปใช้
          </button>
        </div>
      </div>
    </div>
  );
};
