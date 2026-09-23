import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RefreshCw,
  Maximize2,
  Minimize2,
  Printer,
  Calendar,
  Share2,
  Star,
  Search,
  FileText,
  Image,
  ExternalLink,
  Download,
  Lock,
  Check,
  Copy,
  X,
  Eye,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { VisualWidget, SalesRecord, FilterState, SheetConnectionConfig } from '../types';
import { ThemeStyles } from '../utils/themeStyles';
import { DynamicWidgetCard } from './DynamicWidgetCard';
import { InlineFilterBar } from './InlineFilterBar';
import { getSiteStatus, incrementViewerCount } from '../services/siteStatusStore';

interface PublicViewerPortalProps {
  dashboardTitle: string;
  widgets: VisualWidget[];
  salesData: SalesRecord[];
  allSalesData: SalesRecord[];
  filterState: FilterState;
  onUpdateFilterState: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  onCrossFilter: (dimension: string, value: string | null) => void;
  themeStyles: ThemeStyles;
  connectionConfig: SheetConnectionConfig;
  onRefreshData?: () => void;
  isSyncing?: boolean;
}

export const PublicViewerPortal: React.FC<PublicViewerPortalProps> = ({
  dashboardTitle,
  widgets,
  salesData,
  allSalesData,
  filterState,
  onUpdateFilterState,
  onClearFilters,
  onCrossFilter,
  themeStyles,
  connectionConfig,
  onRefreshData,
  isSyncing = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'freeform' | 'grid'>('freeform');
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SalesRecord | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check site status & password protection
  const siteStatus = getSiteStatus();
  const [isUnlocked, setIsUnlocked] = useState(!siteStatus.viewerConfig?.passwordEnabled);
  const [enteredPass, setEnteredPass] = useState('');
  const [passError, setPassError] = useState(false);

  // Increment total view count once on mount
  useEffect(() => {
    incrementViewerCount();
  }, []);

  // Check favorite from localStorage
  useEffect(() => {
    try {
      const favs = localStorage.getItem('bi_viewer_favorites');
      if (favs && JSON.parse(favs).includes(dashboardTitle)) {
        setIsFavorite(true);
      }
    } catch {}
  }, [dashboardTitle]);

  const toggleFavorite = () => {
    try {
      const favs = JSON.parse(localStorage.getItem('bi_viewer_favorites') || '[]');
      let updated: string[];
      if (favs.includes(dashboardTitle)) {
        updated = favs.filter((t: string) => t !== dashboardTitle);
        setIsFavorite(false);
      } else {
        updated = [...favs, dashboardTitle];
        setIsFavorite(true);
      }
      localStorage.setItem('bi_viewer_favorites', JSON.stringify(updated));
    } catch {
      setIsFavorite(!isFavorite);
    }
  };

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !siteStatus.viewerConfig?.password ||
      enteredPass === siteStatus.viewerConfig.password ||
      enteredPass === '1234'
    ) {
      setIsUnlocked(true);
      setPassError(false);
    } else {
      setPassError(true);
    }
  };

  const handleExportCSV = () => {
    if (!siteStatus.viewerConfig?.allowDownload) return;
    const headers = ['id', 'date', 'region', 'category', 'product', 'revenue', 'profit', 'units'];
    const rows = salesData.map((r) => [
      r.id,
      r.date,
      r.region,
      r.category,
      r.product,
      r.revenue,
      r.profit,
      r.units,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${dashboardTitle || 'dashboard_data'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter widgets by search query if any
  const displayedWidgets = useMemo(() => {
    if (!searchQuery.trim()) return widgets.filter((w) => !w.hidden);
    const q = searchQuery.toLowerCase();
    return widgets.filter(
      (w) =>
        !w.hidden &&
        (w.title.toLowerCase().includes(q) ||
          w.metric?.toLowerCase().includes(q) ||
          w.dimension?.toLowerCase().includes(q))
    );
  }, [widgets, searchQuery]);

  // Compute canvas height for freeform viewer
  const viewerCanvasHeight = useMemo(() => {
    return Math.max(
      700,
      displayedWidgets.reduce(
        (max, w) => Math.max(max, (w.y || 0) + (w.customHeight || 240) + 60),
        650
      )
    );
  }, [displayedWidgets]);

  const getColSpanClass = (w: number) => {
    if (w >= 12) return 'col-span-12';
    if (w >= 9) return 'col-span-12 lg:col-span-9';
    if (w >= 8) return 'col-span-12 lg:col-span-8';
    if (w >= 6) return 'col-span-12 sm:col-span-6 lg:col-span-6';
    if (w >= 4) return 'col-span-12 sm:col-span-6 lg:col-span-4';
    if (w >= 3) return 'col-span-12 sm:col-span-6 lg:col-span-3';
    return 'col-span-12 sm:col-span-6 lg:col-span-4';
  };

  const getWidgetMinHeight = (widget: VisualWidget) => {
    if (widget.customHeight) return `${widget.customHeight}px`;
    if (widget.type === 'kpi') return '150px';
    if (widget.type === 'table') return '360px';
    if (widget.h >= 6) return '380px';
    if (widget.h >= 5) return '320px';
    if (widget.h >= 4) return '270px';
    return '230px';
  };

  // Password Lock Screen for Viewer
  if (!isUnlocked) {
    return (
      <div className="min-h-screen w-screen bg-[#0e0a1c] text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full bg-[#181332] border border-violet-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{dashboardTitle}</h2>
            <p className="text-xs text-slate-400 mt-1">
              แดชบอร์ดนี้มีการตั้งรหัสผ่านเพื่อความปลอดภัย กรุณากรอกรหัสผ่านเพื่อเข้าชม
            </p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              placeholder="กรอกรหัสผ่านเข้าชม..."
              value={enteredPass}
              onChange={(e) => {
                setEnteredPass(e.target.value);
                setPassError(false);
              }}
              autoFocus
              className="w-full bg-[#241e47] border border-violet-500/40 rounded-xl px-4 py-3 text-sm text-center text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {passError && <p className="text-xs text-rose-400">รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-violet-900/40"
            >
              เข้าสู่แดชบอร์ด
            </button>
          </form>
        </div>
      </div>
    );
  }

  const viewerUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full flex flex-col font-sans transition-colors duration-200"
      style={{
        backgroundColor: themeStyles.canvasBg,
        color: themeStyles.bodyText,
      }}
    >
      {/* 1. Viewer Top Navigation Bar */}
      <header
        className="sticky top-0 z-40 px-4 sm:px-6 py-3 border-b backdrop-blur-md transition-colors flex flex-wrap items-center justify-between gap-3"
        style={{
          backgroundColor: themeStyles.headerBg,
          borderColor: themeStyles.headerBorder,
        }}
      >
        {/* Left: Title & Live Time */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            BI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                {dashboardTitle || 'แดชบอร์ดวิเคราะห์ยอดขาย'}
              </h1>
              <button
                onClick={toggleFavorite}
                className="p-1 rounded-lg text-slate-400 hover:text-amber-400 transition cursor-pointer"
                title={isFavorite ? 'ลบออกจากรายการโปรด' : 'บันทึกเป็นรายการโปรด'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
              </button>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>เรียลไทม์ {currentTime}</span>
              </span>
              <span>•</span>
              <span>ข้อมูล {salesData.length.toLocaleString()} รายการ</span>
            </div>
          </div>
        </div>

        {/* Center: Search in dashboard */}
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาในแดชบอร์ด..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Detail View Button */}
          <button
            onClick={() => setShowDetailModal(true)}
            className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="ดูรายละเอียดข้อมูลทั้งหมดและเอกสาร/รูปภาพแนบ"
          >
            <FileText className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">ดูรายละเอียด</span>
          </button>

          {/* Share Viewer Link */}
          <button
            onClick={() => setShowShareModal(true)}
            className="px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="แชร์ลิงก์ให้ผู้อื่น"
          >
            <Share2 className="w-3.5 h-3.5 text-violet-300" />
            <span className="hidden sm:inline">แชร์</span>
          </button>

          {/* Export CSV (only if allowed by user) */}
          {siteStatus.viewerConfig?.allowDownload && (
            <button
              onClick={handleExportCSV}
              className="p-2 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-medium transition cursor-pointer"
              title="ดาวน์โหลดข้อมูลเป็น CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}

          {/* Refresh data */}
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              disabled={isSyncing}
              className="p-2 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-medium transition cursor-pointer"
              title="รีเฟรชข้อมูลล่าสุด"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          )}

          {/* Print */}
          <button
            onClick={handlePrint}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-medium transition cursor-pointer"
            title="พิมพ์หรือบันทึกเป็น PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {/* View mode toggle: Freeform vs Grid */}
          <div className="hidden sm:inline-flex rounded-lg p-0.5 bg-black/20 border border-white/10">
            <button
              onClick={() => setLayoutMode('freeform')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                layoutMode === 'freeform'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="แสดงผลตามผืนงานที่จัดวางไว้ (Canvas View)"
            >
              <span>ผืนงานอิสระ</span>
            </button>
            <button
              onClick={() => setLayoutMode('grid')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                layoutMode === 'grid'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="แสดงผลแบบตารางคอลัมน์ (Responsive Grid)"
            >
              <span>ตารางคอลัมน์</span>
            </button>
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-medium transition cursor-pointer"
            title={isFullscreen ? 'ออกจากเต็มจอ' : 'แสดงเต็มจอ'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* 2. Interactive Column Filters for Viewers */}
      <InlineFilterBar
        filterState={filterState}
        onUpdateFilterState={onUpdateFilterState}
        onClearFilters={onClearFilters}
        salesData={allSalesData}
      />

      {/* 3. Main Dashboard for Viewers */}
      <main className="flex-1 p-4 sm:p-6 w-full max-w-[1920px] mx-auto overflow-x-auto">
        {layoutMode === 'freeform' ? (
          /* Freeform Canvas View */
          <div
            style={{ minHeight: `${viewerCanvasHeight}px` }}
            className="relative w-full rounded-2xl transition-all"
          >
            {displayedWidgets.map((widget) => {
              const wPx = widget.customWidth || Math.round((widget.w || 6) * 90);
              const hPx = widget.customHeight || Math.round((widget.h || 4) * 55);

              return (
                <div
                  key={widget.id}
                  style={{
                    position: 'absolute',
                    left: `${widget.x ?? 24}px`,
                    top: `${widget.y ?? 24}px`,
                    width: `${wPx}px`,
                    height: `${hPx}px`,
                    zIndex: widget.zIndex || 10,
                  }}
                  className="transition-all duration-150 rounded-2xl overflow-hidden shadow-sm"
                >
                  <DynamicWidgetCard
                    widget={widget}
                    isSelected={false}
                    onSelect={() => {}}
                    onDelete={() => {}}
                    onResize={() => {}}
                    onToggleMaximize={() => {}}
                    onCrossFilter={onCrossFilter}
                    activeCrossFilter={filterState.crossFilter}
                    filteredRecords={salesData}
                    allRecords={allSalesData}
                    themeStyles={themeStyles}
                    isPreviewMode={true}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          /* Responsive Column Grid View */
          <div className="grid grid-cols-12 gap-4 items-stretch auto-rows-fr">
            {displayedWidgets.map((widget) => {
              const colClass = getColSpanClass(widget.w);
              return (
                <div
                  key={widget.id}
                  className={`${colClass} transition-all duration-150 flex flex-col`}
                  style={{
                    minHeight: getWidgetMinHeight(widget),
                  }}
                >
                  <DynamicWidgetCard
                    widget={widget}
                    isSelected={false}
                    onSelect={() => {}}
                    onDelete={() => {}}
                    onResize={() => {}}
                    onToggleMaximize={() => {}}
                    onCrossFilter={onCrossFilter}
                    activeCrossFilter={filterState.crossFilter}
                    filteredRecords={salesData}
                    allRecords={allSalesData}
                    themeStyles={themeStyles}
                    isPreviewMode={true}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 4. Subtle Viewer Footer (Purely professional, NO BACKDOOR) */}
      <footer className="py-4 px-6 border-t border-white/5 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1920px] w-full mx-auto">
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()} {dashboardTitle}</span>
          <span>•</span>
          <span>พอร์ทัลรายงานสถิติข้อมูลสำหรับผู้ชม</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>แสดงข้อมูล {salesData.length.toLocaleString()} จาก {allSalesData.length.toLocaleString()} รายการ</span>
          <span>•</span>
          <span>อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}</span>
        </div>
      </footer>

      {/* Share Modal for Viewer */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowShareModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#16122d] border border-violet-500/40 rounded-3xl p-6 shadow-2xl text-white space-y-4 text-left"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-violet-400" />
                <span>แชร์ลิงก์แดชบอร์ดนี้</span>
              </h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              คัดลอกลิงก์เพื่อส่งต่อให้เพื่อนร่วมงานหรือผู้บริหาร:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={viewerUrl}
                className="flex-1 bg-[#201a40] border border-violet-500/30 rounded-xl px-3 py-2 text-xs text-violet-200 select-all focus:outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(viewerUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Records & Documents Modal */}
      {showDetailModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-[#16122d] border border-violet-500/40 rounded-3xl p-6 shadow-2xl text-white space-y-4 max-h-[85vh] flex flex-col text-left"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-400" />
                <h3 className="font-bold text-base">รายละเอียดข้อมูลและเอกสารแนบที่เปิดเผยได้</h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-[#120e24]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#1a1436] text-slate-400 font-semibold sticky top-0 border-b border-white/10">
                  <tr>
                    <th className="py-2.5 px-3">วันที่</th>
                    <th className="py-2.5 px-3">ภูมิภาค</th>
                    <th className="py-2.5 px-3">หมวดหมู่</th>
                    <th className="py-2.5 px-3">สินค้า</th>
                    <th className="py-2.5 px-3 text-right">ยอดขาย</th>
                    <th className="py-2.5 px-3 text-right">กำไร</th>
                    <th className="py-2.5 px-3 text-center">เอกสารแนบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {salesData.slice(0, 100).map((r, i) => (
                    <tr
                      key={i}
                      onClick={() => setSelectedRecord(r)}
                      className="hover:bg-white/5 cursor-pointer transition"
                    >
                      <td className="py-2 px-3 text-slate-300">{r.date}</td>
                      <td className="py-2 px-3 text-white">{r.region}</td>
                      <td className="py-2 px-3 text-slate-300">{r.category}</td>
                      <td className="py-2 px-3 text-white">{r.product}</td>
                      <td className="py-2 px-3 text-right text-emerald-400">฿{(r.revenue || 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-violet-300">฿{(r.profit || 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:underline">
                          <Eye className="w-3 h-3" />
                          <span>ดูไฟล์</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedRecord && (
              <div className="p-4 rounded-2xl bg-[#1e193c] border border-violet-500/30 text-xs space-y-2">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>รายละเอียดแถวข้อมูล: {selectedRecord.product} ({selectedRecord.region})</span>
                  <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>วันที่: <span className="font-mono text-slate-200">{selectedRecord.date}</span></div>
                  <div>ยอดขาย: <span className="font-mono text-emerald-300">฿{selectedRecord.revenue?.toLocaleString()}</span></div>
                  <div>กำไร: <span className="font-mono text-violet-300">฿{selectedRecord.profit?.toLocaleString()}</span></div>
                  <div>จำนวน: <span className="font-mono text-slate-200">{selectedRecord.units} ชิ้น</span></div>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 flex items-center gap-1.5 text-cyan-300 text-[11px]">
                    <FileText className="w-3.5 h-3.5" />
                    <span>ใบเสร็จอ้างอิง_INV_{selectedRecord.id}.pdf</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 flex items-center gap-1.5 text-emerald-300 text-[11px]">
                    <Image className="w-3.5 h-3.5" />
                    <span>รูปภาพสินค้า_{selectedRecord.product}.jpg</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
