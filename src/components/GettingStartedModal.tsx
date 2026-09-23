import React from 'react';
import {
  X,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle,
  Sparkles,
  Layers,
  Palette,
  ArrowRight,
} from 'lucide-react';

interface GettingStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConnectSheet: () => void;
  onOpenTheme?: () => void;
}

export const GettingStartedModal: React.FC<GettingStartedModalProps> = ({
  isOpen,
  onClose,
  onOpenConnectSheet,
  onOpenTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-getting-started"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#18152b] text-slate-200 w-full max-w-2xl rounded-2xl border border-[#312a59] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-[#2d2652] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                วิธีใช้งาน VISTA BI Studio เชื่อมต่อ Google Sheets
              </h2>
              <p className="text-xs text-slate-400">
                ระบบเว็ปแอพ BI อิสระ ดึงข้อมูลชีท กำหนดแถว และเลือกธีมสีได้ตามต้องการ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#251f45] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-[#201a3d] border border-[#352c61] flex gap-3">
            <div className="w-7 h-7 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm">เว็ปแอพ BI แยกอิสระ ไม่ต้องพึ่ง Apps Script</h3>
              <p className="text-slate-300 leading-relaxed">
                แอปพลิเคชันนี้ทำงานเป็น Standalone Web App เต็มรูปแบบ สามารถเชื่อมต่อกับ Google Sheets ได้โดยตรงผ่าน Google API หรือเปิดแชร์ลิงก์สาธารณะ ดึงข้อมูลมาประมวลผลและสร้างวิชวลได้ทันที
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-[#201a3d] border border-[#352c61] flex gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm">
                เลือกแผ่นงาน (Sheet Tab) และเลือกแถวเริ่มต้นข้อมูล (Row Range)
              </h3>
              <p className="text-slate-300 leading-relaxed">
                คุณสามารถเลือกแผ่นงานที่ต้องการ และระบุแถวที่เก็บหัวตาราง (เช่น เริ่มต้นที่แถว 3) และแถวที่เริ่มต้นนับข้อมูล (เช่น เริ่มแถว 4 ลงไปจนแถวสุดท้าย) เพื่อรองรับตารางรายงานที่มีส่วนหัวเรื่องด้านบน
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenConnectSheet();
                }}
                className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>เปิดหน้าต่างตั้งค่า Google Sheets</span>
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-[#201a3d] border border-[#352c61] flex gap-3">
            <div className="w-7 h-7 rounded-full bg-pink-600 text-white font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm">ปรับแต่งธีมของพื้นที่ทำงาน</h3>
              <p className="text-slate-300 leading-relaxed">
                คลิกปุ่ม <strong>"ธีม"</strong> ที่แถบด้านบนหรือแถบด้านซ้าย เพื่อเลือก 6 โทนสีสำเร็จรูป (สว่าง, มิดไนท์, โอเชียน, ไวโอเล็ต, ฟอเรสต์, ซันเซ็ต) หรือปรับสีหลักและฟอนต์ได้ตามต้องการ
              </p>
              {onOpenTheme && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenTheme();
                  }}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-400 text-slate-950 font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>เปิดเครื่องมือปรับแต่งธีม</span>
                </button>
              )}
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-[#201a3d] border border-[#352c61] flex gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
              4
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm">การจัดเรียงและการทำงานกับวิชวล</h3>
              <p className="text-slate-300 leading-relaxed">
                คุณสามารถเพิ่มวิชวลได้ถึง 28 รูปแบบ ปรับมิติข้อมูล (Dimension), ตัวชี้วัด (Metric), การคำนวณ (SUM, AVG, COUNT, MIN, MAX), บันทึกสแนปช็อตเวอร์ชัน, ล็อกการ์ด, และซิงค์ข้อมูลล่าสุดได้ทุกเมื่อ
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#2d2652] bg-[#141126] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition cursor-pointer"
          >
            เข้าใจแล้ว เริ่มต้นใช้งาน
          </button>
        </div>
      </div>
    </div>
  );
};
