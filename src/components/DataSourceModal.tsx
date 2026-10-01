import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Database,
  Upload,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  FolderOpen,
  ArrowRight,
  Shield,
  Layers,
  FileText,
  AlertCircle,
  RefreshCw,
  Link2,
  ExternalLink,
} from 'lucide-react';
import { SalesRecord, TeamUser } from '../types';
import { parseExcelOrCsvFile, parseExcelFromSharedUrl } from '../utils/fileParser';
import {
  dbGetDataSources,
  dbSaveDataSource,
  dbDeleteDataSource,
  DBDataSource,
  DBUser,
} from '../services/cloudDatabase';

interface DataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TeamUser | null;
  currentSalesData: SalesRecord[];
  onSelectDataSource: (records: SalesRecord[], sourceName: string) => void;
}

export const DataSourceModal: React.FC<DataSourceModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentSalesData = [],
  onSelectDataSource,
}) => {
  const [dataSources, setDataSources] = useState<DBDataSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my_sources' | 'upload_new' | 'link_excel'>('my_sources');
  const [excelUrl, setExcelUrl] = useState('');
  const [sheetNameInput, setSheetNameInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const dbUser: DBUser = {
        userId: currentUser?.id || 'usr-default-storage',
        email: currentUser?.email || 'user@internal',
        name: currentUser?.displayName || 'ผู้ใช้งาน',
        role: currentUser?.role || 'editor',
        createdDate: currentUser?.createdAt || new Date().toISOString(),
      };
      const list = await dbGetDataSources(dbUser);
      setDataSources(list);
    } catch (e: any) {
      setErrorMsg('ไม่สามารถโหลดรายการชุดข้อมูลได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSources();
      setUploadSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const effectiveUserId = currentUser?.id || 'usr-default-storage';

    setIsUploading(true);
    setErrorMsg(null);
    setUploadSuccessMsg(null);

    try {
      const parsed = await parseExcelOrCsvFile(file);
      if (parsed.records.length === 0) {
        setErrorMsg('ไม่พบข้อมูลในไฟล์ที่เลือก กรุณาตรวจสอบรูปแบบไฟล์');
        return;
      }

      // Save into Database Table DataSources
      const saved = await dbSaveDataSource(effectiveUserId, file.name, parsed.records);
      setDataSources((prev) => [saved, ...prev]);
      setUploadSuccessMsg(`อัปโหลดและจัดเก็บ "${file.name}" เรียบร้อยแล้ว (${parsed.totalRows} แถว)`);

      // Automatically activate this dataset
      onSelectDataSource(parsed.records, file.name);

      setTimeout(() => {
        setActiveTab('my_sources');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(`เกิดข้อผิดพลาดในการอ่านไฟล์: ${err?.message || 'รูปแบบไฟล์ไม่ถูกต้อง'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportFromUrl = async () => {
    if (!excelUrl.trim()) {
      setErrorMsg('กรุณาระบุลิงก์แชร์ Excel, OneDrive หรือ Google Sheets ที่ถูกต้อง');
      return;
    }
    const effectiveUserId = currentUser?.id || 'usr-default-storage';
    setIsFetchingUrl(true);
    setErrorMsg(null);
    setUploadSuccessMsg(null);

    try {
      const parsed = await parseExcelFromSharedUrl(excelUrl.trim(), sheetNameInput.trim() || undefined);
      if (!parsed.records || parsed.records.length === 0) {
        setErrorMsg('ไม่พบข้อมูลแถวในลิงก์ที่ระบุ กรุณาตรวจสอบว่าเปิดสิทธิ์สาธารณะหรือทุกคนที่มีลิงก์แล้วหรือไม่');
        return;
      }

      // Save into Database Table DataSources
      const saved = await dbSaveDataSource(effectiveUserId, parsed.fileName, parsed.records);
      setDataSources((prev) => [saved, ...prev]);
      setUploadSuccessMsg(`นำเข้าและจัดเก็บบนคลาวด์ "${parsed.fileName}" เรียบร้อยแล้ว (${parsed.totalRows} แถว)`);

      // Automatically activate this dataset
      onSelectDataSource(parsed.records, parsed.fileName);
      setExcelUrl('');

      setTimeout(() => {
        setActiveTab('my_sources');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(`เกิดข้อผิดพลาดในการดึงข้อมูลจากลิงก์: ${err?.message || 'ไม่สามารถเข้าถึงไฟล์ได้'}`);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleSaveCurrentDataset = async () => {
    const effectiveUserId = currentUser?.id || 'usr-default-storage';
    if (!currentSalesData || currentSalesData.length === 0) {
      setErrorMsg('ไม่มีข้อมูลแถวยอดขายที่จะบันทึก');
      return;
    }
    setIsUploading(true);
    try {
      const title = `ชุดข้อมูลภาพรวม_${new Date().toISOString().split('T')[0]}_${new Date().toLocaleTimeString('th-TH').replace(/:/g, '-')}`;
      const saved = await dbSaveDataSource(effectiveUserId, `${title}.csv`, currentSalesData);
      setDataSources((prev) => [saved, ...prev]);
      setUploadSuccessMsg(`บันทึกชุดข้อมูลปัจจุบันลง Storage สำเร็จ (${currentSalesData.length} แถว)`);
    } catch (e: any) {
      setErrorMsg(e?.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('คุณต้องการลบชุดข้อมูลนี้ออกจากคลาวด์ใช่หรือไม่?')) return;
    try {
      await dbDeleteDataSource(id);
      setDataSources((prev) => prev.filter((d) => d.dataSourceId !== id));
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <div
      id="modal-datasource-storage"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#141224] text-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#2b2450]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#262044] bg-[#1a1730] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>คลังชุดข้อมูลคลาวด์ (Data Source Storage)</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-medium">
                  {currentUser?.role === 'admin' ? 'โหมด Admin (เข้าถึงทุกชุดข้อมูล)' : `ผู้ใช้: ${currentUser?.displayName || 'User'}`}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                จัดเก็บไฟล์ Excel/CSV ลงในฐานข้อมูลถาวร เมื่อ Login ใหม่ไม่ต้องอัปโหลดซ้ำ สามารถเลือกใช้งานได้ทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#251f46] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 py-2.5 bg-[#120f21] border-b border-[#262044] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('my_sources')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'my_sources'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-[#1c1833] text-slate-400 hover:text-white'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>ชุดข้อมูลที่จัดเก็บไว้ ({dataSources.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('upload_new')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'upload_new'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-[#1c1833] text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>อัปโหลด Excel / CSV ใหม่</span>
            </button>

            <button
              onClick={() => setActiveTab('link_excel')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'link_excel'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm'
                  : 'bg-[#1c1833] text-teal-400 hover:text-white'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>🔗 วางลิงก์แชร์ Excel / OneDrive</span>
            </button>
          </div>

          <button
            onClick={handleSaveCurrentDataset}
            disabled={isUploading}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5" />
            <span>จัดเก็บข้อมูลปัจจุบัน ({currentSalesData.length} แถว)</span>
          </button>
        </div>

        {/* Notifications */}
        {uploadSuccessMsg && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccessMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {activeTab === 'upload_new' ? (
            <div className="border-2 border-dashed border-[#372d63] hover:border-violet-500 rounded-2xl p-8 text-center bg-[#18142c] transition flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center mb-4 border border-violet-500/30 shadow-lg">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                ลากไฟล์มาวาง หรือคลิกเพื่ออัปโหลด Excel / CSV
              </h3>
              <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">
                รองรับไฟล์ <strong>.xlsx, .xls, .csv</strong> ระบบจะแยกและแปลงข้อมูลแถว จัดเก็บไว้ใน Database ถาวรให้บัญชีของคุณทันที
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-datasource"
              />

              <label
                htmlFor="file-upload-datasource"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition transform active:scale-98"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังประมวลผลและจัดเก็บบน Database...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>เลือกไฟล์จากคอมพิวเตอร์ของคุณ</span>
                  </>
                )}
              </label>

              <div className="mt-6 flex items-center gap-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ไม่ต้องอัปโหลดซ้ำเมื่อ Login ใหม่
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  แยกข้อมูลเฉพาะบัญชีคุณ (Isolated)
                </span>
              </div>
            </div>
          ) : activeTab === 'link_excel' ? (
            <div className="border border-[#342a5c] rounded-2xl p-6 bg-[#18142c] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0">
                  <Link2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    นำเข้าข้อมูลจากลิงก์แชร์ Excel / OneDrive / Google Drive
                  </h3>
                  <p className="text-xs text-slate-400">
                    วางลิงก์ไฟล์ Excel ที่แชร์แบบสาธารณะ หรือแชร์ให้ทุกคนที่มีลิงก์ดูได้ ระบบจะดึงข้อมูลมาแปลงและบันทึกอัตโนมัติ
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>ลิงก์ไฟล์ Excel / OneDrive / SharePoint / Google Drive / URL</span>
                    <span className="text-[11px] text-teal-400">รองรับ OneDrive, SharePoint, Google Sheets, Dropbox, Direct .xlsx</span>
                  </label>
                  <input
                    type="url"
                    value={excelUrl}
                    onChange={(e) => setExcelUrl(e.target.value)}
                    placeholder="วางลิงก์ เช่น https://1drv.ms/x/... หรือ https://docs.google.com/spreadsheets/d/.../edit"
                    className="w-full px-3.5 py-2.5 bg-[#201a3b] border border-[#342a5c] rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-teal-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleImportFromUrl();
                    }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      ชื่อแผ่นงาน (Sheet Name) - เว้นว่างได้เพื่อใช้ Sheet แรก
                    </label>
                    <input
                      type="text"
                      value={sheetNameInput}
                      onChange={(e) => setSheetNameInput(e.target.value)}
                      placeholder="เช่น Sheet1 หรือ ยอดขาย"
                      className="w-full px-3 py-1.5 bg-[#201a3b] border border-[#342a5c] rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-teal-400"
                    />
                  </div>
                  <div className="shrink-0 pt-4">
                    <button
                      onClick={handleImportFromUrl}
                      disabled={isFetchingUrl || !excelUrl.trim()}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition"
                    >
                      {isFetchingUrl ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>กำลังดึงข้อมูลจากลิงก์...</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>ดึงข้อมูลและบันทึกสู่คลาวด์</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#201a3b] border border-[#302657] text-[11px] text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300">💡 เคล็ดลับการแชร์ลิงก์:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-400 pl-1">
                    <li><strong>OneDrive / SharePoint:</strong> กดแชร์ (Share) แล้วเลือก "ทุกคนที่มีลิงก์สามารถดูได้ (Anyone with the link can view)"</li>
                    <li><strong>Google Sheets:</strong> กดแชร์ (Share) เลือก "ทุกคนที่มีลิงก์ (Anyone with link)" เป็น Viewer</li>
                    <li><strong>Dropbox:</strong> คัดลอกลิงก์แชร์ของไฟล์ .xlsx</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {isLoading ? (
                <div className="py-16 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-400" />
                  <p className="text-xs">กำลังโหลดชุดข้อมูลของคุณจากคลาวด์...</p>
                </div>
              ) : dataSources.length === 0 ? (
                <div className="py-14 text-center border border-[#2a224a] rounded-2xl bg-[#161228] p-8">
                  <Database className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-white mb-1">ยังไม่มีชุดข้อมูลที่จัดเก็บ</h4>
                  <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                    เมื่อคุณอัปโหลดไฟล์ Excel หรือ CSV ระบบจะจัดเก็บไว้ที่นี่ เพื่อให้คุณเข้าใช้งานได้ตลอดเวลา
                  </p>
                  <button
                    onClick={() => setActiveTab('upload_new')}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>อัปโหลดชุดข้อมูลแรกของคุณ</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dataSources.map((ds) => (
                    <div
                      key={ds.dataSourceId}
                      className="p-4 rounded-xl bg-[#1b1733] border border-[#2d2554] hover:border-violet-500/50 transition flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                              <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white truncate max-w-[200px]" title={ds.fileName}>
                                {ds.fileName}
                              </h4>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(ds.uploadDate).toLocaleString('th-TH')}</span>
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleDelete(ds.dataSourceId, e)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded-md transition cursor-pointer opacity-0 group-hover:opacity-100"
                            title="ลบชุดข้อมูลนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mb-3 text-[11px] text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-[#251f46] text-violet-300 font-medium">
                            {ds.recordCount} แถว
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#251f46] text-slate-300">
                            {ds.columns?.length || 0} คอลัมน์
                          </span>
                          {currentUser?.role === 'admin' && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                              UID: {ds.userId}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onSelectDataSource(ds.records, ds.fileName);
                          onClose();
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>เปิดใช้งานชุดข้อมูลนี้</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#262044] bg-[#1a1730] flex items-center justify-between text-xs text-slate-400">
          <span>ข้อมูลถูกเข้ารหัสและจัดเก็บบน Google Cloud Firestore</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#272049] hover:bg-[#342b62] text-slate-200 font-medium transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
