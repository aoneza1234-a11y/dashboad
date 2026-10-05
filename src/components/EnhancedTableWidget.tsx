import React, { useState, useMemo } from 'react';
import {
  Search,
  Columns,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { VisualWidget, SalesRecord } from '../types';

interface EnhancedTableWidgetProps {
  widget: VisualWidget;
  records: SalesRecord[];
  allRecords: SalesRecord[];
  onUpdateWidget?: (id: string, partial: Partial<VisualWidget>) => void;
  onCrossFilter: (dimension: string, value: any) => void;
  activeCrossFilter?: { column: string; value: any } | null;
  currentPalette: string[];
  isDark: boolean;
  formatVal: (val: number) => string;
  isPreviewMode?: boolean;
}

export const EnhancedTableWidget: React.FC<EnhancedTableWidgetProps> = ({
  widget,
  records,
  allRecords,
  onUpdateWidget,
  onCrossFilter,
  activeCrossFilter,
  currentPalette,
  isDark,
  formatVal,
  isPreviewMode = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(widget.tableSortColumn || null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(widget.tableSortDirection || 'asc');

  // Discover all available column keys from the dataset
  const availableColumns = useMemo(() => {
    const source = allRecords.length > 0 ? allRecords : records;
    if (source.length === 0) {
      return ['id', 'date', 'region', 'category', 'product', 'revenue', 'cost', 'profit', 'units'];
    }
    const sample = source[0];
    const keys = Object.keys(sample).filter(
      (k) => !k.startsWith('_') && typeof (sample as any)[k] !== 'object'
    );
    return keys.length > 0 ? keys : ['date', 'region', 'category', 'product', 'revenue', 'profit'];
  }, [allRecords, records]);

  // Active columns chosen by user or smart default
  const activeColumns = useMemo(() => {
    if (widget.tableColumns && widget.tableColumns.length > 0) {
      return widget.tableColumns;
    }
    const preferredOrder = ['date', 'orderId', 'product', 'category', 'region', 'revenue', 'cost', 'profit', 'units'];
    const matched = preferredOrder.filter((col) => availableColumns.includes(col));
    return matched.length > 0 ? matched : availableColumns.slice(0, 6);
  }, [widget.tableColumns, availableColumns]);

  const tableMode = widget.tableMode || 'raw';
  const pageSize = widget.tablePageSize || 10;

  // Toggle column selection
  const handleToggleColumn = (col: string) => {
    if (!onUpdateWidget) return;
    const current = [...activeColumns];
    const next = current.includes(col)
      ? current.filter((c) => c !== col)
      : [...current, col];
    onUpdateWidget(widget.id, {
      tableColumns: next.length > 0 ? next : [col],
    });
  };

  const handleSelectAllColumns = () => {
    if (!onUpdateWidget) return;
    onUpdateWidget(widget.id, { tableColumns: availableColumns });
  };

  const handleResetColumns = () => {
    if (!onUpdateWidget) return;
    const preferredOrder = ['date', 'orderId', 'product', 'category', 'region', 'revenue', 'cost', 'profit', 'units'];
    const matched = preferredOrder.filter((col) => availableColumns.includes(col));
    onUpdateWidget(widget.id, { tableColumns: matched.length > 0 ? matched : availableColumns.slice(0, 6) });
  };

  // Aggregated data if tableMode === 'aggregated'
  const aggregatedData = useMemo(() => {
    if (tableMode !== 'aggregated') return [];
    const dim = widget.dimension || 'category';
    const metric = widget.metric || 'revenue';
    const groups = new Map<string, { name: string; value: number; count: number; rows: any[] }>();

    for (const r of records) {
      const key = String((r as any)[dim] ?? 'ไม่ระบุ');
      const val = Number((r as any)[metric] ?? 0);
      const existing = groups.get(key) || { name: key, value: 0, count: 0, rows: [] };
      existing.value += isNaN(val) ? 0 : val;
      existing.count += 1;
      existing.rows.push(r);
      groups.set(key, existing);
    }

    return Array.from(groups.values());
  }, [records, tableMode, widget.dimension, widget.metric]);

  // Raw filtered & searched records
  const processedRecords = useMemo(() => {
    if (tableMode === 'aggregated') {
      let items = [...aggregatedData];
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        items = items.filter((item) => item.name.toLowerCase().includes(q));
      }
      if (sortColumn) {
        items.sort((a, b) => {
          const aVal = sortColumn === 'value' ? a.value : a.name;
          const bVal = sortColumn === 'value' ? b.value : b.name;
          if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }
      return items;
    }

    let items = [...records];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((row) =>
        activeColumns.some((col) => {
          const val = String((row as any)[col] ?? '').toLowerCase();
          return val.includes(q);
        })
      );
    }

    if (sortColumn) {
      items.sort((a, b) => {
        const aVal = (a as any)[sortColumn] ?? '';
        const bVal = (b as any)[sortColumn] ?? '';
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return items;
  }, [records, tableMode, aggregatedData, searchQuery, activeColumns, sortColumn, sortDirection]);

  // Pagination calculation
  const totalItems = processedRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedData = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return processedRecords.slice(start, start + pageSize);
  }, [processedRecords, validPage, pageSize]);

  const handleSort = (colKey: string) => {
    if (sortColumn === colKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
    }
  };

  // Helper to format values in table cells
  const renderCellContent = (colKey: string, rawVal: any) => {
    if (rawVal === undefined || rawVal === null || rawVal === '') {
      return <span className="text-slate-400 italic text-[11px]">-</span>;
    }
    const num = Number(rawVal);
    const isCurrency = ['revenue', 'cost', 'profit', 'ยอดขาย', 'กำไร', 'ต้นทุน'].some((k) =>
      colKey.toLowerCase().includes(k)
    );
    const isQuantity = ['quantity', 'units', 'จำนวน'].some((k) =>
      colKey.toLowerCase().includes(k)
    );

    if (!isNaN(num) && typeof rawVal !== 'boolean' && String(rawVal).trim() !== '') {
      if (isCurrency) {
        return (
          <span className="font-mono font-medium text-emerald-400">
            ฿{num.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
          </span>
        );
      }
      if (isQuantity) {
        return <span className="font-mono text-cyan-300">{num.toLocaleString('th-TH')}</span>;
      }
      return <span className="font-mono">{num.toLocaleString('th-TH')}</span>;
    }

    return <span>{String(rawVal)}</span>;
  };

  // Numerical totals
  const numericalTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const col of activeColumns) {
      const isNum = records.some((r) => {
        const v = (r as any)[col];
        return typeof v === 'number' || (!isNaN(Number(v)) && String(v).trim() !== '');
      });
      if (isNum) {
        totals[col] = records.reduce((sum, r) => {
          const v = Number((r as any)[col]);
          return sum + (isNaN(v) ? 0 : v);
        }, 0);
      }
    }
    return totals;
  }, [records, activeColumns]);

  return (
    <div className="w-full h-full flex flex-col justify-between text-xs select-text overflow-hidden relative">
      {/* 1. Table Top Controls Toolbar: Search & Column Selector */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/10 shrink-0 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-[200px]">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ค้นหาในตาราง..."
              className="w-full pl-7 pr-2 py-1 text-[11px] rounded-lg bg-black/20 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
          </div>

          {/* Mode Badge / Selector */}
          {!isPreviewMode && onUpdateWidget && (
            <div className="inline-flex rounded-lg p-0.5 bg-black/30 border border-white/10 text-[10px]">
              <button
                type="button"
                onClick={() => onUpdateWidget(widget.id, { tableMode: 'raw' })}
                className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                  tableMode === 'raw' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="แสดงข้อมูลทุกแถวอย่างละเอียด"
              >
                แถวดิบ ({records.length})
              </button>
              <button
                type="button"
                onClick={() => onUpdateWidget(widget.id, { tableMode: 'aggregated' })}
                className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                  tableMode === 'aggregated' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="จัดกลุ่มสรุปผลตามมิติ"
              >
                สรุปกลุ่ม
              </button>
            </div>
          )}
        </div>

        {/* Column Headers Picker Button */}
        <div className="flex items-center gap-1.5 relative">
          <button
            type="button"
            onClick={() => setShowColumnPicker((prev) => !prev)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              showColumnPicker
                ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                : 'bg-black/20 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="เลือกหัวข้อคอลัมน์ที่ต้องการแสดงในตารางนี้"
          >
            <Columns className="w-3 h-3 text-violet-400" />
            <span>หัวข้อคอลัมน์ ({activeColumns.length}/{availableColumns.length})</span>
          </button>

          {/* Column Picker Popover Modal */}
          {showColumnPicker && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1.5 w-60 bg-[#191432] border border-violet-500/40 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 text-left text-white"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <span className="font-bold text-xs text-violet-300 flex items-center gap-1.5">
                  <Columns className="w-3.5 h-3.5 text-violet-400" />
                  <span>เลือกคอลัมน์ตาราง</span>
                </span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={handleSelectAllColumns}
                    className="text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
                  >
                    ทั้งหมด
                  </button>
                  <span className="text-slate-500">•</span>
                  <button
                    type="button"
                    onClick={handleResetColumns}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    รีเซ็ต
                  </button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {availableColumns.map((col) => {
                  const isChecked = activeColumns.includes(col);
                  return (
                    <label
                      key={col}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-violet-600/20 text-xs text-slate-200 cursor-pointer select-none transition"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleColumn(col)}
                        className="rounded text-violet-600 w-3.5 h-3.5"
                      />
                      <span className="truncate">{col}</span>
                    </label>
                  );
                })}
              </div>

              <div className="pt-2 mt-2 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowColumnPicker(false)}
                  className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                >
                  เสร็จสิ้น
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Scrollable Table Grid */}
      <div className="flex-1 overflow-auto w-full rounded-xl border border-white/10 bg-black/10">
        {tableMode === 'aggregated' ? (
          /* Aggregated Group View */
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[#16122d] border-b border-white/10 shadow-xs">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="py-2.5 px-3 font-bold text-slate-300 cursor-pointer hover:text-violet-300 select-none transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{widget.dimension || 'หมวดหมู่'}</span>
                    {sortColumn === 'name' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-violet-400" /> : <ArrowDown className="w-3 h-3 text-violet-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('value')}
                  className="py-2.5 px-3 font-bold text-slate-300 text-right cursor-pointer hover:text-violet-300 select-none transition"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{widget.metric || 'ยอดรวม'}</span>
                    {sortColumn === 'value' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-violet-400" /> : <ArrowDown className="w-3 h-3 text-violet-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    )}
                  </div>
                </th>
                <th className="py-2.5 px-3 font-bold text-slate-300 text-right">จำนวนแถว</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row: any, idx) => (
                <tr
                  key={idx}
                  onClick={() => onCrossFilter(widget.dimension || 'category', row.name)}
                  className="border-b border-white/5 hover:bg-violet-600/15 cursor-pointer transition"
                >
                  <td className="py-2.5 px-3 flex items-center gap-2 font-medium">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: currentPalette[idx % currentPalette.length] }}
                    ></span>
                    <span className="truncate">{row.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400">
                    {formatVal(row.value)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">{row.count}</td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400 italic">
                    ไม่พบข้อมูลที่ตรงกับคำค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          /* Multi-Column Raw Records View */
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[#16122d] border-b border-white/10 shadow-xs">
              <tr>
                <th className="py-2 px-2.5 text-center font-bold text-slate-400 w-10">#</th>
                {activeColumns.map((col) => {
                  const isSorted = sortColumn === col;
                  return (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="py-2 px-3 font-bold text-slate-300 cursor-pointer hover:text-violet-300 hover:bg-white/5 select-none transition whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="capitalize">{col}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-violet-400 shrink-0" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-violet-400 shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 text-slate-500 opacity-60 hover:opacity-100 shrink-0" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((record: any, idx) => {
                const rowNum = (validPage - 1) * pageSize + idx + 1;
                return (
                  <tr
                    key={record.id || idx}
                    className="border-b border-white/5 hover:bg-violet-600/15 transition"
                  >
                    <td className="py-2 px-2.5 text-center text-[10px] text-slate-500 font-mono">
                      {rowNum}
                    </td>
                    {activeColumns.map((col) => (
                      <td key={col} className="py-2 px-3 whitespace-nowrap">
                        {renderCellContent(col, record[col])}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={activeColumns.length + 1} className="py-8 text-center text-slate-400 italic">
                    ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 3. Table Pagination & Row Summary Footer */}
      <div className="flex items-center justify-between pt-2 mt-1 text-[11px] text-slate-400 border-t border-white/10 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span>
            แสดง {totalItems > 0 ? (validPage - 1) * pageSize + 1 : 0} -{' '}
            {Math.min(validPage * pageSize, totalItems)} จาก {totalItems.toLocaleString()} รายการ
          </span>
          {onUpdateWidget && !isPreviewMode && (
            <select
              value={pageSize}
              onChange={(e) => {
                onUpdateWidget(widget.id, { tablePageSize: Number(e.target.value) });
                setCurrentPage(1);
              }}
              className="bg-black/30 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-slate-300 outline-none"
            >
              <option value={5}>5 / หน้า</option>
              <option value={10}>10 / หน้า</option>
              <option value={20}>20 / หน้า</option>
              <option value={50}>50 / หน้า</option>
              <option value={100}>100 / หน้า</option>
            </select>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={validPage <= 1}
            onClick={() => setCurrentPage(1)}
            className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="หน้าแรก"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={validPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="หน้าก่อนหน้า"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 py-0.5 font-mono text-[10px] bg-white/10 rounded">
            {validPage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={validPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="หน้าถัดไป"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={validPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="หน้าสุดท้าย"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
