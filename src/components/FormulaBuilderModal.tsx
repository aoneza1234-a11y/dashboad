import React, { useState } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Check,
  X,
  Code2,
  Sparkles,
  HelpCircle,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { CalculatedField, SalesRecord } from '../types';
import { evaluateFormula } from '../utils/formulaEngine';

interface FormulaBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculatedFields: CalculatedField[];
  onSaveCalculatedFields: (fields: CalculatedField[]) => void;
  availableColumns: string[];
  sampleRecord?: SalesRecord;
}

export const FormulaBuilderModal: React.FC<FormulaBuilderModalProps> = ({
  isOpen,
  onClose,
  calculatedFields,
  onSaveCalculatedFields,
  availableColumns,
  sampleRecord,
}) => {
  const [fields, setFields] = useState<CalculatedField[]>(calculatedFields);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  // Form state for creating/editing
  const [fieldName, setFieldName] = useState('');
  const [expression, setExpression] = useState('');
  const [format, setFormat] = useState<'number' | 'currency' | 'percent'>('number');
  const [decimals, setDecimals] = useState(2);

  if (!isOpen) return null;

  // Presets
  const presets = [
    {
      title: 'กำไร (Profit)',
      expression: '[revenue] - [cost]',
      format: 'currency' as const,
      desc: 'รายได้ ลบ ต้นทุน',
    },
    {
      title: 'อัตรากำไร (Margin %)',
      expression: '([profit] / [revenue]) * 100',
      format: 'percent' as const,
      desc: 'กำไร หารด้วย รายได้ คิดเป็นร้อยละ',
    },
    {
      title: 'ราคาเฉลี่ยต่อหน่วย (Avg Price)',
      expression: '[revenue] / [quantity]',
      format: 'currency' as const,
      desc: 'รายได้ หารด้วย จำนวนหน่วยสินค้า',
    },
    {
      title: 'ต้นทุนต่อหน่วย (Cost/Unit)',
      expression: '[cost] / [quantity]',
      format: 'currency' as const,
      desc: 'ต้นทุนรวม หารด้วย จำนวนหน่วยสินค้า',
    },
  ];

  const handleApplyPreset = (p: (typeof presets)[0]) => {
    setFieldName(p.title);
    setExpression(p.expression);
    setFormat(p.format);
  };

  const handleInsertColumn = (col: string) => {
    setExpression((prev) => `${prev}[${col}]`);
  };

  const handleInsertOperator = (op: string) => {
    setExpression((prev) => `${prev} ${op} `);
  };

  // Preview evaluation on sample row
  const previewValue = sampleRecord ? evaluateFormula(expression, sampleRecord) : null;

  const handleSaveField = () => {
    if (!fieldName.trim() || !expression.trim()) {
      alert('กรุณากรอกชื่อฟิลด์และสูตรคำนวณ');
      return;
    }

    let updated: CalculatedField[];
    if (editingFieldId) {
      updated = fields.map((f) =>
        f.id === editingFieldId
          ? {
              ...f,
              name: fieldName.trim(),
              expression: expression.trim(),
              format,
              decimals,
            }
          : f
      );
    } else {
      const newField: CalculatedField = {
        id: `calc_${Date.now()}`,
        name: fieldName.trim(),
        expression: expression.trim(),
        format,
        decimals,
      };
      updated = [...fields, newField];
    }

    setFields(updated);
    onSaveCalculatedFields(updated);
    setFieldName('');
    setExpression('');
    setEditingFieldId(null);
  };

  const handleEdit = (f: CalculatedField) => {
    setEditingFieldId(f.id);
    setFieldName(f.name);
    setExpression(f.expression);
    setFormat(f.format || 'number');
    setDecimals(f.decimals ?? 2);
  };

  const handleDelete = (id: string) => {
    const updated = fields.filter((f) => f.id !== id);
    setFields(updated);
    onSaveCalculatedFields(updated);
    if (editingFieldId === id) {
      setEditingFieldId(null);
      setFieldName('');
      setExpression('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#18142e] border border-violet-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-violet-900/40 flex items-center justify-between bg-[#151129]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/30 border border-violet-400/40 flex items-center justify-center text-violet-300">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>ตัวสร้างสูตรคำนวณ (Formula Builder / Calculated Field)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-normal">
                  เหมือน Power BI / Looker
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                สร้างคอลัมน์คำนวณใหม่ได้ทันทีในแดชบอร์ด โดยไม่ต้องกลับไปใส่สูตรใน Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Presets */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>เลือกสูตรสำเร็จรูปที่ใช้บ่อย (Quick Presets)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presets.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2.5 rounded-xl bg-[#201a3d] hover:bg-violet-900/40 border border-[#342b61] hover:border-violet-500/50 text-left transition cursor-pointer group"
                >
                  <div className="font-bold text-xs text-violet-200 group-hover:text-white flex items-center justify-between">
                    <span>{p.title}</span>
                    <Plus className="w-3 h-3 text-violet-400" />
                  </div>
                  <div className="text-[10px] text-slate-400 truncate font-mono mt-1">
                    {p.expression}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Builder Form */}
          <div className="p-4 rounded-xl bg-[#1e183a] border border-[#312759] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ชื่อคอลัมน์ใหม่ (Field Name)
                </label>
                <input
                  type="text"
                  placeholder="เช่น Profit, Margin %, Growth"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141126] border border-[#342a5c] rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  รูปแบบผลลัพธ์
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#141126] border border-[#342a5c] rounded-lg text-xs text-white outline-none focus:border-violet-400 cursor-pointer"
                >
                  <option value="number">ตัวเลขทั่วไป (1,234)</option>
                  <option value="currency">สกุลเงินบาท (฿)</option>
                  <option value="percent">เปอร์เซ็นต์ (%)</option>
                </select>
              </div>
            </div>

            {/* Expression Box */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-violet-400" />
                  <span>สูตรคำนวณ (Formula Expression)</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  ใช้เครื่องหมาย [ชื่อคอลัมน์] และ + - * / ( )
                </span>
              </div>
              <input
                type="text"
                placeholder="เช่น [revenue] - [cost] หรือ ([profit] / [revenue]) * 100"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                className="w-full px-3 py-2 bg-[#141126] border border-[#342a5c] rounded-lg text-xs text-emerald-400 font-mono placeholder-slate-500 outline-none focus:border-violet-400"
              />
            </div>

            {/* Quick Insert Buttons */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 mr-1">คลิกเพื่อใส่คอลัมน์:</span>
                {availableColumns.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => handleInsertColumn(col)}
                    className="px-2 py-0.5 rounded bg-[#2a2250] hover:bg-violet-600/40 text-violet-200 border border-violet-500/30 text-[11px] font-mono transition cursor-pointer"
                  >
                    + [{col}]
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 mr-1">เครื่องหมาย:</span>
                {['+', '-', '*', '/', '(', ')', '%'].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => handleInsertOperator(op)}
                    className="w-7 h-7 rounded bg-[#2a2250] hover:bg-violet-600 text-white font-bold text-xs flex items-center justify-center transition cursor-pointer"
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time Preview */}
            <div className="p-3 rounded-lg bg-[#141126] border border-[#2b224e] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">ผลทดสอบสูตรกับแถวแรก:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {previewValue !== null
                    ? format === 'currency'
                      ? `${previewValue.toLocaleString('th-TH', { maximumFractionDigits: 2 })} ฿`
                      : format === 'percent'
                      ? `${previewValue.toLocaleString('th-TH', { maximumFractionDigits: 2 })}%`
                      : previewValue.toLocaleString('th-TH', { maximumFractionDigits: 2 })
                    : '-'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSaveField}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingFieldId ? 'อัปเดตสูตร' : 'บันทึกสูตรนี้'}</span>
              </button>
            </div>
          </div>

          {/* Existing Calculated Fields List */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2">
              รายการคอลัมน์คำนวณที่มีอยู่ในแดชบอร์ด ({fields.length})
            </div>
            {fields.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#1a1533] border border-[#2d2354] text-center text-xs text-slate-400">
                ยังไม่มีคอลัมน์ที่สร้างด้วยสูตร คลิกเลือกสูตรด้านบนเพื่อสร้างคอลัมน์แรกของคุณได้ทันที
              </div>
            ) : (
              <div className="space-y-2">
                {fields.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-xl bg-[#1e183a] border border-[#312759] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{f.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-900/60 text-violet-300 font-mono">
                          {f.format === 'currency' ? 'สกุลเงิน (฿)' : f.format === 'percent' ? 'เปอร์เซ็นต์ (%)' : 'ตัวเลข'}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400/90 mt-0.5">
                        = {f.expression}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(f)}
                        className="px-2.5 py-1 rounded bg-[#2a2250] hover:bg-violet-600 text-violet-200 hover:text-white text-xs transition cursor-pointer"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-violet-900/40 flex items-center justify-between bg-[#151129]">
          <span className="text-xs text-slate-400">
            คอลัมน์ที่สร้างจะแสดงในตัวเลือก Dimension, Metric และตัวกรองของทุกกราฟโดยอัตโนมัติ
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};
