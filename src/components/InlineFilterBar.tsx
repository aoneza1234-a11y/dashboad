import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  ChevronDown,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  ListFilter,
  SlidersHorizontal,
  Calendar,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react';
import { FilterState, SalesRecord, ActiveFilterRule } from '../types';
import { ThemeStyles } from '../utils/themeStyles';
import { getRecordValue, isBlankValue, parseDateValue, parseCleanNumber } from '../utils/calcEngine';

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
  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);

  // Advanced Condition Creator State
  const [condSourceCol, setCondSourceCol] = useState<string>('date');
  const [condOperator, setCondOperator] = useState<string>('less_equal');
  const [condCompareType, setCondCompareType] = useState<'column' | 'value'>('column');
  const [condCompareCol, setCondCompareCol] = useState<string>('date');
  const [condValue, setCondValue] = useState<string>('');
  const [condSecondValue, setCondSecondValue] = useState<string>('');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

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

  // Dynamically extract all unique columns present in the dataset and availableColumns
  const dynamicColumns = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    const addCol = (c: string) => {
      if (!c || c === 'id' || c.startsWith('__')) return;
      const clean = c.trim();
      const lower = clean.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        list.push(clean);
      }
    };

    if (salesData && salesData.length > 0) {
      salesData.forEach((row) => {
        if (row && typeof row === 'object') {
          Object.keys(row).forEach(addCol);
        }
      });
    }

    if (availableColumns && availableColumns.length > 0) {
      availableColumns.forEach(addCol);
    }

    if (list.length === 0) {
      ['date', 'region', 'category', 'product', 'channel', 'revenue', 'cost', 'profit', 'quantity'].forEach(addCol);
    }

    return list;
  }, [salesData, availableColumns]);

  // Set default column candidates when dynamicColumns loads
  useEffect(() => {
    if (dynamicColumns.length > 0) {
      if (!dynamicColumns.includes(condSourceCol)) {
        setCondSourceCol(dynamicColumns[0]);
      }
      if (!dynamicColumns.includes(condCompareCol)) {
        setCondCompareCol(dynamicColumns[1] || dynamicColumns[0]);
      }
    }
  }, [dynamicColumns]);

  // Compute baseline distinct values and counts for each column
  const columnDistinctValues = useMemo(() => {
    const map: Record<string, { value: string; count: number }[]> = {};
    if (!salesData || salesData.length === 0) return map;

    dynamicColumns.forEach((col) => {
      const counts: Record<string, number> = {};
      salesData.forEach((row) => {
        const val = getRecordValue(row, col);
        if (val !== undefined && val !== null && !isBlankValue(val)) {
          const strVal = String(val).trim();
          counts[strVal] = (counts[strVal] || 0) + 1;
        }
      });

      const list = Object.entries(counts).map(([value, count]) => ({ value, count }));
      list.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
      map[col] = list;
    });

    return map;
  }, [salesData, dynamicColumns]);

  // Calculate live matching count for condition builder
  const liveConditionMatches = useMemo(() => {
    if (!salesData || salesData.length === 0) return { count: 0, total: 0, pct: 0 };
    const total = salesData.length;

    let matched = 0;
    salesData.forEach((r) => {
      const val = getRecordValue(r, condSourceCol);
      let targetRawVal: any = condValue;
      if (condCompareType === 'column') {
        targetRawVal = getRecordValue(r, condCompareCol);
      }

      if (condCompareType !== 'column' && (targetRawVal === undefined || targetRawVal === null || String(targetRawVal).trim() === '')) {
        return;
      }

      // 1. Date comparison check
      const dateA = parseDateValue(val);
      const dateTarget = parseDateValue(targetRawVal);
      const isDateComparison = dateA !== null && dateTarget !== null;

      if (isDateComparison && dateA && dateTarget) {
        const timeA = dateA.getTime();
        const timeTarget = dateTarget.getTime();
        const isSameDay =
          dateA.getFullYear() === dateTarget.getFullYear() &&
          dateA.getMonth() === dateTarget.getMonth() &&
          dateA.getDate() === dateTarget.getDate();

        if (condOperator === 'less_equal' && (timeA <= timeTarget || isSameDay)) matched++;
        else if (condOperator === 'less' && timeA < timeTarget) matched++;
        else if (condOperator === 'greater_equal' && (timeA >= timeTarget || isSameDay)) matched++;
        else if (condOperator === 'greater' && timeA > timeTarget) matched++;
        else if (condOperator === 'equals' && isSameDay) matched++;
        else if (condOperator === 'not_equals' && !isSameDay) matched++;
        else if (condOperator === 'between') {
          const dateEnd = parseDateValue(condSecondValue);
          if (dateEnd) {
            const endOfDay = new Date(dateEnd.getFullYear(), dateEnd.getMonth(), dateEnd.getDate(), 23, 59, 59, 999).getTime();
            if (timeA >= timeTarget && timeA <= endOfDay) matched++;
          }
        }
        return;
      }

      // 2. Numeric and Text Comparisons
      const strVal = String(val ?? '').trim().toLowerCase();
      const strTarget = String(targetRawVal ?? '').trim().toLowerCase();
      const isStrictNumber =
        !isNaN(Number(String(val).trim())) && !isNaN(Number(String(targetRawVal).trim()));
      const numVal = isStrictNumber ? parseCleanNumber(val) : NaN;
      const numTarget = isStrictNumber ? parseCleanNumber(targetRawVal) : NaN;
      const isNumericComparison = isStrictNumber && !isNaN(numVal) && !isNaN(numTarget);

      switch (condOperator) {
        case 'less_equal':
          if (isNumericComparison ? numVal <= numTarget : strVal <= strTarget) matched++;
          break;
        case 'less':
          if (isNumericComparison ? numVal < numTarget : strVal < strTarget) matched++;
          break;
        case 'greater_equal':
          if (isNumericComparison ? numVal >= numTarget : strVal >= strTarget) matched++;
          break;
        case 'greater':
          if (isNumericComparison ? numVal > numTarget : strVal > strTarget) matched++;
          break;
        case 'equals':
          if (isNumericComparison ? numVal === numTarget : strVal === strTarget) matched++;
          break;
        case 'not_equals':
          if (isNumericComparison ? numVal !== numTarget : strVal !== strTarget) matched++;
          break;
        case 'contains':
          if (strVal.includes(strTarget)) matched++;
          break;
        case 'between': {
          const numSecond = parseCleanNumber(condSecondValue);
          if (isNumericComparison && !isNaN(numSecond) && numVal >= numTarget && numVal <= numSecond) matched++;
          break;
        }
        default:
          if (strVal === strTarget) matched++;
      }
    });

    return {
      count: matched,
      total,
      pct: total > 0 ? Math.round((matched / total) * 100) : 0,
    };
  }, [salesData, condSourceCol, condOperator, condCompareType, condCompareCol, condValue, condSecondValue]);

  // Compute distinct values and counts for each column
  const getValuesForRule = (ruleId: string, col: string) => {
    if (!salesData || salesData.length === 0) return [];

    const otherRules = rules.filter((r) => r.id !== ruleId && ((r.selectedValues && r.selectedValues.length > 0) || r.value));
    let baseRecords = salesData;

    if (otherRules.length > 0) {
      baseRecords = baseRecords.filter((row) => {
        return otherRules.every((rule) => {
          if (!rule.column) return true;
          const val = getRecordValue(row, rule.column);
          if (rule.selectedValues && rule.selectedValues.length > 0) {
            const strVal = String(val ?? '').trim().toLowerCase();
            return rule.selectedValues.some((sv) => String(sv).trim().toLowerCase() === strVal);
          }
          if (rule.value) {
            const strVal = String(val ?? '').trim().toLowerCase();
            return strVal === String(rule.value).trim().toLowerCase();
          }
          return true;
        });
      });
    }

    const counts: Record<string, number> = {};
    baseRecords.forEach((row) => {
      const val = getRecordValue(row, col);
      if (val !== undefined && val !== null && !isBlankValue(val)) {
        const strVal = String(val).trim();
        counts[strVal] = (counts[strVal] || 0) + 1;
      }
    });

    const list = Object.entries(counts).map(([value, count]) => ({ value, count }));
    list.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    return list;
  };

  // Add standard column dropdown filter
  const handleAddNewSlot = (defaultCol?: string) => {
    const existingCols = rules.map((r) => r.column);
    const candidate =
      defaultCol || dynamicColumns.find((c) => !existingCols.includes(c)) || dynamicColumns[0] || 'region';

    const newRule: ActiveFilterRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      column: candidate,
      operator: 'in',
      selectedValues: [],
    };
    onUpdateFilterState({
      rules: [...rules, newRule],
    });
    setActiveDropdownRuleId(newRule.id);
  };

  // Open condition creator modal
  const handleOpenConditionModal = (ruleToEdit?: ActiveFilterRule) => {
    if (ruleToEdit) {
      setEditingRuleId(ruleToEdit.id);
      setCondSourceCol(ruleToEdit.column);
      setCondOperator(ruleToEdit.operator || 'less_equal');
      setCondCompareType(ruleToEdit.compareType || (ruleToEdit.compareColumn ? 'column' : 'value'));
      setCondCompareCol(ruleToEdit.compareColumn || dynamicColumns[1] || dynamicColumns[0]);
      setCondValue(ruleToEdit.value || '');
      setCondSecondValue(ruleToEdit.secondValue || '');
    } else {
      setEditingRuleId(null);
      setCondSourceCol(dynamicColumns[0] || 'date');
      setCondOperator('less_equal');
      setCondCompareType('column');
      setCondCompareCol(dynamicColumns[1] || dynamicColumns[0]);
      setCondValue('');
      setCondSecondValue('');
    }
    setIsConditionModalOpen(true);
  };

  // Save the condition rule
  const handleSaveConditionRule = () => {
    const opLabels: Record<string, string> = {
      less_equal: '<=',
      less: '<',
      greater_equal: '>=',
      greater: '>',
      equals: '==',
      not_equals: '!=',
      contains: 'ประกอบด้วย',
      between: 'อยู่ระหว่าง',
    };

    const targetDesc =
      condCompareType === 'column'
        ? getColLabel(condCompareCol)
        : condOperator === 'between'
        ? `${condValue} ถึง ${condSecondValue}`
        : condValue;

    const label = `${getColLabel(condSourceCol)} ${opLabels[condOperator] || condOperator} ${targetDesc}`;

    if (editingRuleId) {
      const updated = rules.map((r) =>
        r.id === editingRuleId
          ? {
              ...r,
              column: condSourceCol,
              operator: condOperator as any,
              compareType: condCompareType,
              compareColumn: condCompareType === 'column' ? condCompareCol : undefined,
              value: condCompareType === 'value' ? condValue : undefined,
              secondValue: condCompareType === 'value' && condOperator === 'between' ? condSecondValue : undefined,
              label,
              selectedValues: undefined,
            }
          : r
      );
      onUpdateFilterState({ rules: updated });
    } else {
      const newRule: ActiveFilterRule = {
        id: `cond-rule-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        column: condSourceCol,
        operator: condOperator as any,
        compareType: condCompareType,
        compareColumn: condCompareType === 'column' ? condCompareCol : undefined,
        value: condCompareType === 'value' ? condValue : undefined,
        secondValue: condCompareType === 'value' && condOperator === 'between' ? condSecondValue : undefined,
        label,
      };
      onUpdateFilterState({ rules: [...rules, newRule] });
    }

    setIsConditionModalOpen(false);
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
    rules.some(
      (r) =>
        (r.selectedValues && r.selectedValues.length > 0) ||
        r.value ||
        (r.compareType === 'column' && r.compareColumn)
    ) ||
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

        {/* 2. Column-based Filter Slots & Conditional Rules */}
        {rules.map((rule) => {
          const isConditionRule =
            rule.compareType === 'column' ||
            (rule.operator && ['less_equal', 'less', 'greater_equal', 'greater', 'between'].includes(rule.operator));

          // A) Conditional Filter Rule Chip (e.g. date <= targetDate or revenue >= cost)
          if (isConditionRule) {
            const opSymbol: Record<string, string> = {
              less_equal: '≤',
              less: '<',
              greater_equal: '≥',
              greater: '>',
              equals: '=',
              not_equals: '≠',
              between: 'ระหว่าง',
              contains: 'มี',
            };

            const targetDesc =
              rule.compareType === 'column' && rule.compareColumn
                ? getColLabel(rule.compareColumn)
                : rule.operator === 'between'
                ? `${rule.value}..${rule.secondValue}`
                : rule.value;

            return (
              <div
                key={rule.id}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs shadow-xs font-medium transition ${
                  isDark
                    ? 'bg-indigo-950/60 border-indigo-400/60 text-indigo-200'
                    : 'bg-indigo-50 border-indigo-300 text-indigo-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <button
                  type="button"
                  onClick={() => handleOpenConditionModal(rule)}
                  className="hover:underline flex items-center gap-1 cursor-pointer"
                  title="คลิกเพื่อแก้ไขเงื่อนไขนี้"
                >
                  <span className="font-bold text-white">{getColLabel(rule.column)}</span>
                  <span className="px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px]">
                    {opSymbol[rule.operator || ''] || rule.operator}
                  </span>
                  <span className="font-bold text-amber-300">{targetDesc}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveRule(rule.id)}
                  title="ลบเงื่อนไขนี้"
                  className="text-slate-400 hover:text-rose-400 p-0.5 ml-1 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          // B) Standard Distinct Values Filter Slot
          const ruleDistinct = getValuesForRule(rule.id, rule.column);
          const distinct = ruleDistinct.length > 0 ? ruleDistinct : (columnDistinctValues[rule.column] || []);
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
                  {dynamicColumns.map((col) => (
                    <option key={col} value={col} className={isDark ? 'bg-[#1b1633] text-white' : 'bg-white'}>
                      {getColLabel(col)}
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

                  {/* Dropdown footer */}
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

        {/* "+ กรองตามเงื่อนไข (วันที่/เปรียบเทียบคอลัมน์)" Button */}
        <button
          id="btn-add-condition-rule"
          type="button"
          onClick={() => handleOpenConditionModal()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-xs ${
            isDark
              ? 'bg-gradient-to-r from-indigo-900/40 to-violet-900/40 hover:from-indigo-900/60 hover:to-violet-900/60 border-indigo-500/50 hover:border-indigo-400 text-indigo-300 hover:text-white'
              : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-800'
          }`}
          title="สร้างเงื่อนไขกรองขั้นสูง เช่น วันที่ใน Col A <= วันที่ใน Col B หรือยอดขาย > ต้นทุน"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
          <span>+ กรองตามเงื่อนไข (เปรียบเทียบ/วันที่)</span>
        </button>

        {/* "+ เพิ่มตัวกรองคอลัมน์" Button */}
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

      {/* Right: Cross-Filter Indicator */}
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

      {/* Advanced Condition Modal */}
      {isConditionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#15102d] border border-indigo-500/40 rounded-3xl p-6 shadow-2xl shadow-indigo-950/50 text-white flex flex-col font-sans">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingRuleId ? 'แก้ไขเงื่อนไขการกรอง' : 'สร้างเงื่อนไขการกรองข้อมูล (Conditional Rule)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    กำหนดเงื่อนไขเปรียบเทียบระหว่างคอลัมน์ หรือเปรียบเทียบกับค่าวันที่/ตัวเลข
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConditionModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            {/* Condition Builder Fields */}
            <div className="space-y-4">
              {/* 1. Source Column */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  1. เลือกคอลัมน์ที่ต้องการตรวจสอบ (Source Column):
                </label>
                <select
                  value={condSourceCol}
                  onChange={(e) => setCondSourceCol(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0f0a22] border border-violet-500/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-400"
                >
                  {dynamicColumns.map((col) => (
                    <option key={col} value={col}>
                      {getColLabel(col)} ({col})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Operator Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  2. เลือกเงื่อนไขเปรียบเทียบ (Comparison Operator):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                  {[
                    { id: 'less_equal', label: '≤ น้อยกว่าหรือเท่ากับ', desc: 'มีค่าน้อยกว่าหรือเท่ากับ' },
                    { id: 'less', label: '< น้อยกว่า', desc: 'มีค่าน้อยกว่า' },
                    { id: 'greater_equal', label: '≥ มากกว่าหรือเท่ากับ', desc: 'มีค่ามากกว่าหรือเท่ากับ' },
                    { id: 'greater', label: '> มากกว่า', desc: 'มีค่ามากกว่า' },
                    { id: 'equals', label: '= เท่ากับ', desc: 'มีค่าเท่ากันเป๊ะ' },
                    { id: 'not_equals', label: '≠ ไม่เท่ากับ', desc: 'มีค่าไม่เท่ากัน' },
                    { id: 'between', label: '↔ อยู่ระหว่าง', desc: 'มีค่าอยู่ระหว่าง A ถึง B' },
                    { id: 'contains', label: '🔍 ประกอบด้วย', desc: 'มีคำที่ระบุในข้อความ' },
                  ].map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setCondOperator(op.id)}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                        condOperator === op.id
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                          : 'bg-[#0f0a22] border-white/5 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="font-bold text-xs">{op.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Comparison Mode: Column vs Fixed Value */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    3. เปรียบเทียบกับอะไร (Target Comparison):
                  </label>
                  <div className="flex items-center gap-1 bg-[#0b071e] p-0.5 rounded-lg border border-violet-500/20 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setCondCompareType('column')}
                      className={`px-2.5 py-0.5 rounded-md font-bold transition cursor-pointer ${
                        condCompareType === 'column'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      คอลัมน์อื่นในตาราง
                    </button>
                    <button
                      type="button"
                      onClick={() => setCondCompareType('value')}
                      className={`px-2.5 py-0.5 rounded-md font-bold transition cursor-pointer ${
                        condCompareType === 'value'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      กำหนดค่า / วันที่
                    </button>
                  </div>
                </div>

                {condCompareType === 'column' ? (
                  <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
                    <div className="flex items-center gap-2 mb-2 text-xs text-indigo-300 font-semibold">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>เลือกคอลัมน์เปรียบเทียบในแถวเดียวกัน:</span>
                    </div>
                    <select
                      value={condCompareCol}
                      onChange={(e) => setCondCompareCol(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0f0a22] border border-indigo-400/40 text-white text-xs font-bold focus:outline-none focus:border-indigo-400"
                    >
                      {dynamicColumns.map((col) => (
                        <option key={col} value={col}>
                          {getColLabel(col)} ({col})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-2">
                      💡 ตัวอย่าง: นับเมื่อวันที่ใน <span className="text-white font-bold">[{getColLabel(condSourceCol)}]</span>{' '}
                      มีค่าน้อยกว่าหรือเท่ากับ วันที่ใน{' '}
                      <span className="text-amber-300 font-bold">[{getColLabel(condCompareCol)}]</span>
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-[#0f0a22] border border-violet-500/30 space-y-2">
                    {condOperator === 'between' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">ค่าเริ่มต้น (จาก):</label>
                          <input
                            type="text"
                            value={condValue}
                            onChange={(e) => setCondValue(e.target.value)}
                            placeholder="เช่น 2026-01-01 หรือ 1000"
                            className="w-full px-3 py-2 rounded-xl bg-[#140f2e] border border-violet-500/30 text-white text-xs focus:outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">ค่าสิ้นสุด (ถึง):</label>
                          <input
                            type="text"
                            value={condSecondValue}
                            onChange={(e) => setCondSecondValue(e.target.value)}
                            placeholder="เช่น 2026-12-31 หรือ 5000"
                            className="w-full px-3 py-2 rounded-xl bg-[#140f2e] border border-violet-500/30 text-white text-xs focus:outline-none focus:border-indigo-400"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          ระบุค่าวันที่, ตัวเลข, หรือข้อความ:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={condValue}
                            onChange={(e) => setCondValue(e.target.value)}
                            placeholder="เช่น 2026-06-30 หรือ 5000"
                            className="flex-1 px-3 py-2 rounded-xl bg-[#140f2e] border border-violet-500/30 text-white text-xs focus:outline-none focus:border-indigo-400"
                          />
                          {/* Quick Date Picker button */}
                          <input
                            type="date"
                            onChange={(e) => setCondValue(e.target.value)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#1e1742] border border-violet-500/30 text-xs text-slate-200 cursor-pointer"
                            title="เลือกวันที่จากปฏิทิน"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Live Match Counter Box */}
              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      ผลการทดสอบเงื่อนไขกับข้อมูลปัจจุบัน:
                    </span>
                    <span className="text-[11px] text-slate-300">
                      ตรงตามเงื่อนไข{' '}
                      <strong className="text-emerald-400 font-bold">{liveConditionMatches.count}</strong> จาก{' '}
                      {liveConditionMatches.total} รายการ ({liveConditionMatches.pct}%)
                    </span>
                  </div>
                </div>
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {liveConditionMatches.pct}% ผ่าน
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsConditionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveConditionRule}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingRuleId ? 'อัปเดตเงื่อนไข' : 'ใช้งานเงื่อนไขการกรองนี้'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
