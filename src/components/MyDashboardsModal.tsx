import React, { useState, useEffect } from 'react';
import {
  X,
  LayoutDashboard,
  Plus,
  FolderOpen,
  Trash2,
  Copy,
  Clock,
  Layers,
  Calendar,
  Sparkles,
  Check,
  Save,
  Download,
  FileSpreadsheet,
  Palette,
  ShoppingBag,
  BarChart2,
  TrendingUp,
} from 'lucide-react';
import { SavedDashboard, VisualWidget, SalesRecord, ThemePreset } from '../types';

interface MyDashboardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDashboardTitle: string;
  currentWidgets: VisualWidget[];
  currentSalesData: SalesRecord[];
  currentThemePreset: ThemePreset;
  onLoadDashboard: (dashboard: SavedDashboard) => void;
  onSaveCurrentDashboard: (title: string, description?: string) => void;
}

const STORAGE_KEY = 'vista_saved_dashboards_v2';

export const MyDashboardsModal: React.FC<MyDashboardsModalProps> = ({
  isOpen,
  onClose,
  currentDashboardTitle,
  currentWidgets,
  currentSalesData,
  currentThemePreset,
  onLoadDashboard,
  onSaveCurrentDashboard,
}) => {
  const [dashboards, setDashboards] = useState<SavedDashboard[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [activeTab, setActiveTab] = useState<'saved' | 'save_current' | 'marketplace'>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Initial demo dashboards if storage is empty
  const defaultDashboards: SavedDashboard[] = [
    {
      id: 'dash-kpi-exec',
      title: 'ภาพรวมยอดขาย & KPI ผู้บริหาร',
      updatedAt: '15:30 วันนี้',
      widgets: currentWidgets,
      salesData: currentSalesData,
      themePreset: 'violet',
      description: 'แดชบอร์ดมาตรฐาน แสดง KPI รวม ยอดขายรายหมวดหมู่ และสัดส่วนภูมิภาค',
      recordCount: currentSalesData.length,
    },
    {
      id: 'dash-region-prod',
      title: 'วิเคราะห์ยอดขายแยกตามภูมิภาคและสินค้า',
      updatedAt: 'เมื่อวาน 18:45',
      widgets: [
        {
          id: 'w-reg-bar',
          title: 'ยอดขายและกำไรแยกตามภูมิภาค',
          type: 'bar',
          x: 0,
          y: 0,
          w: 8,
          h: 5,
          metric: 'revenue',
          dimension: 'region',
          aggregation: 'sum',
          showLegend: true,
        },
        {
          id: 'w-kpi-orders',
          title: 'จำนวนรายการคำสั่งซื้อทั้งหมด',
          type: 'kpi',
          x: 8,
          y: 0,
          w: 4,
          h: 2,
          metric: 'revenue',
          aggregation: 'count',
          prefix: '★',
        },
        {
          id: 'w-kpi-distinct',
          title: 'จำนวนสินค้าที่ไม่ซ้ำ (Unique Products)',
          type: 'kpi',
          x: 8,
          y: 2,
          w: 4,
          h: 3,
          metric: 'product',
          aggregation: 'count_distinct',
          suffix: 'รายการ',
        },
      ],
      salesData: currentSalesData,
      themePreset: 'midnight',
      description: 'วิเคราะห์เจาะลึกเฉพาะภูมิภาค ยอดสั่งซื้อ และความหลากหลายสินค้า',
      recordCount: currentSalesData.length,
    },
    {
      id: 'dash-channel-profit',
      title: 'รายงานผลกำไรและสัดส่วนช่องทางจำหน่าย',
      updatedAt: '3 วันที่แล้ว',
      widgets: [
        {
          id: 'w-pie-cat',
          title: 'สัดส่วนยอดขายตามหมวดหมู่',
          type: 'pie',
          x: 0,
          y: 0,
          w: 6,
          h: 5,
          metric: 'revenue',
          dimension: 'category',
          aggregation: 'sum',
          showLegend: true,
        },
        {
          id: 'w-col-profit',
          title: 'กำไรสุทธิขั้นต้นรายสินค้า',
          type: 'column',
          x: 6,
          y: 0,
          w: 6,
          h: 5,
          metric: 'profit',
          dimension: 'category',
          aggregation: 'sum',
        },
      ],
      salesData: currentSalesData,
      themePreset: 'ocean',
      description: 'วิเคราะห์ส่วนแบ่งการตลาดและมาร์จิ้นกำไรเพื่อวางแผนโปรโมชัน',
      recordCount: currentSalesData.length,
    },
  ];

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDashboards(parsed);
          return;
        }
      }
      setDashboards(defaultDashboards);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDashboards));
    } catch {
      setDashboards(defaultDashboards);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveToStorage = (updatedList: SavedDashboard[]) => {
    setDashboards(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  };

  const handleSaveCurrent = () => {
    const titleToUse = newTitle.trim() || currentDashboardTitle || 'แดชบอร์ดของฉัน (บันทึกใหม่)';
    const newDash: SavedDashboard = {
      id: `dash-${Date.now()}`,
      title: titleToUse,
      updatedAt: `เพิ่งบันทึก (${new Date().toLocaleTimeString('th-TH')})`,
      widgets: currentWidgets,
      salesData: currentSalesData,
      themePreset: currentThemePreset,
      description: newDesc.trim() || 'บันทึกจากผืนงานออกแบบปัจจุบัน',
      recordCount: currentSalesData.length,
    };

    const updated = [newDash, ...dashboards];
    saveToStorage(updated);
    onSaveCurrentDashboard(titleToUse, newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setSaveSuccessMsg('บันทึกแดชบอร์ดเรียบร้อยแล้ว!');
    setActiveTab('saved');
    setTimeout(() => setSaveSuccessMsg(''), 2500);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('คุณต้องการลบแดชบอร์ดนี้ใช่หรือไม่?')) {
      const filtered = dashboards.filter((d) => d.id !== id);
      saveToStorage(filtered);
    }
  };

  const handleDuplicate = (dash: SavedDashboard, e: React.MouseEvent) => {
    e.stopPropagation();
    const dup: SavedDashboard = {
      ...dash,
      id: `dash-${Date.now()}`,
      title: `${dash.title} (สำเนา)`,
      updatedAt: `ทำสำเนาเมื่อ ${new Date().toLocaleTimeString('th-TH')}`,
    };
    saveToStorage([dup, ...dashboards]);
  };

  const filteredDashboards = dashboards.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div
      id="modal-my-dashboards"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#18152e] border border-[#342b5c] rounded-2xl shadow-2xl text-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2d254e] flex items-center justify-between bg-[#151227]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/30 text-violet-300 flex items-center justify-center border border-violet-500/40">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">แดชบอร์ดของฉัน</h2>
              <p className="text-xs text-slate-400">
                รวบรวมและจัดการแดชบอร์ดที่คุณบันทึกไว้ สลับเปิดใช้งานได้ทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#282147] text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center justify-between px-6 border-b border-[#2d254e] bg-[#141126] text-xs">
          <div className="flex gap-4">
            <button
              id="tab-saved-dashboards"
              onClick={() => setActiveTab('saved')}
              className={`py-2.5 font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'saved'
                  ? 'border-violet-400 text-violet-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>แดชบอร์ดที่บันทึกไว้ ({dashboards.length})</span>
            </button>
            <button
              id="tab-save-current"
              onClick={() => setActiveTab('save_current')}
              className={`py-2.5 font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'save_current'
                  ? 'border-violet-400 text-violet-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกแดชบอร์ดปัจจุบัน</span>
            </button>
            <button
              id="tab-marketplace"
              onClick={() => setActiveTab('marketplace')}
              className={`py-2.5 font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'marketplace'
                  ? 'border-violet-400 text-violet-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span>คลังเทมเพลต (Template Marketplace)</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">ใหม่</span>
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="text-emerald-400 flex items-center gap-1 text-[11px] font-semibold animate-pulse">
              <Check className="w-3.5 h-3.5" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'marketplace' ? (
            /* Template Marketplace Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <span>คลังเทมเพลตมาตรฐาน (Dashboard Marketplace)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    เลือกเทมเพลตพร้อมใช้งานที่ปรับแต่งสัดส่วน กราฟ และฟิลด์คำนวณมาเรียบร้อยแล้ว
                  </p>
                </div>
                <div className="text-[11px] text-violet-300 bg-violet-950/60 border border-violet-800/40 px-2.5 py-1 rounded-full">
                  มี 4 เทมเพลตระดับโปร
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {[
                  {
                    id: 'tpl-exec-cockpit',
                    title: 'ภาพรวมผู้บริหารระดับสูง (C-Level Executive Cockpit)',
                    badge: 'ยอดนิยม ★',
                    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                    desc: 'รวม 4 KPI สำคัญ (รายได้, กำไร, บิล, สินค้า) พร้อมกราฟเจาะลึก 3 ระดับ (ภูมิภาค ➔ หมวดหมู่ ➔ สินค้า)',
                    themePreset: 'violet' as ThemePreset,
                    widgetsCount: 6,
                    widgets: [
                      {
                        id: `kpi-rev-${Date.now()}-1`,
                        title: 'ยอดขายรวมทั้งสิ้น (Total Revenue)',
                        type: 'kpi' as const,
                        x: 0,
                        y: 0,
                        w: 3,
                        h: 2,
                        metric: 'revenue',
                        aggregation: 'sum' as const,
                        prefix: '฿',
                        showTrend: true,
                        color: '#8b5cf6',
                      },
                      {
                        id: `kpi-profit-${Date.now()}-2`,
                        title: 'กำไรสุทธิรวม (Total Profit)',
                        type: 'kpi' as const,
                        x: 3,
                        y: 0,
                        w: 3,
                        h: 2,
                        metric: 'profit',
                        aggregation: 'sum' as const,
                        prefix: '฿',
                        showTrend: true,
                        color: '#10b981',
                      },
                      {
                        id: `kpi-orders-${Date.now()}-3`,
                        title: 'จำนวนออเดอร์ทั้งหมด (Total Orders)',
                        type: 'kpi' as const,
                        x: 6,
                        y: 0,
                        w: 3,
                        h: 2,
                        metric: 'revenue',
                        aggregation: 'count' as const,
                        suffix: 'บิล',
                        showTrend: true,
                      },
                      {
                        id: `kpi-unique-${Date.now()}-4`,
                        title: 'สินค้าที่ขายได้ (Active SKUs)',
                        type: 'kpi' as const,
                        x: 9,
                        y: 0,
                        w: 3,
                        h: 2,
                        metric: 'product',
                        aggregation: 'count_distinct' as const,
                        suffix: 'รายการ',
                      },
                      {
                        id: `chart-drill-${Date.now()}-5`,
                        title: 'ยอดขายเจาะลึก (Drill Down: ภูมิภาค ➔ หมวดหมู่ ➔ สินค้า)',
                        type: 'bar' as const,
                        x: 0,
                        y: 2,
                        w: 8,
                        h: 5,
                        metric: 'revenue',
                        dimension: 'region',
                        aggregation: 'sum' as const,
                        drillDownEnabled: true,
                        drillLevels: ['region', 'category', 'product'],
                        currentDrillLevel: 0,
                        drillFilters: [],
                        showLegend: true,
                        showDataLabels: true,
                      },
                      {
                        id: `chart-pie-${Date.now()}-6`,
                        title: 'สัดส่วนยอดขายตามหมวดหมู่',
                        type: 'pie' as const,
                        x: 8,
                        y: 2,
                        w: 4,
                        h: 5,
                        metric: 'revenue',
                        dimension: 'category',
                        aggregation: 'sum' as const,
                        showLegend: true,
                      },
                    ],
                  },
                  {
                    id: 'tpl-sales-branch',
                    title: 'วิเคราะห์ทีมขาย & ประสิทธิภาพสาขา (Branch Matrix)',
                    badge: 'สำหรับฝ่ายขาย',
                    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
                    desc: 'เปรียบเทียบยอดขายรายภูมิภาค พร้อมวิเคราะห์กำไรเฉลี่ย และตารางรายละเอียดสินค้าเจาะลึก',
                    themePreset: 'ocean' as ThemePreset,
                    widgetsCount: 4,
                    widgets: [
                      {
                        id: `kpi-aov-${Date.now()}-1`,
                        title: 'ยอดขายเฉลี่ยต่อคำสั่งซื้อ (AOV)',
                        type: 'kpi' as const,
                        x: 0,
                        y: 0,
                        w: 6,
                        h: 2,
                        metric: 'revenue',
                        aggregation: 'avg' as const,
                        prefix: '฿',
                        showTrend: true,
                      },
                      {
                        id: `kpi-qty-${Date.now()}-2`,
                        title: 'จำนวนชิ้นที่จำหน่ายรวม',
                        type: 'kpi' as const,
                        x: 6,
                        y: 0,
                        w: 6,
                        h: 2,
                        metric: 'quantity',
                        aggregation: 'sum' as const,
                        suffix: 'ชิ้น',
                      },
                      {
                        id: `chart-col-${Date.now()}-3`,
                        title: 'ยอดขายแยกตามภูมิภาค (Drill Down ได้)',
                        type: 'column' as const,
                        x: 0,
                        y: 2,
                        w: 6,
                        h: 5,
                        metric: 'revenue',
                        dimension: 'region',
                        aggregation: 'sum' as const,
                        drillDownEnabled: true,
                        drillLevels: ['region', 'category'],
                        showDataLabels: true,
                      },
                      {
                        id: `chart-tbl-${Date.now()}-4`,
                        title: 'ตารางข้อมูลรายการสั่งซื้อ',
                        type: 'table' as const,
                        x: 6,
                        y: 2,
                        w: 6,
                        h: 5,
                        metric: 'revenue',
                        dimension: 'product',
                      },
                    ],
                  },
                  {
                    id: 'tpl-finance-margins',
                    title: 'การเงิน & มาร์จิ้นกำไร (Financial Profitability)',
                    badge: 'การเงิน & งบประมาณ',
                    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                    desc: 'ติดตามรายรับ ต้นทุน และกำไรสุทธิ พร้อมฟอร์แมตสีเขียว/แดงเตือนเมื่อต่ำกว่าเป้าหมาย',
                    themePreset: 'midnight' as ThemePreset,
                    widgetsCount: 4,
                    widgets: [
                      {
                        id: `kpi-f-rev-${Date.now()}-1`,
                        title: 'รายรับรวม (Gross Revenue)',
                        type: 'kpi' as const,
                        x: 0,
                        y: 0,
                        w: 4,
                        h: 2,
                        metric: 'revenue',
                        aggregation: 'sum' as const,
                        prefix: '฿',
                      },
                      {
                        id: `kpi-f-cost-${Date.now()}-2`,
                        title: 'ต้นทุนรวม (Total Cost)',
                        type: 'kpi' as const,
                        x: 4,
                        y: 0,
                        w: 4,
                        h: 2,
                        metric: 'cost',
                        aggregation: 'sum' as const,
                        prefix: '฿',
                        color: '#f43f5e',
                      },
                      {
                        id: `kpi-f-profit-${Date.now()}-3`,
                        title: 'กำไรขั้นต้น (Gross Profit)',
                        type: 'kpi' as const,
                        x: 8,
                        y: 0,
                        w: 4,
                        h: 2,
                        metric: 'profit',
                        aggregation: 'sum' as const,
                        prefix: '฿',
                        color: '#10b981',
                        conditionalRules: [
                          { id: 'cr-1', operator: 'greater' as const, value: 200000, color: '#10b981', label: 'ดี' },
                          { id: 'cr-2', operator: 'less' as const, value: 100000, color: '#ef4444', label: 'เตือน' },
                        ],
                      },
                      {
                        id: `chart-area-${Date.now()}-4`,
                        title: 'แนวโน้มกำไรสะสมรายหมวดหมู่',
                        type: 'area' as const,
                        x: 0,
                        y: 2,
                        w: 12,
                        h: 5,
                        metric: 'profit',
                        dimension: 'category',
                        aggregation: 'sum' as const,
                        showGrid: true,
                      },
                    ],
                  },
                  {
                    id: 'tpl-ecom-omni',
                    title: 'อีคอมเมิร์ซ & ดิจิทัล (Omnichannel Digital Marketing)',
                    badge: 'การตลาดออนไลน์',
                    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                    desc: 'วิเคราะห์ยอดขายช่องทางออนไลน์ เทียบกับหน้าร้าน พร้อมการกระจายตัวของสินค้า',
                    themePreset: 'sunset' as ThemePreset,
                    widgetsCount: 4,
                    widgets: [
                      {
                        id: `kpi-e-ord-${Date.now()}-1`,
                        title: 'คำสั่งซื้อผ่านระบบ',
                        type: 'kpi' as const,
                        x: 0,
                        y: 0,
                        w: 6,
                        h: 2,
                        metric: 'revenue',
                        aggregation: 'count' as const,
                        suffix: 'ออเดอร์',
                      },
                      {
                        id: `kpi-e-rev-${Date.now()}-2`,
                        title: 'ยอดขายออนไลน์รวม',
                        type: 'kpi' as const,
                        x: 6,
                        y: 0,
                        w: 6,
                        h: 2,
                        metric: 'revenue',
                        aggregation: 'sum' as const,
                        prefix: '฿',
                      },
                      {
                        id: `chart-e-pie-${Date.now()}-3`,
                        title: 'สัดส่วนยอดขายตามหมวดหมู่',
                        type: 'pie' as const,
                        x: 0,
                        y: 2,
                        w: 6,
                        h: 5,
                        metric: 'revenue',
                        dimension: 'category',
                        aggregation: 'sum' as const,
                      },
                      {
                        id: `chart-e-bar-${Date.now()}-4`,
                        title: 'ยอดขายแยกตามภูมิภาค',
                        type: 'bar' as const,
                        x: 6,
                        y: 2,
                        w: 6,
                        h: 5,
                        metric: 'revenue',
                        dimension: 'region',
                        aggregation: 'sum' as const,
                      },
                    ],
                  },
                ].map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-xl bg-[#1e1838] border border-[#352b5e] hover:border-violet-400 transition flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`text-[10px] border px-2 py-0.5 rounded-full font-semibold ${tpl.badgeColor}`}>
                          {tpl.badge}
                        </span>
                        <span className="text-[10px] bg-violet-950 text-violet-300 border border-violet-800/40 px-2 py-0.5 rounded capitalize">
                          ธีม {tpl.themePreset}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white group-hover:text-violet-300 transition mb-1">
                        {tpl.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {tpl.desc}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#2b224e] flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-violet-400" />
                        <span>{tpl.widgetsCount} วิชวลสำเร็จรูป</span>
                      </span>

                      <button
                        onClick={() => {
                          onLoadDashboard({
                            id: `tpl-${Date.now()}`,
                            title: tpl.title,
                            updatedAt: 'เทมเพลตนำเข้าใหม่',
                            widgets: tpl.widgets,
                            salesData: currentSalesData,
                            themePreset: tpl.themePreset,
                            description: tpl.desc,
                            recordCount: currentSalesData.length,
                          });
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>ใช้เทมเพลตนี้</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'save_current' ? (
            /* Save current dashboard view */
            <div className="space-y-4 max-w-lg mx-auto py-2">
              <div className="p-4 rounded-xl bg-[#20193b] border border-[#342a61] space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold text-white">ข้อมูลที่จะบันทึก:</span>
                  <span className="text-violet-300">{currentWidgets.length} วิชวล | {currentSalesData.length} แถว</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ชื่อแดชบอร์ด <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="input-save-dashboard-title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={currentDashboardTitle || 'ตั้งชื่อแดชบอร์ด...'}
                    className="w-full px-3 py-2 rounded-lg bg-[#141026] border border-[#352c5c] text-white text-xs outline-none focus:border-violet-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    คำอธิบายเพิ่มเติม (ระบุวัตถุประสงค์ หรือกลุ่มผู้ใช้)
                  </label>
                  <textarea
                    rows={2}
                    id="input-save-dashboard-desc"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="เช่น แดชบอร์ดสรุปผลรายสัปดาห์สำหรับทีมขาย..."
                    className="w-full px-3 py-2 rounded-lg bg-[#141026] border border-[#352c5c] text-white text-xs outline-none focus:border-violet-400 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-violet-400" />
                    <span>ธีมปัจจุบัน: <span className="text-white capitalize">{currentThemePreset}</span></span>
                  </div>
                  <button
                    id="btn-confirm-save-dashboard"
                    onClick={handleSaveCurrent}
                    className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกลงแดชบอร์ดของฉัน</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Saved dashboards list */
            <>
              {/* Search Bar */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาแดชบอร์ดที่บันทึกไว้..."
                  className="flex-1 px-3 py-2 rounded-lg bg-[#141026] border border-[#352c5c] text-white text-xs outline-none focus:border-violet-400"
                />
                <button
                  onClick={() => setActiveTab('save_current')}
                  className="px-3 py-2 rounded-lg bg-[#251f47] hover:bg-[#30275c] border border-[#3c3169] text-violet-300 font-medium text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>บันทึกผืนงานนี้</span>
                </button>
              </div>

              {/* Grid of Dashboards */}
              {filteredDashboards.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-xs">ไม่พบแดชบอร์ดที่ค้นหา</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {filteredDashboards.map((dash) => (
                    <div
                      key={dash.id}
                      onClick={() => {
                        onLoadDashboard(dash);
                        onClose();
                      }}
                      className="p-3.5 rounded-xl bg-[#1e1838] hover:bg-[#251f45] border border-[#352b5e] hover:border-violet-400/60 transition cursor-pointer flex flex-col justify-between group shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xs font-bold text-white group-hover:text-violet-300 transition line-clamp-1">
                            {dash.title}
                          </h3>
                          <span className="text-[10px] bg-violet-950/80 text-violet-300 border border-violet-800/40 px-1.5 py-0.5 rounded capitalize shrink-0">
                            {dash.themePreset || 'violet'}
                          </span>
                        </div>

                        {dash.description && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {dash.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#2b224e] flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-violet-400" />
                            <span>{dash.widgets?.length || 0} วิชวล</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{dash.updatedAt}</span>
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleDuplicate(dash, e)}
                            title="ทำสำเนา"
                            className="p-1 rounded hover:bg-[#342a5c] text-slate-400 hover:text-white transition"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(dash.id, e)}
                            title="ลบ"
                            className="p-1 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#2d254e] bg-[#151227] flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-400">
            ระบบจัดเก็บบันทึกบนเครื่องของคุณอัตโนมัติ (Persistent Local Storage)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#272147] hover:bg-[#332a5e] text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
