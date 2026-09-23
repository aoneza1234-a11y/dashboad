import React, { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Files,
  ClipboardPaste,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  BringToFront,
  SendToBack,
  Trash2,
  Star,
  Hash,
  BarChart2,
  BarChart,
  BarChartHorizontal,
  LineChart,
  AreaChart as AreaIcon,
  PieChart as PieIcon,
  CircleDot,
  GitCommit,
  Compass,
  Gauge,
  ScatterChart,
  Filter as FunnelIcon,
  Activity,
  Grid,
  Layers,
  Table,
  Kanban,
  List,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  Type,
  FileText,
  Image as ImageIcon,
  Check,
  Plus,
  ChevronDown,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Shapes,
  Calculator,
  Palette,
} from 'lucide-react';
import {
  VisualWidget,
  VisualType,
  SalesRecord,
  VisualFilterRule,
  ConditionalColorRule,
  CalculatedField,
} from '../types';

interface InspectorProps {
  widget: VisualWidget | null;
  onClose: () => void;
  onUpdateWidget: (id: string, partial: Partial<VisualWidget>) => void;
  onDuplicateWidget: (id: string) => void;
  onDeleteWidget: (id: string) => void;
  onCopyWidget: (id: string) => void;
  onPasteWidget: () => void;
  onToggleLock: (id: string) => void;
  onToggleHide: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  detectedHeaders?: string[];
  salesData?: SalesRecord[];
  onOpenFormulaBuilder?: () => void;
  calculatedFields?: CalculatedField[];
}

type TabType = 'data' | 'style' | 'filter' | 'actions' | 'advanced';

interface VisualTypeItem {
  id: VisualType;
  label: string;
  icon: React.ReactNode;
}

const VISUAL_TYPES: VisualTypeItem[] = [
  { id: 'kpi', label: 'ตัวเลข KPI', icon: <Hash className="w-3.5 h-3.5" /> },
  { id: 'bar', label: 'กราฟแท่ง', icon: <BarChart2 className="w-3.5 h-3.5" /> },
  { id: 'column', label: 'กราฟคอลัมน์', icon: <BarChart className="w-3.5 h-3.5" /> },
  { id: 'bar_horizontal', label: 'กราฟแท่งแนวนอน', icon: <BarChartHorizontal className="w-3.5 h-3.5" /> },
  { id: 'line', label: 'กราฟเส้น', icon: <LineChart className="w-3.5 h-3.5" /> },
  { id: 'area', label: 'กราฟพื้นที่', icon: <AreaIcon className="w-3.5 h-3.5" /> },
  { id: 'pie', label: 'กราฟวงกลม', icon: <PieIcon className="w-3.5 h-3.5" /> },
  { id: 'donut', label: 'กราฟโดนัท', icon: <CircleDot className="w-3.5 h-3.5" /> },
  { id: 'combo', label: 'กราฟผสม', icon: <GitCommit className="w-3.5 h-3.5" /> },
  { id: 'radar', label: 'กราฟเรดาร์', icon: <Compass className="w-3.5 h-3.5" /> },
  { id: 'gauge', label: 'มาตรวัด', icon: <Gauge className="w-3.5 h-3.5" /> },
  { id: 'scatter', label: 'กราฟจุดกระจาย', icon: <ScatterChart className="w-3.5 h-3.5" /> },
  { id: 'funnel', label: 'กราฟกรวย Funnel', icon: <FunnelIcon className="w-3.5 h-3.5" /> },
  { id: 'waterfall', label: 'กราฟ Waterfall', icon: <Activity className="w-3.5 h-3.5" /> },
  { id: 'heatmap', label: 'Heatmap', icon: <Grid className="w-3.5 h-3.5" /> },
  { id: 'treemap', label: 'Treemap', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'table', label: 'ตารางข้อมูล', icon: <Table className="w-3.5 h-3.5" /> },
  { id: 'pivot', label: 'ตารางสรุป Pivot', icon: <Kanban className="w-3.5 h-3.5" /> },
  { id: 'list', label: 'รายการข้อมูล', icon: <List className="w-3.5 h-3.5" /> },
  { id: 'timeline', label: 'Timeline', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'map', label: 'Map เชิงข้อมูล', icon: <MapPin className="w-3.5 h-3.5" /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: 'progressbar', label: 'Progress Bar', icon: <Activity className="w-3.5 h-3.5" /> },
  { id: 'ai_summary', label: 'การ์ดสรุปย่อ (Summary)', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'textbox', label: 'กล่องข้อความ', icon: <Type className="w-3.5 h-3.5" /> },
  { id: 'richtext', label: 'Rich Text', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'floating_text', label: 'ข้อความลอย', icon: <Type className="w-3.5 h-3.5" /> },
  { id: 'image', label: 'รูปภาพ', icon: <ImageIcon className="w-3.5 h-3.5" /> },
  { id: 'shape_rect', label: 'รูปทรง สี่เหลี่ยม', icon: <Square className="w-3.5 h-3.5" /> },
  { id: 'shape_rounded', label: 'รูปทรง สี่เหลี่ยมมน', icon: <Square className="w-3.5 h-3.5 rounded-sm" /> },
  { id: 'shape_circle', label: 'รูปทรง วงกลม', icon: <Circle className="w-3.5 h-3.5" /> },
  { id: 'shape_triangle', label: 'รูปทรง สามเหลี่ยม', icon: <Triangle className="w-3.5 h-3.5" /> },
  { id: 'shape_star', label: 'รูปทรง ดาว', icon: <Star className="w-3.5 h-3.5" /> },
  { id: 'shape_diamond', label: 'รูปทรง เพชร', icon: <Hexagon className="w-3.5 h-3.5 rotate-45" /> },
  { id: 'shape_pill', label: 'รูปทรง แคปซูล', icon: <Circle className="w-3.5 h-3.5" /> },
  { id: 'shape_banner', label: 'รูปทรง แบนเนอร์', icon: <Shapes className="w-3.5 h-3.5" /> },
];

const PALETTES = [
  ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'],
  ['#f97316', '#ef4444', '#f59e0b', '#84cc16', '#06b6d4'],
  ['#06b6d4', '#3b82f6', '#6366f1', '#14b8a6', '#10b981'],
  ['#eab308', '#f97316', '#ef4444', '#84cc16', '#10b981'],
  ['#10b981', '#059669', '#14b8a6', '#84cc16', '#22c55e'],
  ['#ec4899', '#f43f5e', '#d946ef', '#a855f7', '#fb7185'],
  ['#84cc16', '#22c55e', '#10b981', '#eab308', '#06b6d4'],
  ['#b45309', '#d97706', '#f59e0b', '#78350f', '#92400e'],
  ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#0ea5e9'],
  ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8'],
];

export const Inspector: React.FC<InspectorProps> = ({
  widget,
  onClose,
  onUpdateWidget,
  onDuplicateWidget,
  onDeleteWidget,
  onCopyWidget,
  onPasteWidget,
  onToggleLock,
  onToggleHide,
  onBringForward,
  onSendBackward,
  detectedHeaders = [],
  salesData = [],
  onOpenFormulaBuilder,
  calculatedFields = [],
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('actions');
  const [savedTemplates, setSavedTemplates] = useState<
    Array<{ id: string; title: string; type: VisualType }>
  >([]);
  const [savedAlert, setSavedAlert] = useState(false);

  // Deduce column lists from headers or salesData (always call useMemo before any early returns)
  const availableColumns = useMemo(() => {
    if (detectedHeaders && detectedHeaders.length > 0) {
      return detectedHeaders;
    }
    if (salesData && salesData.length > 0) {
      const keys = Object.keys(salesData[0]).filter(
        (k) => !['id', 'orderId'].includes(k)
      );
      return keys.length > 0 ? keys : ['category', 'region', 'product', 'revenue', 'profit'];
    }
    return ['หมวดหมู่', 'ภูมิภาค', 'สินค้า', 'ยอดขาย', 'ต้นทุน', 'กำไร'];
  }, [detectedHeaders, salesData]);

  if (!widget) {
    return (
      <aside
        id="bi-inspector-empty"
        className="w-80 bg-white border-l border-slate-200 flex flex-col h-screen select-none shrink-0 p-6 text-center text-slate-500 justify-center"
      >
        <CircleDot className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <div className="font-semibold text-slate-700 text-sm">ยังไม่ได้เลือกวิชวล</div>
        <div className="text-xs text-slate-400 mt-1">คลิกที่การ์ดกราฟบนผืนงานเพื่อปรับแต่งข้อมูลและสไตล์</div>
      </aside>
    );
  }

  // Distinct values for filter helper
  const getDistinctValues = (column: string) => {
    if (!salesData || salesData.length === 0) return [];
    const set = new Set<string>();
    salesData.forEach((row) => {
      const val = row[column] ?? row.category ?? row.region;
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        set.add(String(val));
      }
    });
    return Array.from(set);
  };

  const handleSaveAsTemplate = () => {
    setSavedTemplates((prev) => [
      ...prev,
      { id: `tpl-${Date.now()}`, title: widget.title, type: widget.type },
    ]);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2000);
  };

  // Toggle switch helper
  const renderToggle = (
    label: string,
    checked: boolean,
    onChange: (val: boolean) => void,
    id: string
  ) => (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-700">{label}</span>
      <button
        type="button"
        id={id}
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
          checked ? 'bg-violet-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform shadow-xs ${
            checked ? 'left-4.5' : 'left-0.75'
          }`}
        />
      </button>
    </div>
  );

  return (
    <aside
      id="bi-inspector"
      className="w-80 bg-white border-l border-slate-200 flex flex-col h-screen select-none shrink-0 shadow-sm"
    >
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div>
          <div className="text-[10px] font-bold tracking-widest text-violet-600 uppercase">
            BI STUDIO
          </div>
          <div className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
            {widget.title || 'ตั้งค่าวิชวล'}
          </div>
        </div>
        <button
          id="btn-close-inspector"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 5 Tabs (Data, Style, Filter, Actions, Advanced) */}
      <div className="flex border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50">
        {(
          [
            { id: 'data', label: 'Data' },
            { id: 'style', label: 'Style' },
            { id: 'filter', label: 'Filter' },
            { id: 'actions', label: 'Actions' },
            { id: 'advanced', label: 'Advanced' },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-center transition cursor-pointer relative ${
                isActive
                  ? 'text-violet-700 font-bold bg-white'
                  : 'hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Scrollable Tab Body */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
        {/* TAB 1: DATA */}
        {activeTab === 'data' && (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
                ข้อมูลหลัก
              </div>

              {/* Title */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อวิชวล
                </label>
                <input
                  type="text"
                  value={widget.title}
                  onChange={(e) => onUpdateWidget(widget.id, { title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-violet-500 text-xs bg-white"
                />
              </div>

              {/* Dimension (หัวข้อจัดกลุ่ม) */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  หัวข้อจัดกลุ่ม (Dimension)
                </label>
                <select
                  value={widget.dimension || availableColumns[0] || 'category'}
                  onChange={(e) => onUpdateWidget(widget.id, { dimension: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-violet-500 text-xs bg-white"
                >
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Metric (ค่าที่วิเคราะห์) */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ค่าที่วิเคราะห์ (Metric)
                </label>
                <select
                  value={widget.metric || 'revenue'}
                  onChange={(e) => onUpdateWidget(widget.id, { metric: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-violet-500 text-xs bg-white"
                >
                  <option value="revenue">ยอดขาย (Revenue / บาท)</option>
                  <option value="profit">กำไรขั้นต้น (Profit / บาท)</option>
                  <option value="cost">ต้นทุน (Cost / บาท)</option>
                  <option value="quantity">จำนวน (Quantity)</option>
                  {calculatedFields && calculatedFields.length > 0 && (
                    <optgroup label="✨ ฟิลด์คำนวณ (Calculated Fields)">
                      {calculatedFields.map((cf) => (
                        <option key={cf.id} value={cf.name}>
                          {cf.name} ({cf.expression})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {availableColumns
                    .filter((c) => !['category', 'region', 'product', 'date', 'orderId'].includes(c))
                    .map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                </select>

                {onOpenFormulaBuilder && (
                  <button
                    type="button"
                    onClick={onOpenFormulaBuilder}
                    className="w-full mt-2 py-1.5 px-3 border border-dashed border-violet-300 hover:border-violet-500 bg-violet-50/60 hover:bg-violet-100 text-violet-700 font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5 text-violet-600" />
                    <span>+ สร้างหรือจัดการสูตรคำนวณ (Formula Builder)</span>
                  </button>
                )}
              </div>

              {/* Calculation / Aggregation */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  การคำนวณ (Aggregation)
                </label>
                <select
                  value={widget.aggregation || 'sum'}
                  onChange={(e) =>
                    onUpdateWidget(widget.id, { aggregation: e.target.value as any })
                  }
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-violet-500 text-xs bg-white font-medium"
                >
                  <option value="sum">ผลรวม (SUM)</option>
                  <option value="avg">ค่าเฉลี่ย (AVERAGE)</option>
                  <option value="count">นับจำนวนทั้งหมด (COUNT)</option>
                  <option value="count_distinct">★ นับค่าไม่ซ้ำ (COUNT DISTINCT - ตัดข้อมูลซ้ำ)</option>
                  <option value="min">ค่าน้อยสุด (MIN)</option>
                  <option value="max">ค่ามากสุด (MAX)</option>
                  <option value="median">ค่ามัธยฐาน (MEDIAN)</option>
                </select>
              </div>

              {/* Drill Down Configuration for Charts */}
              {widget.type !== 'shape' && widget.type !== 'kpi' && widget.type !== 'table' && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <GitCommit className="w-3.5 h-3.5 text-violet-600" />
                      <span>เปิดใช้งาน Drill Down (เจาะลึก)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={widget.drillDownEnabled || false}
                      onChange={(e) =>
                        onUpdateWidget(widget.id, {
                          drillDownEnabled: e.target.checked,
                          drillLevels: widget.drillLevels || ['region', 'category', 'product'],
                          currentDrillLevel: 0,
                          drillFilters: [],
                        })
                      }
                      className="rounded text-violet-600 cursor-pointer w-4 h-4"
                    />
                  </div>
                  {widget.drillDownEnabled && (
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <p className="text-[11px] text-slate-500">
                        ลำดับชั้นการคลิกเจาะลึก (Hierarchy):
                      </p>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-violet-700 bg-white p-2 rounded border border-violet-200 flex-wrap">
                        <span className="bg-violet-50 px-1.5 py-0.5 rounded">1. ภูมิภาค (Region)</span>
                        <span>&rarr;</span>
                        <span className="bg-violet-50 px-1.5 py-0.5 rounded">2. หมวดหมู่ (Category)</span>
                        <span>&rarr;</span>
                        <span className="bg-violet-50 px-1.5 py-0.5 rounded">3. สินค้า (Product)</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                        <span>ระดับปัจจุบัน: {(widget.currentDrillLevel || 0) + 1}/3</span>
                        <button
                          type="button"
                          onClick={() => onUpdateWidget(widget.id, { currentDrillLevel: 0, drillFilters: [] })}
                          className="text-violet-600 hover:underline font-semibold cursor-pointer"
                        >
                          รีเซ็ตกลับระดับบนสุด
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: STYLE */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            {/* Color Palette section matching screenshot 2 */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
                สีของข้อมูล
              </div>
              <div className="text-[11px] text-slate-500 mb-2.5">
                เลือกจากชุดสีพิมพ์ หรือแตะสีแต่ละหัวข้อด้านล่าง
              </div>

              {/* 10 Circular Palettes Row */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                {PALETTES.map((pal, idx) => {
                  const isSelected = (widget.paletteIndex ?? 0) === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => onUpdateWidget(widget.id, { paletteIndex: idx })}
                      className={`w-6 h-6 rounded-full border shrink-0 transition flex items-center justify-center p-0.5 ${
                        isSelected
                          ? 'border-violet-600 ring-2 ring-violet-400/50 scale-110'
                          : 'border-slate-200 hover:scale-105'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${pal[0]} 0%, ${pal[1]} 50%, ${pal[2]} 100%)`,
                      }}
                      title={`ชุดสีที่ ${idx + 1}`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              {/* Series items badges */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ● อิเล็กทรอนิกส์
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  ● ของใช้ในบ้าน
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  ● สุขภาพ
                </span>
              </div>
            </div>

            {/* Display Toggles matching screenshot 2 */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
                การแสดงผล
              </div>

              <div className="space-y-0.5">
                {renderToggle(
                  'แสดงชื่อวิชวล',
                  widget.showTitle !== false,
                  (val) => onUpdateWidget(widget.id, { showTitle: val }),
                  'toggle-show-title'
                )}
                {renderToggle(
                  'แสดงคำอธิบายสี',
                  widget.showLegend !== false,
                  (val) => onUpdateWidget(widget.id, { showLegend: val }),
                  'toggle-show-legend'
                )}
                {renderToggle(
                  'แสดงค่าบนกราฟ',
                  widget.showDataLabels === true,
                  (val) => onUpdateWidget(widget.id, { showDataLabels: val }),
                  'toggle-show-labels'
                )}
                {renderToggle(
                  'แสดงเส้นตาราง',
                  widget.showGrid !== false,
                  (val) => onUpdateWidget(widget.id, { showGrid: val }),
                  'toggle-show-grid'
                )}
                {renderToggle(
                  'แสดงแกน X',
                  widget.showXAxis !== false,
                  (val) => onUpdateWidget(widget.id, { showXAxis: val }),
                  'toggle-show-xaxis'
                )}
                {renderToggle(
                  'แสดงแกน Y',
                  widget.showYAxis !== false,
                  (val) => onUpdateWidget(widget.id, { showYAxis: val }),
                  'toggle-show-yaxis'
                )}
                {renderToggle(
                  'แสดง Tooltip',
                  widget.showTooltip !== false,
                  (val) => onUpdateWidget(widget.id, { showTooltip: val }),
                  'toggle-show-tooltip'
                )}
                {renderToggle(
                  'แสดงจำนวนแถวที่คำนวณ',
                  widget.showRowCount === true,
                  (val) => onUpdateWidget(widget.id, { showRowCount: val }),
                  'toggle-show-rowcount'
                )}
                {renderToggle(
                  'ไม่นับข้อมูลช่องว่าง',
                  widget.skipBlanks !== false,
                  (val) => onUpdateWidget(widget.id, { skipBlanks: val }),
                  'toggle-skip-blanks'
                )}
                {widget.type === 'kpi' && (
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    {renderToggle(
                      'แสดงแนวโน้มเทียบช่วงก่อนหน้า (KPI Trend ▲/▼)',
                      widget.showTrend !== false,
                      (val) => onUpdateWidget(widget.id, { showTrend: val }),
                      'toggle-show-trend'
                    )}

                    {widget.showTrend !== false && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            คอลัมน์ช่วงเวลา/มิติเปรียบเทียบ (Compare Column)
                          </label>
                          <select
                            value={widget.trendCompareColumn || ''}
                            onChange={(e) =>
                              onUpdateWidget(widget.id, { trendCompareColumn: e.target.value })
                            }
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white font-medium"
                          >
                            <option value="">อัตโนมัติ (ครึ่งช่วงข้อมูลล่าสุด)</option>
                            <option value="date">วันที่ (date / เดือน-ปี)</option>
                            {availableColumns.map((col) => (
                              <option key={col} value={col}>
                                {col}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            ข้อความกำกับแนวโน้ม (Label)
                          </label>
                          <input
                            type="text"
                            value={widget.trendLabel ?? 'เดือนก่อนหน้า'}
                            onChange={(e) =>
                              onUpdateWidget(widget.id, { trendLabel: e.target.value })
                            }
                            placeholder="เช่น เดือนก่อนหน้า (เว้นว่างเพื่อแสดงเฉพาะ % และตัวเลข)"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-white"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">
                            *ระบบแสดงเฉพาะ ▲/▼ เปอร์เซ็นต์ และผลต่างตัวเลข (+/-) โดยไม่มีคำว่า "vs" บัง
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Conditional Color Formatting */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-violet-600" />
                  <span>สีตามเงื่อนไข (Conditional Color)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const rules = widget.conditionalRules || [];
                    const newRule: ConditionalColorRule = {
                      id: `cr-${Date.now()}`,
                      operator: 'greater',
                      value: 100000,
                      color: '#10b981',
                      label: 'เกินเป้าหมาย',
                    };
                    onUpdateWidget(widget.id, { conditionalRules: [...rules, newRule] });
                  }}
                  className="text-[10px] font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded cursor-pointer transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>เพิ่มเงื่อนไข</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mb-2">
                เปลี่ยนสีของตัวเลข KPI หรือแท่งกราฟอัตโนมัติตามค่าตัวเลข
              </p>

              {(!widget.conditionalRules || widget.conditionalRules.length === 0) && (
                <div className="p-2.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 text-center text-xs text-slate-400">
                  ยังไม่มีเงื่อนไขสี คลิก "+ เพิ่มเงื่อนไข" เพื่อเริ่มตั้งค่า
                </div>
              )}

              <div className="space-y-2">
                {(widget.conditionalRules || []).map((rule, idx) => (
                  <div
                    key={rule.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col gap-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 text-[11px]">
                        เงื่อนไขที่ {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (widget.conditionalRules || []).filter((r) => r.id !== rule.id);
                          onUpdateWidget(widget.id, { conditionalRules: updated });
                        }}
                        className="text-slate-400 hover:text-rose-500 transition cursor-pointer p-0.5"
                        title="ลบเงื่อนไขนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-12 gap-1.5 items-center">
                      <select
                        value={rule.operator}
                        onChange={(e) => {
                          const updated = (widget.conditionalRules || []).map((r) =>
                            r.id === rule.id ? { ...r, operator: e.target.value as any } : r
                          );
                          onUpdateWidget(widget.id, { conditionalRules: updated });
                        }}
                        className="col-span-5 px-1.5 py-1 border border-slate-200 rounded text-[11px] bg-white font-medium"
                      >
                        <option value="greater">ค่า &gt; มากกว่า</option>
                        <option value="greater_equal">ค่า &ge; มากกว่าหรือเท่ากับ</option>
                        <option value="less">ค่า &lt; น้อยกว่า</option>
                        <option value="less_equal">ค่า &le; น้อยกว่าหรือเท่ากับ</option>
                        <option value="equals">ค่า = เท่ากับ</option>
                      </select>

                      <input
                        type="number"
                        value={rule.value}
                        onChange={(e) => {
                          const updated = (widget.conditionalRules || []).map((r) =>
                            r.id === rule.id ? { ...r, value: parseFloat(e.target.value) || 0 } : r
                          );
                          onUpdateWidget(widget.id, { conditionalRules: updated });
                        }}
                        className="col-span-4 px-1.5 py-1 border border-slate-200 rounded text-[11px] bg-white font-mono"
                        placeholder="เกณฑ์"
                      />

                      <div className="col-span-3 flex items-center gap-1">
                        <input
                          type="color"
                          value={rule.color}
                          onChange={(e) => {
                            const updated = (widget.conditionalRules || []).map((r) =>
                              r.id === rule.id ? { ...r, color: e.target.value } : r
                            );
                            onUpdateWidget(widget.id, { conditionalRules: updated });
                          }}
                          className="w-6 h-6 rounded border border-slate-300 cursor-pointer p-0.5"
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 shadow-xs"
                          style={{ backgroundColor: rule.color }}
                        />
                      </div>
                    </div>

                    {/* Color Presets */}
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      <span className="text-[10px] text-slate-400">สีด่วน:</span>
                      {[
                        { label: 'เขียว', c: '#10b981' },
                        { label: 'แดง', c: '#ef4444' },
                        { label: 'ส้ม', c: '#f59e0b' },
                        { label: 'ม่วง', c: '#8b5cf6' },
                        { label: 'ฟ้า', c: '#3b82f6' },
                      ].map((preset) => (
                        <button
                          key={preset.c}
                          type="button"
                          onClick={() => {
                            const updated = (widget.conditionalRules || []).map((r) =>
                              r.id === rule.id ? { ...r, color: preset.c } : r
                            );
                            onUpdateWidget(widget.id, { conditionalRules: updated });
                          }}
                          className="px-1.5 py-0.5 rounded text-[9px] text-white font-medium cursor-pointer transition hover:opacity-85"
                          style={{ backgroundColor: preset.c }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inner Placement matching screenshot 2 */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
                พื้นที่ภายในกราฟ
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    ตำแหน่งคำอธิบาย
                  </label>
                  <select
                    value={widget.legendPosition || 'bottom'}
                    onChange={(e) =>
                      onUpdateWidget(widget.id, { legendPosition: e.target.value as any })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white"
                  >
                    <option value="bottom">ด้านล่าง</option>
                    <option value="top">ด้านบน</option>
                    <option value="left">ด้านซ้าย</option>
                    <option value="right">ด้านขวา</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">จัดวางกราฟ</label>
                  <select
                    value={widget.chartAlign || 'center'}
                    onChange={(e) =>
                      onUpdateWidget(widget.id, { chartAlign: e.target.value as any })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white"
                  >
                    <option value="center">กึ่งกลาง</option>
                    <option value="left">ชิดซ้าย</option>
                    <option value="right">ชิดขวา</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">ขนาด (%)</label>
                    <input
                      type="number"
                      value={widget.chartScale || 100}
                      onChange={(e) =>
                        onUpdateWidget(widget.id, { chartScale: parseInt(e.target.value) || 100 })
                      }
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">เลื่อนซ้าย/ขวา</label>
                    <input
                      type="number"
                      value={widget.offsetX || 0}
                      onChange={(e) =>
                        onUpdateWidget(widget.id, { offsetX: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">เลื่อนบน/ล่าง</label>
                    <input
                      type="number"
                      value={widget.offsetY || 0}
                      onChange={(e) =>
                        onUpdateWidget(widget.id, { offsetY: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Number Formatting matching screenshot 2 */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
                ตัวเลข
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">รูปแบบ</label>
                  <select
                    value={widget.numberFormat || 'number'}
                    onChange={(e) =>
                      onUpdateWidget(widget.id, { numberFormat: e.target.value as any })
                    }
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white"
                  >
                    <option value="number">ตัวเลข</option>
                    <option value="currency">สกุลเงิน (฿)</option>
                    <option value="percent">เปอร์เซ็นต์ (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">ทศนิยม</label>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={widget.decimals ?? 0}
                    onChange={(e) =>
                      onUpdateWidget(widget.id, { decimals: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                  />
                </div>
              </div>
            </div>

            {/* พื้นหลัง และความโปร่งใส (Background & Transparency) */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <div className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
                พื้นหลังและกรอบวิชวล
              </div>

              {renderToggle(
                'พื้นหลังโปร่งใส (Transparent)',
                widget.transparentBg === true,
                (val) => onUpdateWidget(widget.id, { transparentBg: val }),
                'toggle-transparent-bg'
              )}

              {!widget.transparentBg && (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">สีพื้นหลัง</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={widget.cardBgColor || '#ffffff'}
                          onChange={(e) => onUpdateWidget(widget.id, { cardBgColor: e.target.value })}
                          className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={widget.cardBgColor || '#ffffff'}
                          onChange={(e) => onUpdateWidget(widget.id, { cardBgColor: e.target.value })}
                          className="flex-1 px-1.5 py-1 border border-slate-200 rounded text-[10px]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">ความทึบแสง ({widget.cardOpacity ?? 100}%)</label>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={widget.cardOpacity ?? 100}
                        onChange={(e) => onUpdateWidget(widget.id, { cardOpacity: parseInt(e.target.value) })}
                        className="w-full mt-1.5 accent-violet-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">สีเส้นขอบ</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={widget.cardBorderColor || '#e2e8f0'}
                          onChange={(e) => onUpdateWidget(widget.id, { cardBorderColor: e.target.value })}
                          className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={widget.cardBorderColor || '#e2e8f0'}
                          onChange={(e) => onUpdateWidget(widget.id, { cardBorderColor: e.target.value })}
                          className="flex-1 px-1.5 py-1 border border-slate-200 rounded text-[10px]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">ความหนาขอบ</label>
                      <select
                        value={widget.cardBorderWidth ?? 1}
                        onChange={(e) => onUpdateWidget(widget.id, { cardBorderWidth: parseInt(e.target.value) })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white"
                      >
                        <option value={0}>ไม่มีขอบ (0px)</option>
                        <option value={1}>บาง (1px)</option>
                        <option value={2}>ปานกลาง (2px)</option>
                        <option value={3}>หนา (3px)</option>
                        <option value={4}>หนามาก (4px)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">เส้นขอบ</label>
                      <select
                        value={widget.cardBorderStyle || 'solid'}
                        onChange={(e) => onUpdateWidget(widget.id, { cardBorderStyle: e.target.value as any })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white"
                      >
                        <option value="solid">เส้นทึบ (Solid)</option>
                        <option value="dashed">เส้นประ (Dashed)</option>
                        <option value="dotted">เส้นจุด (Dotted)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">ความมนขอบ</label>
                      <select
                        value={widget.cardBorderRadius ?? 12}
                        onChange={(e) => onUpdateWidget(widget.id, { cardBorderRadius: parseInt(e.target.value) })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white"
                      >
                        <option value={0}>เหลี่ยม (0px)</option>
                        <option value={8}>มนน้อย (8px)</option>
                        <option value={12}>มนปกติ (12px)</option>
                        <option value={16}>มนปานกลาง (16px)</option>
                        <option value={24}>มนมาก (24px)</option>
                        <option value={999}>ทรงแคปซูล</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Shape Specific Styling if widget is a shape */}
            {widget.type.startsWith('shape_') && (
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="text-[11px] font-bold text-violet-700 mb-1 uppercase tracking-wide flex items-center gap-1">
                  <Shapes className="w-3.5 h-3.5" />
                  <span>การปรับแต่งรูปทรง (Shape Studio)</span>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">ข้อความด้านในรูปทรง</label>
                  <input
                    type="text"
                    value={widget.shapeText || widget.title || ''}
                    onChange={(e) => onUpdateWidget(widget.id, { shapeText: e.target.value, title: e.target.value })}
                    placeholder="พิมพ์ข้อความในรูปทรง..."
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">สีพื้นรูปทรง</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={widget.shapeFillColor || '#ede9fe'}
                        onChange={(e) => onUpdateWidget(widget.id, { shapeFillColor: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={widget.shapeFillColor || '#ede9fe'}
                        onChange={(e) => onUpdateWidget(widget.id, { shapeFillColor: e.target.value })}
                        className="flex-1 px-1.5 py-1 border border-slate-200 rounded text-[10px]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">สีเส้นรูปทรง</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={widget.shapeBorderColor || '#8b5cf6'}
                        onChange={(e) => onUpdateWidget(widget.id, { shapeBorderColor: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={widget.shapeBorderColor || '#8b5cf6'}
                        onChange={(e) => onUpdateWidget(widget.id, { shapeBorderColor: e.target.value })}
                        className="flex-1 px-1.5 py-1 border border-slate-200 rounded text-[10px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">สีข้อความ</label>
                    <input
                      type="color"
                      value={widget.shapeTextColor || '#5b21b6'}
                      onChange={(e) => onUpdateWidget(widget.id, { shapeTextColor: e.target.value })}
                      className="w-full h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">ขนาดฟอนต์</label>
                    <select
                      value={widget.shapeTextSize || 14}
                      onChange={(e) => onUpdateWidget(widget.id, { shapeTextSize: parseInt(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white"
                    >
                      <option value={11}>เล็ก (11px)</option>
                      <option value={13}>ปกติ (13px)</option>
                      <option value={16}>ปานกลาง (16px)</option>
                      <option value={20}>ใหญ่ (20px)</option>
                      <option value={24}>ใหญ่พิเศษ (24px)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Layout Width & Height Sizing & Corner Radius */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div>
                <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
                  ขนาดการจัดวาง (12 คอลัมน์)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      ความกว้าง: {widget.w} คอลัมน์
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={widget.w || 6}
                      onChange={(e) => onUpdateWidget(widget.id, { w: parseInt(e.target.value) })}
                      className="w-full accent-violet-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      ความสูง: {widget.h} แถว
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={widget.h || 4}
                      onChange={(e) => onUpdateWidget(widget.id, { h: parseInt(e.target.value) })}
                      className="w-full accent-violet-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Corner Radius ("ปรับให้มนได้") */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    ความโค้งมนของขอบการ์ด
                  </span>
                  <span className="text-[10px] text-violet-600 font-semibold">
                    {widget.cardBorderRadius ?? 12}px
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-[11px] mb-2">
                  {[
                    { label: 'เหลี่ยม', r: 0 },
                    { label: 'มน 8', r: 8 },
                    { label: 'มน 12', r: 12 },
                    { label: 'มน 20', r: 20 },
                    { label: 'แคปซูล', r: 999 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => onUpdateWidget(widget.id, { cardBorderRadius: preset.r })}
                      className={`py-1 rounded border text-center font-medium transition cursor-pointer ${
                        (widget.cardBorderRadius ?? 12) === preset.r
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min={0}
                  max={36}
                  value={Math.min(widget.cardBorderRadius ?? 12, 36)}
                  onChange={(e) =>
                    onUpdateWidget(widget.id, { cardBorderRadius: parseInt(e.target.value) })
                  }
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FILTER */}
        {activeTab === 'filter' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-700">เงื่อนไขก่อนคำนวณของกราฟนี้</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  กรองเฉพาะวิชวลนี้ (AND ทุกข้อ) ปรับแยกอิสระจากกราฟอื่น
                </p>
              </div>
              {widget.filterRules && widget.filterRules.length > 0 && (
                <button
                  onClick={() => onUpdateWidget(widget.id, { filterRules: [] })}
                  className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                >
                  ล้างทั้งหมด
                </button>
              )}
            </div>

            {/* List of active filter rules for this widget */}
            {(!widget.filterRules || widget.filterRules.length === 0) ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                <div className="text-xs text-slate-500">ยังไม่มีเงื่อนไขเฉพาะกราฟนี้</div>
                <button
                  onClick={() => {
                    const newRule: VisualFilterRule = {
                      id: `rule-${Date.now()}`,
                      column: widget.dimension || availableColumns[0] || 'category',
                      operator: 'equals',
                      value: '',
                    };
                    onUpdateWidget(widget.id, { filterRules: [newRule] });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มเงื่อนไขแรก</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {widget.filterRules.map((rule, idx) => {
                  const distinctVals = getDistinctValues(rule.column);
                  return (
                    <div
                      key={rule.id || idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs relative"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span className="text-violet-600">เงื่อนไขที่ {idx + 1}</span>
                        <button
                          onClick={() => {
                            const updated = widget.filterRules!.filter((_, i) => i !== idx);
                            onUpdateWidget(widget.id, { filterRules: updated });
                          }}
                          className="text-slate-400 hover:text-rose-500 p-0.5 transition cursor-pointer"
                          title="ลบเงื่อนไขนี้"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Column */}
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">คอลัมน์</label>
                        <select
                          value={rule.column}
                          onChange={(e) => {
                            const updated = [...widget.filterRules!];
                            updated[idx] = { ...rule, column: e.target.value, value: '' };
                            onUpdateWidget(widget.id, { filterRules: updated });
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-800"
                        >
                          {availableColumns.map((col) => (
                            <option key={col} value={col}>
                              {col}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Operator */}
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">เงื่อนไข</label>
                        <select
                          value={rule.operator}
                          onChange={(e) => {
                            const updated = [...widget.filterRules!];
                            updated[idx] = { ...rule, operator: e.target.value as any };
                            onUpdateWidget(widget.id, { filterRules: updated });
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-800 font-medium"
                        >
                          <option value="equals">เท่ากับ (Equals)</option>
                          <option value="not_equals">ไม่เท่ากับ (Not Equals)</option>
                          <option value="contains">ประกอบด้วย (Contains)</option>
                          <option value="starts_with">ขึ้นต้นด้วย (Starts With)</option>
                          <option value="greater">มากกว่า (Greater Than)</option>
                          <option value="less">น้อยกว่า (Less Than)</option>
                          <option value="count_distinct">★ นับจำนวนโดยไม่ซ้ำ (COUNT DISTINCT)</option>
                          <option value="not_blank">ไม่เป็นค่าว่าง (Not Blank)</option>
                          <option value="is_blank">เป็นค่าว่าง (Is Blank)</option>
                        </select>
                      </div>

                      {/* Value (Hidden for is_blank, not_blank, count_distinct) */}
                      {rule.operator !== 'is_blank' &&
                        rule.operator !== 'not_blank' &&
                        rule.operator !== 'count_distinct' && (
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">ค่าที่เปรียบเทียบ</label>
                            {distinctVals.length > 0 && distinctVals.length <= 20 ? (
                              <select
                                value={rule.value}
                                onChange={(e) => {
                                  const updated = [...widget.filterRules!];
                                  updated[idx] = { ...rule, value: e.target.value };
                                  onUpdateWidget(widget.id, { filterRules: updated });
                                }}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-800"
                              >
                                <option value="">-- เลือกค่าจากคอลัมน์ --</option>
                                {distinctVals.map((v) => (
                                  <option key={v} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={rule.value}
                                onChange={(e) => {
                                  const updated = [...widget.filterRules!];
                                  updated[idx] = { ...rule, value: e.target.value };
                                  onUpdateWidget(widget.id, { filterRules: updated });
                                }}
                                placeholder="พิมพ์ค่าที่ต้องการกรอง..."
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-800"
                              />
                            )}
                          </div>
                        )}

                      <div className="text-[10px] text-violet-600 font-medium pt-0.5">
                        พบ {distinctVals.length} ค่าจริงในคอลัมน์นี้
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => {
                    const newRule: VisualFilterRule = {
                      id: `rule-${Date.now()}`,
                      column: availableColumns[0] || 'category',
                      operator: 'equals',
                      value: '',
                    };
                    onUpdateWidget(widget.id, {
                      filterRules: [...(widget.filterRules || []), newRule],
                    });
                  }}
                  className="w-full py-2 px-3 border border-dashed border-violet-300 rounded-lg text-violet-700 bg-violet-50/50 hover:bg-violet-100/60 transition text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มเงื่อนไขอีกข้อ</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ACTIONS */}
        {activeTab === 'actions' && (
          <div className="space-y-4">
            {/* Visual Action Buttons matching screenshot 4 */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
                การทำงานกับวิชวล
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  id="action-duplicate"
                  onClick={() => onDuplicateWidget(widget.id)}
                  className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>ทำสำเนา</span>
                </button>

                <button
                  id="action-copy"
                  onClick={() => onCopyWidget(widget.id)}
                  className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Files className="w-3.5 h-3.5 text-slate-500" />
                  <span>คัดลอก</span>
                </button>

                <button
                  id="action-paste"
                  onClick={onPasteWidget}
                  className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-slate-500" />
                  <span>วาง</span>
                </button>

                <button
                  id="action-lock"
                  onClick={() => onToggleLock(widget.id)}
                  className={`py-2 px-3 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    widget.locked
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {widget.locked ? (
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{widget.locked ? 'ปลดล็อก' : 'ล็อก'}</span>
                </button>

                <button
                  id="action-hide"
                  onClick={() => onToggleHide(widget.id)}
                  className={`py-2 px-3 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    widget.hidden
                      ? 'bg-purple-50 border-purple-300 text-purple-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {widget.hidden ? (
                    <Eye className="w-3.5 h-3.5 text-purple-600" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{widget.hidden ? 'แสดง' : 'ซ่อน / แสดง'}</span>
                </button>

                <button
                  id="action-bring-front"
                  onClick={() => onBringForward(widget.id)}
                  className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <BringToFront className="w-3.5 h-3.5 text-slate-500" />
                  <span>หน้า</span>
                </button>

                <button
                  id="action-send-back"
                  onClick={() => onSendBackward(widget.id)}
                  className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <SendToBack className="w-3.5 h-3.5 text-slate-500" />
                  <span>หลัง</span>
                </button>

                <button
                  id="action-delete"
                  onClick={() => onDeleteWidget(widget.id)}
                  className="py-2 px-3 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบ</span>
                </button>
              </div>
            </div>

            {/* WIDGET TEMPLATE SECTION matching screenshot 4 */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
                WIDGET TEMPLATE
              </div>

              <button
                id="btn-save-template"
                onClick={handleSaveAsTemplate}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:border-violet-300 bg-white hover:bg-violet-50/50 text-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>บันทึกวิชวลเป็นเทมเพลต</span>
              </button>

              {savedAlert ? (
                <div className="mt-2 p-2 rounded bg-emerald-50 text-emerald-700 text-[11px] text-center flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>บันทึกเทมเพลตวิชวลเรียบร้อยแล้ว</span>
                </div>
              ) : savedTemplates.length === 0 ? (
                <div className="text-[11px] text-slate-400 text-center mt-2">
                  ยังไม่มีเทมเพลตวิชวลที่บันทึกไว้
                </div>
              ) : (
                <div className="mt-2 space-y-1">
                  {savedTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="p-1.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-700 flex items-center justify-between"
                    >
                      <span className="truncate">{t.title}</span>
                      <span className="text-[10px] text-violet-600 capitalize">{t.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 28 VISUAL TYPES GRID matching screenshot 4 */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-700 mb-2.5">
                เปลี่ยนชนิดวิชวล
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
                {VISUAL_TYPES.map((t) => {
                  const isCurrent = widget.type === t.id;
                  return (
                    <button
                      key={t.id}
                      id={`visual-type-${t.id}`}
                      onClick={() => onUpdateWidget(widget.id, { type: t.id })}
                      className={`p-2 rounded-md border text-left flex items-center gap-2 transition cursor-pointer ${
                        isCurrent
                          ? 'border-violet-500 bg-violet-50 text-violet-700 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span className={isCurrent ? 'text-violet-600' : 'text-slate-500'}>
                        {t.icon}
                      </span>
                      <span className="truncate text-[11px]">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ADVANCED */}
        {activeTab === 'advanced' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700">การกำหนดค่าขั้นสูง</div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-600 space-y-1">
              <div>id: {widget.id}</div>
              <div>type: {widget.type}</div>
              <div>metric: {widget.metric || 'auto'}</div>
              <div>dimension: {widget.dimension || 'auto'}</div>
              <div>aggregation: {widget.aggregation || 'sum'}</div>
              <div>x: {widget.x}, y: {widget.y}, w: {widget.w}, h: {widget.h}</div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-600 mb-1">
                ข้อความคำบรรยาย (Subtitle)
              </label>
              <input
                type="text"
                value={widget.subtitle || ''}
                onChange={(e) => onUpdateWidget(widget.id, { subtitle: e.target.value })}
                placeholder="คำอธิบายเพิ่มเติมใต้วิชวล"
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
