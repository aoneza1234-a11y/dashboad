import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  FileSpreadsheet,
  Download,
  Check,
} from 'lucide-react';
import { SalesRecord } from '../types';
import { INITIAL_SALES_RECORDS } from '../data/sampleData';

interface DataEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesData: SalesRecord[];
  onSaveData: (newData: SalesRecord[]) => void;
}

export const DataEditorModal: React.FC<DataEditorModalProps> = ({
  isOpen,
  onClose,
  salesData,
  onSaveData,
}) => {
  const [records, setRecords] = useState<SalesRecord[]>(salesData);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state when opened
  React.useEffect(() => {
    if (isOpen) {
      setRecords(salesData);
    }
  }, [isOpen, salesData]);

  if (!isOpen) return null;

  const handleCellChange = (
    index: number,
    field: keyof SalesRecord,
    val: string | number
  ) => {
    const updated = [...records];
    const rec = { ...updated[index] };

    if (field === 'revenue' || field === 'cost' || field === 'quantity') {
      const num = Number(val) || 0;
      (rec as any)[field] = num;
      if (field === 'revenue' || field === 'cost') {
        rec.profit = rec.revenue - rec.cost;
      }
    } else {
      (rec as any)[field] = val;
    }

    updated[index] = rec;
    setRecords(updated);
  };

  const handleAddRow = () => {
    const nextId = records.length > 0 ? Math.max(...records.map((r) => r.id)) + 1 : 1;
    const newRec: SalesRecord = {
      id: nextId,
      date: new Date().toISOString().substring(0, 10),
      orderId: `ORD-2024-${String(nextId).padStart(3, '0')}`,
      product: 'สินค้าใหม่',
      category: 'ของใช้ในบ้าน',
      region: 'กรุงเทพฯ',
      quantity: 1,
      revenue: 15000,
      cost: 9000,
      profit: 6000,
    };
    setRecords([...records, newRec]);
  };

  const handleDeleteRow = (index: number) => {
    setRecords(records.filter((_, i) => i !== index));
  };

  const handleResetToDefault = () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลเป็น 20 แถวเริ่มต้นตามรูปภาพหรือไม่?')) {
      setRecords(INITIAL_SALES_RECORDS);
    }
  };

  const handleSave = () => {
    onSaveData(records);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const totalRev = records.reduce((a, b) => a + b.revenue, 0);
  const totalProf = records.reduce((a, b) => a + b.profit, 0);

  return (
    <div
      id="modal-data-editor"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white text-slate-800 w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>แก้ไขข้อมูลสเปรดชีต (Quarterly Sales Data)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  {records.length} แถว
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                ยอดขายรวมปัจจุบัน: <strong className="text-slate-800">{totalRev.toLocaleString()}</strong> บาท | กำไรขั้นต้น: <strong className="text-emerald-700">{totalProf.toLocaleString()}</strong> บาท
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddRow}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มแถวข้อมูล</span>
            </button>
            <button
              onClick={handleResetToDefault}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>คืนค่า 20 รายการตามรูป</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center gap-1.5 shadow transition"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? 'บันทึกสำเร็จ!' : 'บันทึกการเปลี่ยนแปลง'}</span>
            </button>
          </div>
        </div>

        {/* Table Grid */}
        <div className="flex-1 overflow-auto p-4 bg-slate-100/50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#241e45] text-white font-semibold sticky top-0 z-10">
                <tr>
                  <th className="p-2.5 border-b border-slate-300 w-12 text-center">#</th>
                  <th className="p-2.5 border-b border-slate-300 w-28">วันที่</th>
                  <th className="p-2.5 border-b border-slate-300 w-32">เลขที่คำสั่งซื้อ</th>
                  <th className="p-2.5 border-b border-slate-300">ชื่อสินค้า</th>
                  <th className="p-2.5 border-b border-slate-300 w-32">หมวดหมู่</th>
                  <th className="p-2.5 border-b border-slate-300 w-28 text-center">ภูมิภาค</th>
                  <th className="p-2.5 border-b border-slate-300 w-16 text-right">จำนวน</th>
                  <th className="p-2.5 border-b border-slate-300 w-28 text-right">ยอดขาย (บาท)</th>
                  <th className="p-2.5 border-b border-slate-300 w-28 text-right">ต้นทุน (บาท)</th>
                  <th className="p-2.5 border-b border-slate-300 w-28 text-right">กำไร (บาท)</th>
                  <th className="p-2.5 border-b border-slate-300 w-10 text-center">ลบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((rec, idx) => (
                  <tr key={rec.id || idx} className="hover:bg-violet-50/40 transition">
                    <td className="p-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="p-1.5">
                      <input
                        type="date"
                        value={rec.date}
                        onChange={(e) => handleCellChange(idx, 'date', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-violet-500 outline-none text-slate-800"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={rec.orderId}
                        onChange={(e) => handleCellChange(idx, 'orderId', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-violet-500 outline-none text-slate-800 font-mono text-[11px]"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={rec.product}
                        onChange={(e) => handleCellChange(idx, 'product', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-violet-500 outline-none text-slate-800"
                      />
                    </td>
                    <td className="p-1.5">
                      <select
                        value={rec.category}
                        onChange={(e) => handleCellChange(idx, 'category', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-violet-500 outline-none text-slate-800 bg-transparent"
                      >
                        <option value="อิเล็กทรอนิกส์">อิเล็กทรอนิกส์</option>
                        <option value="ของใช้ในบ้าน">ของใช้ในบ้าน</option>
                        <option value="สุขภาพ">สุขภาพ</option>
                      </select>
                    </td>
                    <td className="p-1.5">
                      <select
                        value={rec.region}
                        onChange={(e) => handleCellChange(idx, 'region', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-violet-500 outline-none text-slate-800 bg-transparent text-center"
                      >
                        <option value="กรุงเทพฯ">กรุงเทพฯ</option>
                        <option value="ตะวันออก">ตะวันออก</option>
                        <option value="ใต้">ใต้</option>
                        <option value="เหนือ">เหนือ</option>
                      </select>
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        min={1}
                        value={rec.quantity}
                        onChange={(e) => handleCellChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-violet-500 outline-none text-slate-800 text-right"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        value={rec.revenue}
                        onChange={(e) => handleCellChange(idx, 'revenue', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-violet-500 outline-none text-slate-800 text-right font-semibold"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        value={rec.cost}
                        onChange={(e) => handleCellChange(idx, 'cost', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-violet-500 outline-none text-slate-800 text-right"
                      />
                    </td>
                    <td className="p-2 text-right font-bold text-emerald-700">
                      {rec.profit.toLocaleString()}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleDeleteRow(idx)}
                        className="text-slate-300 hover:text-rose-600 transition p-1"
                        title="ลบแถว"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            การแก้ไขในตารางนี้จะอัปเดตตัวเลขและชาร์ตบนแดชบอร์ด VISTA ทันที
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold"
            >
              บันทึกและปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
