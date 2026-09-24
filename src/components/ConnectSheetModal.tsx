import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Link2,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  Table,
  Check,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SheetConnectionConfig, SalesRecord } from '../types';
import {
  createQuarterlySalesSpreadsheet,
  fetchSpreadsheetMetadata,
  fetchSheetRowsWithConfig,
  extractSpreadsheetId,
} from '../services/googleSheets';
import { INITIAL_SALES_RECORDS } from '../data/sampleData';

interface ConnectSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SheetConnectionConfig;
  onUpdateConfig: (newConfig: SheetConnectionConfig) => void;
  user: User | null;
  accessToken: string | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  salesData: SalesRecord[];
  onImportData: (records: SalesRecord[], sheetTitle: string, detectedHeaders?: string[]) => void;
  onOpenDataEditor?: () => void;
}

export const ConnectSheetModal: React.FC<ConnectSheetModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  user,
  accessToken,
  onSignIn,
  onSignOut,
  salesData,
  onImportData,
  onOpenDataEditor,
}) => {
  const [sheetInput, setSheetInput] = useState(config.spreadsheetId || '');
  const [selectedSheetTab, setSelectedSheetTab] = useState(config.sheetName || 'ยอดขายรายไตรมาส');
  const [availableSheets, setAvailableSheets] = useState<string[]>(
    config.availableSheets && config.availableSheets.length > 0
      ? config.availableSheets
      : ['ยอดขายรายไตรมาส', 'Sheet1', 'แผ่นงาน1']
  );
  const [headerRow, setHeaderRow] = useState<number>(config.headerRow || 1);
  const [dataStartRow, setDataStartRow] = useState<number>(config.dataStartRow || 2);
  const [dataEndRow, setDataEndRow] = useState<string>(
    config.dataEndRow ? String(config.dataEndRow) : ''
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isDiscoveringSheets, setIsDiscoveringSheets] = useState(false);
  const [previewRecords, setPreviewRecords] = useState<SalesRecord[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [allFetchedRecords, setAllFetchedRecords] = useState<SalesRecord[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Auto-discover sheet tabs whenever sheet link/ID is entered
  const discoverSheets = async (targetIdOrUrl?: string, autoFetchFirst: boolean = false) => {
    const raw = targetIdOrUrl || sheetInput;
    if (!raw.trim()) return;

    const cleanId = extractSpreadsheetId(raw);
    if (!cleanId || cleanId.length < 5) return;

    setIsDiscoveringSheets(true);
    try {
      const meta = await fetchSpreadsheetMetadata(cleanId, accessToken);
      if (meta.sheets && meta.sheets.length > 0) {
        setAvailableSheets(meta.sheets);
        
        // If current tab is not in discovered list or is placeholder, pick the first discovered tab
        let nextTab = selectedSheetTab;
        if (!meta.sheets.includes(selectedSheetTab)) {
          nextTab = meta.sheets[0];
          setSelectedSheetTab(nextTab);
        }

        setStatusMsg({
          type: 'info',
          text: `ค้นพบ ${meta.sheets.length} แผ่นงานในลิงก์นี้: ${meta.sheets.join(', ')}`,
        });

        if (autoFetchFirst) {
          handleDiscoverAndFetch(nextTab, meta.sheets);
        }
      }
    } catch (err) {
      console.warn('Auto discover sheets error', err);
    } finally {
      setIsDiscoveringSheets(false);
    }
  };

  // Automatically trigger sheet discovery when modal opens or link is pasted
  useEffect(() => {
    if (!isOpen) return;
    const cleanId = extractSpreadsheetId(sheetInput);
    if (cleanId && cleanId.length > 5) {
      const timer = setTimeout(() => {
        discoverSheets(cleanId);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sheetInput, isOpen]);

  if (!isOpen) return null;

  const handleDiscoverAndFetch = async (targetSheetTab?: string, knownSheets?: string[]) => {
    if (!sheetInput.trim()) {
      setStatusMsg({ type: 'error', text: 'กรุณาใส่ลิงก์หรือ Spreadsheet ID ของ Google Sheets' });
      return;
    }

    setIsLoading(true);
    setStatusMsg({ type: 'info', text: 'กำลังเชื่อมต่อและดึงข้อมูลจาก Google Sheets...' });

    try {
      const cleanId = extractSpreadsheetId(sheetInput);
      
      // Step 1: Discover Sheets / Tabs if not already provided
      let tabs = knownSheets || availableSheets;
      try {
        const meta = await fetchSpreadsheetMetadata(cleanId, accessToken);
        if (meta.sheets && meta.sheets.length > 0) {
          tabs = meta.sheets;
          setAvailableSheets(meta.sheets);
        }
      } catch (e) {
        console.warn('Metadata discovery error, using current tab list', e);
      }

      // Determine active sheet tab
      const activeTab = targetSheetTab || (tabs.includes(selectedSheetTab) ? selectedSheetTab : tabs[0] || 'แผ่นงานหลัก (อัตโนมัติ)');
      if (activeTab !== selectedSheetTab) {
        setSelectedSheetTab(activeTab);
      }

      // Step 2: Fetch Data for this tab
      const endRowNumber = dataEndRow.trim() ? parseInt(dataEndRow) : undefined;
      const res = await fetchSheetRowsWithConfig(
        cleanId,
        activeTab,
        headerRow,
        dataStartRow,
        endRowNumber,
        accessToken
      );

      if (res.records.length === 0) {
        setStatusMsg({
          type: 'error',
          text: `ไม่พบข้อมูลในแผ่นงาน "${activeTab}" ตามช่วงแถวที่ระบุ กรุณาตรวจสอบเลขแถวเริ่มต้น`,
        });
        return;
      }

      setAllFetchedRecords(res.records);
      setPreviewRecords(res.records.slice(0, 5));
      setPreviewHeaders(res.headers);

      // เมื่อดึงข้อมูลสมบูรณ์ ให้นำชุดข้อมูลนี้ไปใช้งานในระบบและแดชบอร์ดทันที!
      const sheetTitle = cleanId ? `Google Sheet (${cleanId.slice(0, 8)}...)` : 'ยอดขายรายไตรมาส';
      const updatedConfig: SheetConnectionConfig = {
        ...config,
        spreadsheetId: cleanId,
        spreadsheetTitle: sheetTitle,
        sheetName: activeTab,
        availableSheets: tabs,
        headerRow,
        dataStartRow,
        dataEndRow: endRowNumber,
        status: 'connected',
        lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        mode: accessToken ? 'sheets_api' : 'public_url',
        detectedHeaders: res.headers,
      };

      onUpdateConfig(updatedConfig);
      onImportData(res.records, updatedConfig.spreadsheetTitle, res.headers);

      setStatusMsg({
        type: 'success',
        text: `ดึงข้อมูลสำเร็จและนำเข้าแดชบอร์ดแล้ว! พบ ${res.records.length} แถว และ ${res.headers.length} คอลัมน์ (พร้อมเปิดแก้ไขชุดข้อมูลได้ทันที)`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: err.message || 'ไม่สามารถดึงข้อมูลได้ กรุณาตรวจสอบการแชร์ชีต หรือเข้าสู่ระบบ Google',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetTabChange = (newTab: string) => {
    setSelectedSheetTab(newTab);
    if (sheetInput.trim()) {
      handleDiscoverAndFetch(newTab);
    }
  };

  const handleApplyToDashboard = async (andOpenEditor: boolean = false) => {
    const cleanId = extractSpreadsheetId(sheetInput);
    const endRowNumber = dataEndRow.trim() ? parseInt(dataEndRow) : undefined;

    setIsLoading(true);
    try {
      let finalRecords: SalesRecord[] = allFetchedRecords.length > 0 ? allFetchedRecords : [];
      let finalHeaders: string[] = previewHeaders.length > 0 ? previewHeaders : [];

      if (finalRecords.length === 0 && sheetInput.trim()) {
        const res = await fetchSheetRowsWithConfig(
          cleanId,
          selectedSheetTab,
          headerRow,
          dataStartRow,
          endRowNumber,
          accessToken
        );
        finalRecords = res.records;
        finalHeaders = res.headers;
        setAllFetchedRecords(res.records);
      } else if (finalRecords.length === 0) {
        // Use current data
        finalRecords = salesData;
        finalHeaders = ['ลำดับ', 'วันที่', 'เลขที่คำสั่งซื้อ', 'ชื่อสินค้า', 'หมวดหมู่', 'ภูมิภาค', 'จำนวน', 'ยอดขาย', 'ต้นทุน', 'กำไร'];
      }

      const updatedConfig: SheetConnectionConfig = {
        ...config,
        spreadsheetId: cleanId,
        spreadsheetTitle: cleanId ? `Google Sheet (${cleanId.slice(0, 8)}...)` : 'ยอดขายรายไตรมาส',
        sheetName: selectedSheetTab,
        availableSheets,
        headerRow,
        dataStartRow,
        dataEndRow: endRowNumber,
        status: 'connected',
        lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        mode: accessToken ? 'sheets_api' : 'public_url',
        detectedHeaders: finalHeaders,
      };

      onUpdateConfig(updatedConfig);
      onImportData(
        finalRecords,
        updatedConfig.spreadsheetTitle,
        finalHeaders
      );

      setStatusMsg({ type: 'success', text: 'นำเข้าข้อมูลเข้าแดชบอร์ดเรียบร้อยแล้ว!' });
      setTimeout(() => {
        onClose();
        if (andOpenEditor && onOpenDataEditor) {
          onOpenDataEditor();
        }
      }, 500);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSampleData = () => {
    onImportData(
      INITIAL_SALES_RECORDS,
      'ยอดขายรายไตรมาส (ตัวอย่าง)',
      ['ลำดับ', 'วันที่', 'เลขที่คำสั่งซื้อ', 'ชื่อสินค้า', 'หมวดหมู่', 'ภูมิภาค', 'จำนวน', 'ยอดขาย (บาท)', 'ต้นทุน (บาท)', 'กำไรขั้นต้น (บาท)']
    );
    setHeaderRow(1);
    setDataStartRow(2);
    setDataEndRow('');
    setSelectedSheetTab('ยอดขายรายไตรมาส');
    onUpdateConfig({
      ...config,
      spreadsheetId: '',
      spreadsheetTitle: 'ยอดขายรายไตรมาส (ตัวอย่าง)',
      sheetName: 'ยอดขายรายไตรมาส',
      availableSheets: ['ยอดขายรายไตรมาส'],
      headerRow: 1,
      dataStartRow: 2,
      dataEndRow: null,
      status: 'connected',
      lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      mode: 'sample',
      detectedHeaders: ['ลำดับ', 'วันที่', 'เลขที่คำสั่งซื้อ', 'ชื่อสินค้า', 'หมวดหมู่', 'ภูมิภาค', 'จำนวน', 'ยอดขาย (บาท)', 'ต้นทุน (บาท)', 'กำไรขั้นต้น (บาท)'],
    });
    setStatusMsg({ type: 'success', text: 'โหลดชุดข้อมูลตัวอย่าง 12 รายการเรียบร้อยแล้ว' });
  };

  const applyPresetRow3To4 = () => {
    setHeaderRow(3);
    setDataStartRow(4);
    setDataEndRow('');
    setStatusMsg({
      type: 'info',
      text: 'ตั้งค่า: หัวตารางอยู่ที่แถวที่ 3 และข้อมูลเริ่มอ่านจากแถวที่ 4 ลงไปจนสุดท้าย',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="modal-connect-sheet"
        className="w-full max-w-2xl bg-[#19152e] border border-[#342a59] rounded-2xl shadow-2xl text-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2d244f] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                เชื่อมต่อข้อมูล Google Sheets
              </h2>
              <p className="text-xs text-slate-400">
                ดึงข้อมูล เลือกแผ่นงาน (Sheet) และกำหนดแถวหัวตาราง / แถวเริ่มต้นข้อมูลได้อิสระ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#282047] text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Alert */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : statusMsg.type === 'error'
                  ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                  : 'bg-violet-950/60 border-violet-500/40 text-violet-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{statusMsg.text}</div>
            </div>
          )}

          {/* Section 1: Spreadsheet URL or ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>ลิงก์ Google Sheets หรือ Spreadsheet ID</span>
              <span className="text-[11px] text-teal-400 font-normal">
                (ชีตแชร์สาธารณะ หรือชีตใน Google Drive)
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="วางลิงก์ชีต เช่น https://docs.google.com/spreadsheets/d/.../edit"
                value={sheetInput}
                onChange={(e) => setSheetInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleDiscoverAndFetch();
                }}
                className="flex-1 px-3 py-2 bg-[#201a3b] border border-[#342a5c] rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-violet-400"
              />
              <button
                id="btn-discover-sheets"
                onClick={() => handleDiscoverAndFetch()}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>โหลดข้อมูลจากลิงก์</span>
              </button>
            </div>

            {/* Quick sample sheets for user testing */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
              <span className="text-slate-400">ชีตตัวอย่างทดสอบ:</span>
              <button
                type="button"
                onClick={() => {
                  const sample = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';
                  setSheetInput(sample);
                  setHeaderRow(1);
                  setDataStartRow(2);
                  setTimeout(() => handleDiscoverAndFetch(), 50);
                }}
                className="px-2 py-0.5 rounded bg-[#271f49] hover:bg-violet-600/50 text-violet-300 border border-violet-500/30 transition cursor-pointer"
              >
                📊 ชีตสถิติโลก (Public Sample)
              </button>
              <button
                type="button"
                onClick={() => {
                  const sample = 'https://docs.google.com/spreadsheets/d/1qpyC0XzvTcK7JNwqAXArAJWpeHpMwgTSZs54_zA90CQ/edit';
                  setSheetInput(sample);
                  setHeaderRow(1);
                  setDataStartRow(2);
                  setTimeout(() => handleDiscoverAndFetch(), 50);
                }}
                className="px-2 py-0.5 rounded bg-[#271f49] hover:bg-violet-600/50 text-violet-300 border border-violet-500/30 transition cursor-pointer"
              >
                📈 ชีตยอดขายผลิตภัณฑ์ (Sales Sample)
              </button>
            </div>
          </div>

          {/* Section 2: Sheet Tab Selection & Row Config */}
          <div className="p-4 rounded-xl bg-[#201a3d] border border-[#302657] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-violet-400" />
                <span>เลือกแผ่นงาน (เลือกชีทผ่าน Dropdown)</span>
                {isDiscoveringSheets ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-900/60 text-violet-300 border border-violet-500/40 flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    กำลังค้นหาแผ่นงาน...
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    พบ {availableSheets.length} แผ่นงาน
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Re-scan sheet tabs button */}
                <button
                  type="button"
                  onClick={() => discoverSheets(sheetInput)}
                  disabled={isDiscoveringSheets}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[#2a2250] hover:bg-violet-600/40 text-violet-200 border border-violet-500/30 transition cursor-pointer flex items-center gap-1"
                  title="สแกนหาแผ่นงานทั้งหมดใน Google Sheets ลิงก์นี้ใหม่"
                >
                  <RefreshCw className={`w-3 h-3 ${isDiscoveringSheets ? 'animate-spin text-violet-400' : ''}`} />
                  <span>ค้นหาชีตในลิงก์</span>
                </button>

                {/* Preset shortcut button */}
                <button
                  type="button"
                  onClick={applyPresetRow3To4}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/40 transition cursor-pointer"
                  title="คลิกเพื่อตั้งค่าหัวแถวที่ 3 และข้อมูลแถว 4-สุดท้าย"
                >
                  ⚡ หัวแถว 3 / ข้อมูล 4+
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Sheet Tab Dropdown */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  เลือกแผ่นงาน (ระบบจะโหลดข้อมูลของชีทที่เลือกทันที)
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedSheetTab}
                    onChange={(e) => handleSheetTabChange(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#161329] border border-[#362c61] rounded-lg text-xs text-white font-medium outline-none focus:border-violet-400 cursor-pointer shadow-inner"
                  >
                    {availableSheets.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Manual sheet name fallback or custom add */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  หรือพิมพ์ระบุชื่อแผ่นงานเอง
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="เช่น Sheet1 หรือ ยอดขาย"
                    value={selectedSheetTab}
                    onChange={(e) => setSelectedSheetTab(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleDiscoverAndFetch(selectedSheetTab);
                    }}
                    className="flex-1 px-3 py-1.5 bg-[#161329] border border-[#362c61] rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-violet-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedSheetTab && !availableSheets.includes(selectedSheetTab)) {
                        setAvailableSheets([...availableSheets, selectedSheetTab]);
                      }
                      handleDiscoverAndFetch(selectedSheetTab);
                    }}
                    disabled={isLoading}
                    className="px-2.5 py-1.5 bg-[#2b224e] hover:bg-[#382c66] rounded-lg text-xs text-violet-200 border border-violet-500/30 transition cursor-pointer shrink-0 font-medium"
                  >
                    โหลดชีตนี้
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Clickable Sheet Tab Chips */}
            {availableSheets.length > 0 && (
              <div className="pt-2 border-t border-[#29204c]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">คลิกเพื่อเลือกชีททันที:</span>
                  {availableSheets.map((s) => {
                    const isSelected = selectedSheetTab === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSheetTabChange(s)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40 border border-violet-400'
                            : 'bg-[#18132e] text-slate-300 hover:bg-[#271f49] hover:text-violet-200 border border-[#352a5c]'
                        }`}
                      >
                        <FileSpreadsheet className={`w-3 h-3 ${isSelected ? 'text-violet-200' : 'text-slate-400'}`} />
                        <span>{s}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5"></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Row Configuration: Header Row and Start Row */}
            <div className="pt-3 border-t border-[#2e2454]">
              <div className="text-xs font-bold text-white mb-2 flex items-center justify-between">
                <span>การกำหนดแถวของข้อมูล (Row Range)</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (ยืดหยุ่นสำหรับตารางที่มีหัวรายงานด้านบน)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    แถวหัวตาราง (Header)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={headerRow}
                    onChange={(e) => setHeaderRow(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 bg-[#161329] border border-[#362c61] rounded-lg text-xs text-white outline-none focus:border-violet-400 font-semibold"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    เช่น 1, 3 (ชื่อคอลัมน์)
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    แถวเริ่มข้อมูล (Start)
                  </label>
                  <input
                    type="number"
                    min={headerRow + 1}
                    value={dataStartRow}
                    onChange={(e) =>
                      setDataStartRow(Math.max(headerRow + 1, parseInt(e.target.value) || 2))
                    }
                    className="w-full px-3 py-1.5 bg-[#161329] border border-[#362c61] rounded-lg text-xs text-white outline-none focus:border-violet-400 font-semibold"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    เช่น 2, 4 (เริ่มนับแถวแรก)
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    แถวสิ้นสุด (End)
                  </label>
                  <input
                    type="text"
                    placeholder="ว่างไว้ = แถวสุดท้าย"
                    value={dataEndRow}
                    onChange={(e) => setDataEndRow(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#161329] border border-[#362c61] rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-violet-400"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    จนถึงแถวสุดท้าย
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons inside card */}
            <div className="flex items-center justify-between pt-2">
              <button
                id="btn-preview-sheet-data"
                onClick={() => handleDiscoverAndFetch(selectedSheetTab)}
                disabled={isLoading}
                className="px-3.5 py-1.5 rounded-lg bg-[#2e2456] hover:bg-[#3c2f6e] border border-violet-500/40 text-violet-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Table className="w-3.5 h-3.5" />
                <span>ตรวจสอบและโหลดข้อมูลชีตนี้</span>
              </button>

              <button
                onClick={handleLoadSampleData}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                ใช้ข้อมูลตัวอย่างในตัว
              </button>
            </div>
          </div>

          {/* Section 3: Live Preview Table (if checked) */}
          {previewHeaders.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span>ตัวอย่างข้อมูลที่ตรวจพบ ({previewRecords.length} แถวแรก)</span>
                <span className="text-[11px] text-emerald-400">
                  ตรวจพบคอลัมน์: {previewHeaders.slice(0, 4).join(', ')}
                  {previewHeaders.length > 4 ? ` และอีก ${previewHeaders.length - 4}` : ''}
                </span>
              </div>

              <div className="border border-[#2f2754] rounded-xl overflow-x-auto bg-[#141126] max-h-48 text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-[#201a3b] text-violet-300 sticky top-0">
                    <tr>
                      {previewHeaders.map((h, i) => (
                        <th key={i} className="px-3 py-1.5 border-b border-[#2e2552] whitespace-nowrap font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#221c40] text-slate-300">
                    {previewRecords.map((r, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-[#1b1733]">
                        {previewHeaders.map((h, colIdx) => (
                          <td key={colIdx} className="px-3 py-1.5 whitespace-nowrap">
                            {String(r[h] ?? r[Object.keys(r)[colIdx]] ?? '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 4: Google Workspace Sign-In Banner */}
          <div className="p-3 rounded-xl bg-[#141126] border border-[#262045] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-slate-300">
                {user ? `เข้าสู่ระบบในชื่อ: ${user.email}` : 'Google Workspace: พร้อมเชื่อมต่อ'}
              </span>
            </div>
            {!user ? (
              <button
                onClick={onSignIn}
                className="px-3 py-1 rounded bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/40 text-[11px] font-medium transition cursor-pointer"
              >
                เข้าสู่ระบบด้วย Google
              </button>
            ) : (
              <button
                onClick={onSignOut}
                className="text-slate-400 hover:text-rose-400 text-[11px] underline cursor-pointer"
              >
                ออกจากระบบ
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#2d244f] bg-[#141126] flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#201a3b] hover:bg-[#2b224e] text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>

          <div className="flex items-center gap-2">
            {onOpenDataEditor && (previewRecords.length > 0 || allFetchedRecords.length > 0) && (
              <button
                type="button"
                onClick={() => handleApplyToDashboard(true)}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Table className="w-3.5 h-3.5 text-emerald-400" />
                <span>นำเข้าและเปิดแก้ไขชุดข้อมูล</span>
              </button>
            )}

            <button
              id="btn-apply-sheet-import"
              onClick={() => handleApplyToDashboard(false)}
              disabled={isLoading}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-violet-900/40 transition cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>นำเข้าข้อมูลเข้าแดชบอร์ด</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
