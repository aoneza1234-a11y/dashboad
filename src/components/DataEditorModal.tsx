import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  FileSpreadsheet,
  Download,
  Check,
  Search,
  Columns,
  Sparkles,
} from 'lucide-react';
import { SalesRecord } from '../types';
import { INITIAL_SALES_RECORDS } from '../data/sampleData';

interface DataEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesData: SalesRecord[];
  onSaveData: (newData: SalesRecord[]) => void;
  datasetTitle?: string;
}

export const DataEditorModal: React.FC<DataEditorModalProps> = ({
  isOpen,
  onClose,
  salesData,
  onSaveData,
  datasetTitle = 'ชุดข้อมูลภาพรวม',
}) => {
  const [records, setRecords] = useState<any[]>(salesData);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newColumnName, setNewColumnName] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);

  // Sync state when opened
  React.useEffect(() => {
    if (isOpen) {
      setRecords(Array.isArray(salesData) ? JSON.parse(JSON.stringify(salesData)) : []);
      setSearchQuery('');
    }
  }, [isOpen, salesData]);

  // Dynamically extract all unique columns present in records
  const dynamicColumns = useMemo(() => {
    const defaultCols = ['id', 'date', 'orderId', 'product', 'category', 'region', 'quantity', 'revenue', 'cost', 'profit'];
    const foundKeys = new Set<string>();

    records.forEach((rec) => {
      if (rec && typeof rec === 'object') {
        Object.keys(rec).forEach((k) => foundKeys.add(k));
      }
    });

    // Order: first standard columns in priority order, then custom dynamic columns
    const ordered: string[] = [];
    defaultCols.forEach((col) => {
      if (foundKeys.has(col)) {
        ordered.push(col);
        foundKeys.delete(col);
      }
    });

    // Append remaining columns
    foundKeys.forEach((k) => ordered.push(k));
    return ordered.length > 0 ? ordered : defaultCols;
  }, [records]);

  if (!isOpen) return null;

  const handleCellChange = (
    rowIndex: number,
    field: string,
    val: string
  ) => {
    const updated = [...records];
    const rec = { ...updated[rowIndex] };

    // Check if the field is numeric
    const isNumField =
      field === 'revenue' ||
      field === 'cost' ||
      field === 'quantity' ||
      field === 'profit' ||
      (!isNaN(Number(val)) && val.trim() !== '' && typeof (rec as any)[field] === 'number');

    if (isNumField) {
      const num = Number(val);
      rec[field] = isNaN(num) ? val : num;

      // Auto update profit if revenue and cost exist
      if ((field === 'revenue' || field === 'cost') && rec.revenue !== undefined && rec.cost !== undefined) {
        rec.profit = (Number(rec.revenue) || 0) - (Number(rec.cost) || 0);
      }
    } else {
      rec[field] = val;
    }

    updated[rowIndex] = rec;
    setRecords(updated);
  };

  const handleAddRow = () => {
    const nextId = records.length > 0 ? Math.max(...records.map((r) => Number(r.id) || 0)) + 1 : 1;
    const newRec: any = {
      id: nextId,
    };

    // Populate default values for all known columns
    dynamicColumns.forEach((col) => {
      if (col === 'id') return;
      if (col === 'date') newRec[col] = new Date().toISOString().substring(0, 10);
      else if (col === 'orderId') newRec[col] = `ORD-${new Date().getFullYear()}-${String(nextId).padStart(3, '0')}`;
      else if (col === 'product') newRec[col] = 'สินค้าใหม่';
      else if (col === 'category') newRec[col] = 'หมวดหมู่ทั่วไป';
      else if (col === 'region') newRec[col] = 'กรุงเทพฯ';
      else if (col === 'quantity') newRec[col] = 1;
      else if (col === 'revenue') newRec[col] = 10000;
      else if (col === 'cost') newRec[col] = 6000;
      else if (col === 'profit') newRec[col] = 4000;
      else newRec[col] = '';
    });

    setRecords([newRec, ...records]);
  };

  const handleDeleteRow = (index: number) => {
    setRecords(records.filter((_, i) => i !== index));
  };

  const handleAddCustomColumn = () => {
    const colName = newColumnName.trim();
    if (!colName) return;
    if (dynamicColumns.includes(colName)) {
      alert(`คอลัมน์ "${colName}" มีอยู่แล้ว`);
      return;
    }

    const updated = records.map((r) => ({
      ...r,
      [colName]: '',
    }));
    setRecords(updated);
    setNewColumnName('');
    setShowAddColumn(false);
  };

  const handleResetToDefault = () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลเป็นชุดข้อมูลเริ่มต้น 20 แถวหรือไม่?')) {
      setRecords(INITIAL_SALES_RECORDS);
    }
  };

  const handleSave = () => {
    onSaveData(records);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const filteredRecordsWithIndex = useMemo(() => {
    if (!searchQuery.trim()) {
      return records.map((r, i) => ({ record: r, originalIndex: i }));
    }
    const q = searchQuery.toLowerCase();
    return records
      .map((r, i) => ({ record: r, originalIndex: i }))
      .filter(({ record }) => {
        return Object.values(record).some((v) =>
          String(v || '').toLowerCase().includes(q)
        );
      });
  }, [records, searchQuery]);

  const totalRev = records.reduce((a, b) => a + (Number(b.revenue) || 0), 0);
  const totalProf = records.reduce((a, b) => a + (Number(b.profit) || 0), 0);

  // Column label translator
  const getColHeaderLabel = (col: string) => {
    switch (col) {
      case 'id':
        return 'ID';
      case 'date':
        return 'วันที่';
      case 'orderId':
        return 'เลขที่คำสั่งซื้อ';
      case 'product':
        return 'ชื่อสินค้า / รายการ';
      case 'category':
        return 'หมวดหมู่';
      case 'region':
        return 'ภูมิภาค';
      case 'quantity':
        return 'จำนวน';
      case 'revenue':
        return 'ยอดขาย (บาท)';
      case 'cost':
        return 'ต้นทุน (บาท)';
      case 'profit':
        return 'กำไร (บาท)';
      default:
        return col;
    }
  };

  return (
    <div
      id="modal-data-editor"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white text-slate-800 w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>จัดการและแก้ไขชุดข้อมูล: {datasetTitle}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  {records.length} แถว • {dynamicColumns.length} คอลัมน์
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                แก้ไขค่าในเซลล์ได้อิสระ ข้อมูลจะถูกนำไปอัปเดตกราฟ แดชบอร์ด และบันทึกลงบัญชีของคุณทันที
                {totalRev > 0 && (
                  <span className="ml-2 font-medium text-slate-800">
                    | ยอดขายรวม: <strong className="text-violet-700">{totalRev.toLocaleString()}</strong> ฿
                    {totalProf !== 0 && <> | กำไร: <strong className="text-emerald-700">{totalProf.toLocaleString()}</strong> ฿</>}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAddRow}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มแถวข้อมูล</span>
            </button>

            <button
              onClick={() => setShowAddColumn((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Columns className="w-3.5 h-3.5 text-violet-600" />
              <span>+ เพิ่มคอลัมน์ใหม่</span>
            </button>

            <button
              onClick={handleResetToDefault}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 font-medium flex items-center gap-1.5 transition cursor-pointer"
              title="รีเซ็ตเป็นข้อมูลตัวอย่างเริ่มต้น 20 แถว"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>คืนค่าเริ่มต้น</span>
            </button>

            {/* Quick add column input box */}
            {showAddColumn && (
              <div className="flex items-center gap-1.5 bg-violet-50 p-1 rounded-lg border border-violet-200 animate-in fade-in">
                <input
                  type="text"
                  placeholder="ชื่อคอลัมน์ใหม่..."
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomColumn()}
                  className="px-2 py-0.5 text-xs rounded border border-violet-300 bg-white outline-none text-slate-800"
                  autoFocus
                />
                <button
                  onClick={handleAddCustomColumn}
                  className="px-2 py-0.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded text-xs cursor-pointer"
                >
                  เพิ่ม
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Search box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาข้อมูล..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 outline-none focus:border-violet-500 w-44 sm:w-56"
              />
            </div>

            <button
              onClick={handleSave}
              className={`px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-violet-600 hover:bg-violet-700 text-white'
              }`}
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? 'บันทึกเรียบร้อย!' : 'บันทึกการเปลี่ยนแปลง'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Table Grid */}
        <div className="flex-1 overflow-auto p-4 bg-slate-100/60">
          <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#1f193d] text-white font-semibold sticky top-0 z-10">
                <tr>
                  <th className="p-2.5 border-b border-slate-700 w-12 text-center">#</th>
                  {dynamicColumns.map((col) => (
                    <th
                      key={col}
                      className={`p-2.5 border-b border-slate-700 whitespace-nowrap ${
                        col === 'quantity' || col === 'revenue' || col === 'cost' || col === 'profit'
                          ? 'text-right'
                          : col === 'region' || col === 'id'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {getColHeaderLabel(col)}
                    </th>
                  ))}
                  <th className="p-2.5 border-b border-slate-700 w-12 text-center">ลบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecordsWithIndex.length === 0 ? (
                  <tr>
                    <td colSpan={dynamicColumns.length + 2} className="text-center py-10 text-slate-400">
                      {searchQuery ? `ไม่พบข้อมูลที่ตรงกับ "${searchQuery}"` : 'ยังไม่มีข้อมูลในตาราง'}
                    </td>
                  </tr>
                ) : (
                  filteredRecordsWithIndex.map(({ record, originalIndex }, idx) => (
                    <tr key={record.id || originalIndex} className="hover:bg-violet-50/60 transition">
                      <td className="p-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                      {dynamicColumns.map((col) => {
                        const val = record[col] !== undefined && record[col] !== null ? String(record[col]) : '';
                        const isNumCol =
                          col === 'quantity' || col === 'revenue' || col === 'cost' || col === 'profit';

                        return (
                          <td key={col} className="p-1">
                            <input
                              type={col === 'date' ? 'date' : isNumCol ? 'number' : 'text'}
                              value={val}
                              onChange={(e) => handleCellChange(originalIndex, col, e.target.value)}
                              className={`w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-violet-500 outline-none text-slate-800 bg-transparent ${
                                isNumCol ? 'text-right font-mono font-medium' : ''
                              }`}
                            />
                          </td>
                        );
                      })}
                      <td className="p-1 text-center">
                        <button
                          onClick={() => handleDeleteRow(originalIndex)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="ลบแถวนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            แสดงผล {filteredRecordsWithIndex.length} จาก {records.length} แถวทั้งหมด
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold transition cursor-pointer shadow-xs"
            >
              บันทึกและนำไปใช้
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
