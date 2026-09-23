import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Filter,
  X,
  Plus,
  ChevronDown,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  CheckSquare,
  Square,
  ListFilter,
} from 'lucide-react';
import { FilterState, SalesRecord, ActiveFilterRule } from '../types';
import { ThemeStyles } from '../utils/themeStyles';

interface InlineFilterBarProps {
  filterState: FilterState;
  onUpdateFilterState: (partial: Partial<FilterState>) => void;
  onClearFilters: () => void;
  availableColumns: string[];
  salesData: SalesRecord[];
  themeStyles?: ThemeStyles;
}

export const InlineFilterBar: React.FC<InlineFilterBarProps> = ({
  filterState,
  onUpdateFilterState,
  onClearFilters,
  availableColumns,
  salesData,
  themeStyles,
}) => {
  const isDark = themeStyles?.isDark ?? true;
  const [activeDropdownRuleId, setActiveDropdownRuleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<Record<string, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Thai column names mapping
  const columnLabels: Record<string, string> = {
    date: 'วันที่',
    region: 'ภูมิภาค',
    category: 'หมวดหมู่',
    product: 'สินค้า',
    channel: 'ช่องทางจำหน่าย',
    revenue: 'ยอดขาย',
    cost: 'ต้นทุน',
    profit: 'กำไร',
    quantity: 'จำนวนชิ้น',
    orderId: 'รหัสคำสั่งซื้อ',
  };

  const getColLabel = (col: string) => columnLabels[col] || col;

  // Active filter rules
  const rules = filterState.rules || [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdownRuleId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute distinct values and counts for each column
  const columnDistinctValues = useMemo(() => {
    const map: Record<string, { value: string; count: number }[]> = {};
    if (!salesData || salesData.length === 0) return map;

    // Collect all column keys
    const allCols = new Set<string>([
      'region',
      'category',
      'product',
      'channel',
      'date',
      ...availableColumns,
    ]);

    allCols.forEach((col) => {
      const counts: Record<string, number> = {};
      salesData.forEach((row) => {
        const val = row[col];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          const strVal = String(val).trim();
          counts[strVal] = (counts[strVal] || 0) + 1;
        }
      });

      const list = Object.entries(counts).map(([value, count]) => ({ value, count }));
      // Sort descending by count, then alphabetically
      list.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
      map[col] = list;
    });

    return map;
  }, [salesData, availableColumns]);

  // Add a new filter slot
  const handleAddNewSlot = (defaultCol?: string) => {
    const defaultAvailable = ['region', 'category', 'product', 'channel', 'date', ...availableColumns];
    const existingCols = rules.map((r) => r.column);
    const candidate =
      defaultCol || defaultAvailable.find((c) => !existingCols.includes(c)) || 'region';

    const newRule: ActiveFilterRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      column: candidate,
      operator: 'in',
      selectedValues: [],
    };
    onUpdateFilterState({
      rules: [...rules, newRule],
    });
    // Open its dropdown immediately for convenience
    setActiveDropdownRuleId(newRule.id);
  };

  // Update a rule
  const handleUpdateRule = (ruleId: string, updates: Partial<ActiveFilterRule>) => {
    const updated = rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r));
    onUpdateFilterState({ rules: updated });
  };

  // Toggle selection of a single distinct value
  const handleToggleValue = (ruleId: string, value: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    const current = rule.selectedValues || (rule.value ? [rule.value] : []);
    let next: string[];
    if (current.includes(value)) {
      next = current.filter((v) => v !== value);
    } else {
      next = [...current, value];
    }
    handleUpdateRule(ruleId, {
      selectedValues: next,
      value: next.length === 1 ? next[0] : '',
      operator: 'in',
    });
  };

  // Select all distinct values for a column
  const handleSelectAll = (ruleId: string, col: string) => {
    const distinct = columnDistinctValues[col] || [];
    handleUpdateRule(ruleId, {
      selectedValues: distinct.map((d) => d.value),
      value: '',
      operator: 'in',
    });
  };

  // Clear all selections for a rule
  const handleClearRuleSelections = (ruleId: string) => {
    handleUpdateRule(ruleId, {
      selectedValues: [],
      value: '',
    });
  };

  // Remove a filter slot
  const handleRemoveRule = (ruleId: string) => {
    const updated = rules.filter((r) => r.id !== ruleId);
    if (activeDropdownRuleId === ruleId) setActiveDropdownRuleId(null);
    onUpdateFilterState({ rules: updated });
  };

  // Toggle "ไม่นับข้อมูลช่องว่าง"
  const handleToggleSkipBlanks = () => {
    onUpdateFilterState({ skipBlanks: !filterState.skipBlanks });
  };

  const hasActiveFilters =
    rules.some((r) => (r.selectedValues && r.selectedValues.length > 0) || r.value) ||
    filterState.regions.length > 0 ||
    filterState.categories.length > 0 ||
    !!filterState.crossFilter ||
    !!filterState.skipBlanks;

  return (
    <div
      id="bi-inline-filter-bar"
      ref={dropdownRef}
      className={`border-b px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs transition select-none z-30 relative ${
        isDark
          ? 'bg-[#141026]/95 border-[#28214b] text-slate-200'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-2xs'
      }`}
    >
      {/* Left side: Filter Label + Slots */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 font-bold shrink-0 text-violet-400">
          <ListFilter className="w-4 h-4" />
          <span>ตัวกรองข้อมูล:</span>
        </div>

        {/* 1. Skip blanks pill */}
        <button
          id="btn-pill-skip-blanks"
          onClick={handleToggleSkipBlanks}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition cursor-pointer ${
            filterState.skipBlanks
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-semibold shadow-xs'
              : isDark
              ? 'bg-[#1b1535] border-[#362b60] text-slate-300 hover:border-violet-500/50'
              : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
          title="ไม่นับข้อมูลช่องว่าง (Exclude Blank & Null Rows)"
        >
          <span
            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] transition ${
              filterState.skipBlanks
                ? 'border-amber-400 bg-amber-400 text-slate-950 font-bold'
                : isDark
                ? 'border-slate-500'
                : 'border-slate-400'
            }`}
          >
            {filterState.skipBlanks ? '✓' : ''}
          </span>
          <span>ไม่นับแถวว่าง (Skip Blanks)</span>
        </button>

        {/* 2. Column-based Filter Slots */}
        {rules.map((rule) => {
          const distinct = columnDistinctValues[rule.column] || [];
          const selected = rule.selectedValues || (rule.value ? [rule.value] : []);
          const isDropdownOpen = activeDropdownRuleId === rule.id;
          const search = searchQuery[rule.id] || '';

          const filteredDistinct = distinct.filter((item) =>
            item.value.toLowerCase().includes(search.toLowerCase())
          );

          // Format label of selected values
          let summaryLabel = 'ทุกค่า (All)';
          if (selected.length === 1) {
            summaryLabel = selected[0];
          } else if (selected.length > 1) {
            summaryLabel = `${selected[0]} (+${selected.length - 1})`;
          }

          return (
            <div key={rule.id} className="relative flex items-center">
              <div
                className={`flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl border text-xs shadow-xs transition ${
                  selected.length > 0
                    ? isDark
                      ? 'bg-violet-950/40 border-violet-500/70 text-violet-200'
                      : 'bg-violet-50 border-violet-400 text-violet-900'
                    : isDark
                    ? 'bg-[#1c1638] border-violet-500/30 text-slate-200'
                    : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                {/* Column Selector */}
                <select
                  value={rule.column}
                  onChange={(e) => {
                    handleUpdateRule(rule.id, {
                      column: e.target.value,
                      selectedValues: [],
                      value: '',
                    });
                  }}
                  className={`bg-transparent font-bold outline-none cursor-pointer text-xs pr-1 border-r border-violet-500/30 ${
                    isDark ? 'text-violet-300' : 'text-violet-700'
                  }`}
                >
                  <option value="region" className={isDark ? 'bg-[#1b1633] text-white' : 'bg-white'}>
                    ภูมิภาค
                  </option>
                  <option value="category" className={isDark ? 'bg-[#1b1633] text-white' : 'bg-white'}>
                    หมวดหมู่
                  </option>
                  <option value="product" className={isDark ? 'bg-[#1b1633] text-white' : 'bg-white'}>
                    สินค้า
                  </option>
                  <option value="channel" className={isDark ? 'bg-[#1b1633] text-white' : 'bg-white'}>
                    ช่องทางจำหน่าย
                  </option>
                  <option value="date" className={isDark ? 'bg-[#1b1633] text-white' : 'bg-white'}>
                    วันที่
                  </option>
                  <option value="revenue" className={isDark ? 'bg-[#1b1633] text-white' : 'bg-white'}>
                    ยอดขาย
                  </option>
                  <option value="profit" className={isDark ? 'bg-[#1b1633] text-white' : 'bg-white'}>
                    กำไร
                  </option>
                  <option value="quantity" className={isDark ? 'bg-[#1b1633] text-white' : 'bg-white'}>
                    จำนวน
                  </option>
                  {availableColumns
                    .filter(
                      (c) =>
                        ![
                          'region',
                          'category',
                          'product',
                          'channel',
                          'date',
                          'revenue',
                          'profit',
                          'quantity',
                          'orderId',
                          'id',
                        ].includes(c)
                    )
                    .map((c) => (
                      <option key={c} value={c} className={isDark ? 'bg-[#1b1633] text-white' : 'bg-white'}>
                        {getColLabel(c)}
                      </option>
                    ))}
                </select>

                {/* Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdownRuleId(isDropdownOpen ? null : rule.id)
                  }
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold cursor-pointer transition max-w-[170px] truncate ${
                    selected.length > 0
                      ? 'bg-violet-600/30 text-violet-200 border border-violet-500/40'
                      : isDark
                      ? 'hover:bg-white/10 text-slate-300'
                      : 'hover:bg-slate-200/60 text-slate-700'
                  }`}
                  title={`คลิกเพื่อเลือกข้อมูลในคอลัมน์ ${getColLabel(rule.column)}`}
                >
                  <span className="truncate">{summaryLabel}</span>
                  <ChevronDown
                    className={`w-3 h-3 text-violet-400 transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Remove single rule button [X] */}
                <button
                  type="button"
                  onClick={() => handleRemoveRule(rule.id)}
                  title="ลบตัวกรองนี้"
                  className="text-slate-400 hover:text-rose-400 p-0.5 ml-0.5 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* The Dropdown Popover showing actual unique values in the column */}
              {isDropdownOpen && (
                <div
                  className={`absolute top-full left-0 mt-1.5 w-72 rounded-2xl shadow-2xl border z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 ${
                    isDark
                      ? 'bg-[#1a1435] border-violet-500/40 text-slate-100 shadow-violet-950/60'
                      : 'bg-white border-slate-200 text-slate-900 shadow-xl'
                  }`}
                >
                  {/* Header info */}
                  <div className="px-3.5 py-2.5 border-b border-violet-500/20 bg-violet-600/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1 text-violet-300">
                        <span>ข้อมูลในคอลัมน์</span>
                        <span className="underline decoration-violet-400">
                          {getColLabel(rule.column)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        มีทั้งหมด {distinct.length} ค่าที่พบในตาราง
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveDropdownRuleId(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Search inside column values */}
                  <div className="p-2 border-b border-violet-500/10">
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                          setSearchQuery((prev) => ({ ...prev, [rule.id]: e.target.value }))
                        }
                        placeholder={`ค้นหาใน ${getColLabel(rule.column)}...`}
                        className={`w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl outline-none transition border ${
                          isDark
                            ? 'bg-[#120e26] border-violet-500/30 text-white placeholder-slate-500 focus:border-violet-400'
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Select All / Clear Row */}
                  <div className="px-3 py-1.5 border-b border-violet-500/10 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleSelectAll(rule.id, rule.column)}
                      className="text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
                    >
                      ✓ เลือกทั้งหมด
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearRuleSelections(rule.id)}
                      className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                      ✕ ล้างค่า
                    </button>
                  </div>

                  {/* List of distinct values with counts */}
                  <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                    {filteredDistinct.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        ไม่พบค่าที่ตรงกับการค้นหา
                      </div>
                    ) : (
                      filteredDistinct.map((item) => {
                        const isChecked = selected.includes(item.value);
                        return (
                          <div
                            key={item.value}
                            onClick={() => handleToggleValue(rule.id, item.value)}
                            className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs cursor-pointer transition ${
                              isChecked
                                ? 'bg-violet-600/30 text-white font-semibold'
                                : isDark
                                ? 'hover:bg-white/5 text-slate-300'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <span
                                className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                                  isChecked
                                    ? 'bg-violet-600 border-violet-500 text-white'
                                    : isDark
                                    ? 'border-slate-600 bg-black/20'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </span>
                              <span className="truncate">{item.value}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0 bg-white/5 px-1.5 py-0.5 rounded">
                              {item.count}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Dropdown footer summary */}
                  <div className="px-3 py-2 bg-black/20 border-t border-violet-500/20 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      เลือกแล้ว: <strong className="text-violet-300">{selected.length}</strong> ค่า
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveDropdownRuleId(null)}
                      className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] cursor-pointer"
                    >
                      เสร็จสิ้น
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* "+ เพิ่มตัวกรอง" Button */}
        <button
          id="btn-add-filter-slot"
          type="button"
          onClick={() => handleAddNewSlot()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed text-xs font-semibold transition cursor-pointer ${
            isDark
              ? 'border-violet-500/50 hover:border-violet-400 text-violet-300 hover:bg-violet-950/40'
              : 'border-violet-400 hover:border-violet-600 text-violet-700 hover:bg-violet-50'
          }`}
          title="เพิ่มตัวกรองคอลัมน์ใหม่"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ เพิ่มตัวกรองคอลัมน์</span>
        </button>

        {/* Clear All "ล้างทั้งหมด" Button */}
        {hasActiveFilters && (
          <button
            id="btn-clear-all-filters"
            type="button"
            onClick={onClearFilters}
            className="text-xs text-rose-400 hover:text-rose-300 hover:underline px-2 py-1 font-medium transition cursor-pointer flex items-center gap-1"
            title="ล้างตัวกรองทั้งหมด"
          >
            <RotateCcw className="w-3 h-3" />
            <span>ล้างทั้งหมด</span>
          </button>
        )}
      </div>

      {/* Right: Cross-Filter Indicator (if user clicked a bar/pie on canvas) */}
      {filterState.crossFilter && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 text-[11px] font-medium">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>
            กรองเจาะจง: {getColLabel(filterState.crossFilter.column)} ={' '}
            <strong className="text-white">{String(filterState.crossFilter.value)}</strong>
          </span>
          <button
            type="button"
            onClick={() => onUpdateFilterState({ crossFilter: null })}
            title="ล้างตัวกรองเจาะจงนี้"
            className="hover:text-white p-0.5 cursor-pointer ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
