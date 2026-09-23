import React, { useState, useRef } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts';
import {
  Minus,
  Plus,
  Maximize2,
  Minimize2,
  X,
  Lock,
  Move,
  Hash,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  CornerDownRight,
  Maximize,
  Sliders,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUp,
  ArrowDown,
  Layers,
} from 'lucide-react';
import { VisualWidget, SalesRecord, FilterState } from '../types';
import { ShapeWidget } from './ShapeWidget';
import { calculateMetricValue, aggregateForWidget } from '../utils/calcEngine';
import { ThemeStyles } from '../utils/themeStyles';

// Color palettes
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

interface DynamicWidgetCardProps {
  widget: VisualWidget;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onResize: (id: string, deltaW: number, deltaH: number) => void;
  onToggleMaximize: (id: string) => void;
  onUpdateWidget?: (id: string, partial: Partial<VisualWidget>) => void;
  onCrossFilter: (dimension: string, value: any) => void;
  activeCrossFilter?: { column: string; value: any } | null;
  filteredRecords: SalesRecord[];
  allRecords: SalesRecord[];
  themeStyles?: ThemeStyles;
  isPreviewMode?: boolean;
  onMoveWidget?: (id: string, delta: number) => void;
  isFreeform?: boolean;
  onBringForward?: (id: string) => void;
  onSendBackward?: (id: string) => void;
}

export const DynamicWidgetCard: React.FC<DynamicWidgetCardProps> = ({
  widget,
  isSelected,
  onSelect,
  onDelete,
  onResize,
  onToggleMaximize,
  onUpdateWidget,
  onCrossFilter,
  activeCrossFilter,
  filteredRecords,
  allRecords,
  themeStyles,
  isPreviewMode = false,
  onMoveWidget,
  isFreeform = false,
  onBringForward,
  onSendBackward,
}) => {
  const isDark = themeStyles?.isDark ?? true;
  const currentPalette =
    widget.paletteIndex !== undefined
      ? PALETTES[widget.paletteIndex] || PALETTES[0]
      : themeStyles?.chartPalettes || PALETTES[0];

  const cardRef = useRef<HTMLDivElement>(null);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);

  // Aggregated data for charts (hooks must execute unconditionally before any early returns)
  const chartData = React.useMemo(() => {
    if (widget.hidden) return [];
    return aggregateForWidget(filteredRecords, widget, currentPalette);
  }, [filteredRecords, widget, currentPalette]);

  // Total metric for KPI
  const kpiValue = React.useMemo(() => {
    if (widget.hidden) return 0;
    return calculateMetricValue(
      filteredRecords,
      widget.metric || 'revenue',
      widget.aggregation || 'sum',
      widget.skipBlanks ?? false
    );
  }, [filteredRecords, widget]);

  // Trend % comparison for KPI (comparing recent vs earlier records, or partitioned by trendCompareColumn)
  const trendInfo = React.useMemo(() => {
    if (widget.type !== 'kpi' || filteredRecords.length < 2) return null;
    
    let olderRecords: SalesRecord[] = [];
    let newerRecords: SalesRecord[] = [];
    const compCol = widget.trendCompareColumn;

    if (compCol && filteredRecords.some((r: any) => r[compCol] !== undefined)) {
      const sorted = [...filteredRecords].sort((a: any, b: any) => {
        const valA = String(a[compCol] || '');
        const valB = String(b[compCol] || '');
        return valA.localeCompare(valB);
      });
      const half = Math.floor(sorted.length / 2);
      olderRecords = sorted.slice(0, half);
      newerRecords = sorted.slice(half);
    } else {
      const half = Math.floor(filteredRecords.length / 2);
      olderRecords = filteredRecords.slice(0, half);
      newerRecords = filteredRecords.slice(half);
    }

    const olderVal = calculateMetricValue(
      olderRecords,
      widget.metric || 'revenue',
      widget.aggregation || 'sum',
      widget.skipBlanks ?? false
    );
    const newerVal = calculateMetricValue(
      newerRecords,
      widget.metric || 'revenue',
      widget.aggregation || 'sum',
      widget.skipBlanks ?? false
    );
    const diff = newerVal - olderVal;
    if (olderVal === 0) return { pct: 0, diff, isUp: diff >= 0 };
    const pct = ((newerVal - olderVal) / Math.abs(olderVal)) * 100;
    return {
      pct: parseFloat(pct.toFixed(1)),
      diff: diff,
      isUp: pct >= 0,
    };
  }, [widget, filteredRecords]);

  // Evaluate conditional color rules for KPI & visual
  const matchedConditionalColor = React.useMemo(() => {
    if (!widget.conditionalRules || widget.conditionalRules.length === 0) return null;
    for (const rule of widget.conditionalRules) {
      if (rule.operator === 'greater' && kpiValue > rule.value) return rule.color;
      if (rule.operator === 'greater_equal' && kpiValue >= rule.value) return rule.color;
      if (rule.operator === 'less' && kpiValue < rule.value) return rule.color;
      if (rule.operator === 'less_equal' && kpiValue <= rule.value) return rule.color;
      if (rule.operator === 'equals' && kpiValue === rule.value) return rule.color;
    }
    return null;
  }, [widget.conditionalRules, kpiValue]);

  if (widget.hidden) return null;

  // Formatting helper
  const formatVal = (val: number) => {
    const decimals = widget.decimals ?? 0;
    const formattedNum = val.toLocaleString('th-TH', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    if (widget.numberFormat === 'currency') {
      return `${formattedNum} ฿`;
    }
    if (widget.numberFormat === 'percent') {
      return `${formattedNum}%`;
    }
    return formattedNum;
  };

  // Card style calculations
  const isShape = widget.type.startsWith('shape_');
  const isTransparent = widget.transparentBg === true;
  const cardOpacity = (widget.cardOpacity ?? 100) / 100;
  const customBg = widget.cardBgColor || (themeStyles ? themeStyles.cardBg : '#ffffff');
  const customBorder = widget.cardBorderColor || (themeStyles ? themeStyles.cardBorder : '#e2e8f0');
  const borderWidth = widget.cardBorderWidth ?? 1;
  const borderStyle = widget.cardBorderStyle || 'solid';
  const borderRadius =
    widget.cardBorderRadius !== undefined ? `${widget.cardBorderRadius}px` : '12px';

  const cardStyle: React.CSSProperties = isShape
    ? {
        backgroundColor: 'transparent',
        borderColor: isSelected ? '#3b82f6' : 'transparent',
        borderWidth: isSelected ? '1px' : '0px',
        borderStyle: isSelected ? 'dashed' : 'none',
        borderRadius: '0px',
        opacity: cardOpacity,
        padding: 0,
        boxShadow: 'none',
        height: '100%',
      }
    : isTransparent
    ? {
        backgroundColor: 'transparent',
        borderColor: isSelected ? '#3b82f6' : 'transparent',
        borderWidth: isSelected ? '2px' : '1px',
        borderStyle: isSelected ? 'dashed' : 'solid',
        borderRadius: borderRadius,
        opacity: cardOpacity,
        height: '100%',
      }
    : {
        backgroundColor: customBg,
        borderColor: isSelected ? '#3b82f6' : customBorder,
        borderWidth: `${isSelected ? 2 : borderWidth}px`,
        borderStyle: borderStyle,
        borderRadius: borderRadius,
        opacity: cardOpacity,
        height: '100%',
      };

  // Aggregation label in Thai
  const getAggLabel = () => {
    switch (widget.aggregation) {
      case 'count_distinct':
        return 'นับค่าไม่ซ้ำ (DISTINCT COUNT)';
      case 'count':
        return 'นับจำนวนทั้งหมด';
      case 'avg':
        return 'ค่าเฉลี่ย';
      case 'min':
        return 'ค่าน้อยสุด';
      case 'max':
        return 'ค่ามากสุด';
      case 'median':
        return 'ค่ามัธยฐาน';
      case 'sum':
      default:
        return 'ผลรวม';
    }
  };

  // Cross-filter & Drill Down click handler
  const handleItemClick = (entryName: string) => {
    if (widget.drillDownEnabled) {
      const levels =
        widget.drillLevels && widget.drillLevels.length > 0
          ? widget.drillLevels
          : ['region', 'category', 'product'];
      const currentLevel = widget.currentDrillLevel || 0;
      if (currentLevel < levels.length - 1) {
        const currentDim = levels[currentLevel];
        const nextFilters = [
          ...(widget.drillFilters || []),
          { dimension: currentDim, value: String(entryName) },
        ];
        onUpdateWidget?.(widget.id, {
          currentDrillLevel: currentLevel + 1,
          drillFilters: nextFilters,
        });
        return;
      }
    }
    const dim = widget.dimension || 'category';
    onCrossFilter(dim, entryName);
  };

  const handleDrillBack = () => {
    if (!widget.drillDownEnabled) return;
    const currentLevel = widget.currentDrillLevel || 0;
    if (currentLevel <= 0) return;
    const prevFilters = (widget.drillFilters || []).slice(0, currentLevel - 1);
    onUpdateWidget?.(widget.id, {
      currentDrillLevel: currentLevel - 1,
      drillFilters: prevFilters,
    });
  };

  const handleDrillReset = () => {
    onUpdateWidget?.(widget.id, {
      currentDrillLevel: 0,
      drillFilters: [],
    });
  };

  const handleCornerRadiusChange = (radius: number) => {
    if (onUpdateWidget) {
      onUpdateWidget(widget.id, { cardBorderRadius: radius });
    }
  };

  const [dragDims, setDragDims] = useState<{ w: number; h: number; pxW?: number; pxH?: number } | null>(null);

  // Interactive mouse drag resize for corners and sides (Office / Power BI style) - supports all 8 directions!
  const startDragResize = (
    e: React.MouseEvent,
    direction: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingHandle(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialW = widget.w || 6;
    const initialH = widget.h || 4;
    const cardEl = cardRef.current;
    const currentRect = cardEl?.getBoundingClientRect();
    const initialPixelW = widget.customWidth || currentRect?.width || 320;
    const initialPixelH = widget.customHeight || currentRect?.height || 160;
    const initialPosX = widget.x || 0;
    const initialPosY = widget.y || 0;

    const containerWidth = cardEl?.parentElement?.clientWidth || 1200;
    const colWidth = Math.max(20, containerWidth / 12);
    const rowHeight = 45;

    const onMouseMove = (moveEvt: MouseEvent) => {
      const deltaX = moveEvt.clientX - startX;
      const deltaY = moveEvt.clientY - startY;

      let nextPixelW = initialPixelW;
      let nextPixelH = initialPixelH;
      let nextPosX = initialPosX;
      let nextPosY = initialPosY;

      // Horizontal width adjustment (right edges grow with +deltaX, left edges grow with -deltaX)
      if (direction === 'se' || direction === 'e' || direction === 'ne') {
        nextPixelW = Math.max(60, initialPixelW + deltaX);
      } else if (direction === 'sw' || direction === 'w' || direction === 'nw') {
        nextPixelW = Math.max(60, initialPixelW - deltaX);
        if (isFreeform) {
          nextPosX = initialPosX + deltaX;
        }
      }

      // Vertical height adjustment (bottom edges grow with +deltaY, top edges grow with -deltaY)
      if (direction === 'se' || direction === 'sw' || direction === 's') {
        nextPixelH = Math.max(40, initialPixelH + deltaY);
      } else if (direction === 'nw' || direction === 'ne' || direction === 'n') {
        nextPixelH = Math.max(40, initialPixelH - deltaY);
        if (isFreeform) {
          nextPosY = initialPosY + deltaY;
        }
      }

      const nextW = Math.max(1, Math.min(12, Math.round(nextPixelW / colWidth)));
      const nextH = Math.max(1, Math.min(24, Math.round(nextPixelH / rowHeight)));

      setDragDims({
        w: nextW,
        h: nextH,
        pxW: Math.round(nextPixelW),
        pxH: Math.round(nextPixelH),
      });

      if (onUpdateWidget) {
        onUpdateWidget(widget.id, {
          customWidth: Math.round(nextPixelW),
          customHeight: Math.round(nextPixelH),
          w: nextW,
          h: nextH,
          ...(isFreeform
            ? {
                x: Math.max(0, Math.round(nextPosX)),
                y: Math.max(0, Math.round(nextPosY)),
              }
            : {}),
        });
      }
    };

    const onMouseUp = () => {
      setIsDraggingHandle(false);
      setDragDims(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Render Inner Content by Widget Type
  const renderContent = () => {
    // 1. Shapes
    if (widget.type.startsWith('shape_')) {
      return <ShapeWidget widget={widget} isSelected={isSelected} />;
    }

    // 2. KPI Cards
    if (widget.type === 'kpi') {
      const trendPct = trendInfo?.pct ?? 0;
      const isUp = trendInfo?.isUp ?? true;
      const hasTrend = widget.showTrend !== false && trendInfo !== null;
      const kpiColor = matchedConditionalColor || (widget.color ? widget.color : undefined);

      return (
        <div className="flex flex-col justify-center h-full min-h-full py-2">
          <div className="flex items-center justify-between gap-1.5 text-xs font-medium opacity-70">
            <span>{getAggLabel()}</span>
            {widget.showRowCount && (
              <span className="text-[10px] bg-slate-200/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded font-mono">
                {filteredRecords.length} แถว
              </span>
            )}
          </div>
          <div
            className="text-3xl sm:text-4xl font-black tracking-tight my-1.5 flex items-baseline gap-1.5"
            style={kpiColor ? { color: kpiColor } : undefined}
          >
            {widget.prefix && <span className="text-violet-500 text-xl font-bold">{widget.prefix}</span>}
            <span>{formatVal(kpiValue)}</span>
            {widget.suffix && <span className="opacity-60 text-sm font-normal">{widget.suffix}</span>}
          </div>
          {/* Trend Indicator & Mini Sparkline Badge without 'vs' */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {hasTrend && (
              <div
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isUp
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                }`}
              >
                {isUp ? <ArrowUpRight className="w-3.5 h-3.5 shrink-0" /> : <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />}
                <span>
                  {isUp ? '+' : ''}
                  {trendPct}%
                </span>
                {trendInfo.diff !== 0 && (
                  <span className="text-[10px] opacity-80 font-mono">
                    ({isUp ? '+' : ''}{formatVal(trendInfo.diff)})
                  </span>
                )}
                {widget.trendLabel !== '' && (
                  <span className="text-[10px] font-normal opacity-75 ml-0.5">
                    {widget.trendLabel || 'เดือนก่อนหน้า'}
                  </span>
                )}
              </div>
            )}
            {widget.subtitle && (
              <div className="text-[11px] opacity-60 truncate">{widget.subtitle}</div>
            )}
          </div>
        </div>
      );
    }

    // 3. Bar / Column Charts
    if (widget.type === 'bar' || widget.type === 'column') {
      return (
        <div className="w-full h-full min-h-0 pt-0.5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 12, left: -10, bottom: 20 }}
              style={{
                transform: `scale(${((widget.chartScale ?? 100) / 100)}) translate(${widget.offsetX ?? 0}px, ${widget.offsetY ?? 0}px)`,
                transformOrigin: widget.chartAlign === 'left' ? 'left center' : widget.chartAlign === 'right' ? 'right center' : 'center center',
              }}
            >
              {widget.showGrid !== false && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#332a54' : '#e2e8f0'} />}
              {widget.showXAxis !== false && (
                <XAxis
                  dataKey="name"
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
              )}
              {widget.showYAxis !== false && (
                <YAxis
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                />
              )}
              {widget.showTooltip !== false && (
                <Tooltip
                  formatter={(val: any) => [formatVal(Number(val)), getAggLabel()]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    backgroundColor: isDark ? '#1b1633' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                />
              )}
              {widget.showLegend && <Legend />}
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                onClick={(data: any) => handleItemClick(data.name)}
                cursor="pointer"
              >
                {widget.showDataLabels && <LabelList dataKey="value" position="top" formatter={formatVal} fontSize={10} />}
                {chartData.map((entry, idx) => {
                  const isDimMatch =
                    activeCrossFilter &&
                    activeCrossFilter.column === (widget.dimension || 'category') &&
                    activeCrossFilter.value === entry.name;
                  const isAnyCrossFilter = !!activeCrossFilter;
                  const opacity = isAnyCrossFilter ? (isDimMatch ? 1 : 0.35) : 1;
                  return (
                    <Cell
                      key={`bar-cell-${idx}`}
                      fill={entry.color || currentPalette[idx % currentPalette.length]}
                      opacity={opacity}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // 4. Line Chart
    if (widget.type === 'line') {
      return (
        <div className="w-full h-full min-h-0 pt-0.5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 12, left: -10, bottom: 20 }}
              style={{
                transform: `scale(${((widget.chartScale ?? 100) / 100)}) translate(${widget.offsetX ?? 0}px, ${widget.offsetY ?? 0}px)`,
                transformOrigin: widget.chartAlign === 'left' ? 'left center' : widget.chartAlign === 'right' ? 'right center' : 'center center',
              }}
            >
              {widget.showGrid !== false && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#332a54' : '#e2e8f0'} />}
              {widget.showXAxis !== false && (
                <XAxis
                  dataKey="name"
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
              )}
              {widget.showYAxis !== false && (
                <YAxis
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                />
              )}
              {widget.showTooltip !== false && (
                <Tooltip
                  formatter={(val: any) => [formatVal(Number(val)), getAggLabel()]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    backgroundColor: isDark ? '#1b1633' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                />
              )}
              {widget.showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey="value"
                stroke={currentPalette[0] || '#8b5cf6'}
                strokeWidth={3}
                dot={{ r: 4, fill: currentPalette[0] || '#8b5cf6' }}
                activeDot={{ r: 6 }}
              >
                {widget.showDataLabels && <LabelList dataKey="value" position="top" formatter={formatVal} fontSize={10} />}
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // 5. Area Chart
    if (widget.type === 'area') {
      return (
        <div className="w-full h-full min-h-0 pt-0.5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 12, right: 12, left: -10, bottom: 20 }}
              style={{
                transform: `scale(${((widget.chartScale ?? 100) / 100)}) translate(${widget.offsetX ?? 0}px, ${widget.offsetY ?? 0}px)`,
                transformOrigin: widget.chartAlign === 'left' ? 'left center' : widget.chartAlign === 'right' ? 'right center' : 'center center',
              }}
            >
              {widget.showGrid !== false && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#332a54' : '#e2e8f0'} />}
              {widget.showXAxis !== false && (
                <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} axisLine={false} />
              )}
              {widget.showYAxis !== false && (
                <YAxis
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                />
              )}
              {widget.showTooltip !== false && (
                <Tooltip
                  formatter={(val: any) => [formatVal(Number(val)), getAggLabel()]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    backgroundColor: isDark ? '#1b1633' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                />
              )}
              {widget.showLegend && <Legend />}
              <defs>
                <linearGradient id={`grad-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentPalette[0] || '#8b5cf6'} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={currentPalette[0] || '#8b5cf6'} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={currentPalette[0] || '#8b5cf6'}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#grad-${widget.id})`}
              >
                {widget.showDataLabels && <LabelList dataKey="value" position="top" formatter={formatVal} fontSize={10} />}
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // 6. Pie / Donut
    if (widget.type === 'pie' || widget.type === 'donut') {
      const isDonut = widget.type === 'donut';
      return (
        <div className="w-full h-full min-h-0 pt-0.5">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart
              style={{
                transform: `scale(${((widget.chartScale ?? 100) / 100)}) translate(${widget.offsetX ?? 0}px, ${widget.offsetY ?? 0}px)`,
                transformOrigin: widget.chartAlign === 'left' ? 'left center' : widget.chartAlign === 'right' ? 'right center' : 'center center',
              }}
            >
              <Tooltip
                formatter={(val: any) => [formatVal(Number(val)), getAggLabel()]}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  backgroundColor: isDark ? '#1b1633' : '#ffffff',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
              {widget.showLegend && <Legend />}
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={isDonut ? '52%' : 0}
                outerRadius="78%"
                paddingAngle={isDonut ? 3 : 0}
                onClick={(data: any) => handleItemClick(data.name)}
                cursor="pointer"
              >
                {widget.showDataLabels && (
                  <LabelList
                    dataKey="name"
                    position="outside"
                    fontSize={11}
                    formatter={(name: any) => `${name}`}
                  />
                )}
                {chartData.map((entry, idx) => {
                  const isDimMatch =
                    activeCrossFilter &&
                    activeCrossFilter.column === (widget.dimension || 'category') &&
                    activeCrossFilter.value === entry.name;
                  const isAnyCrossFilter = !!activeCrossFilter;
                  const opacity = isAnyCrossFilter ? (isDimMatch ? 1 : 0.35) : 1;
                  return (
                    <Cell
                      key={`pie-cell-${idx}`}
                      fill={entry.color || currentPalette[idx % currentPalette.length]}
                      opacity={opacity}
                    />
                  );
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // 7. Table View
    if (widget.type === 'table') {
      return (
        <div className="w-full h-full overflow-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/40 opacity-70">
                <th className="py-2 px-3 font-semibold">{widget.dimension || 'หมวดหมู่'}</th>
                <th className="py-2 px-3 font-semibold text-right">{getAggLabel()}</th>
                <th className="py-2 px-3 font-semibold text-right">จำนวนแถว</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => handleItemClick(row.name)}
                  className="border-b border-slate-200/20 hover:bg-violet-500/10 cursor-pointer transition"
                >
                  <td className="py-2 px-3 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: row.color || currentPalette[idx % currentPalette.length] }}
                    ></span>
                    <span>{row.name}</span>
                  </td>
                  <td className="py-2 px-3 text-right font-medium">{formatVal(row.value)}</td>
                  <td className="py-2 px-3 text-right opacity-60">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Fallback simple view
    return (
      <div className="flex items-center justify-center h-full text-xs opacity-60">
        วิชวล: {widget.title} ({widget.type})
      </div>
    );
  };

  return (
    <div
      ref={cardRef}
      id={`widget-${widget.id}`}
      data-widget-id={widget.id}
      onClick={(e) => {
        if (isPreviewMode) return;
        e.stopPropagation();
        onSelect(widget.id);
      }}
      style={cardStyle}
      className={`group relative transition-all duration-150 select-none w-full h-full flex flex-col justify-between ${
        isPreviewMode ? 'cursor-default' : 'cursor-pointer'
      } ${
        isShape ? 'p-0 overflow-visible' : 'p-4 overflow-hidden'
      } ${
        isTransparent || isShape ? '' : 'shadow-2xs hover:shadow-md'
      } ${
        isSelected && !isPreviewMode
          ? isShape
            ? 'ring-1 ring-blue-500/70'
            : 'ring-2 ring-blue-500/50 shadow-lg'
          : isShape
          ? ''
          : isPreviewMode
          ? ''
          : 'hover:border-slate-400'
      } ${isDraggingHandle ? 'select-none pointer-events-auto' : ''}`}
    >
      {/* Live drag dimension tooltip */}
      {isDraggingHandle && !isPreviewMode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#0f172a]/95 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xl backdrop-blur-md border border-blue-400 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>📐 {dragDims?.pxW ?? widget.customWidth ?? 300}px × {dragDims?.pxH ?? widget.customHeight ?? 160}px</span>
          <span className="text-blue-400">•</span>
          <span>({dragDims?.w ?? widget.w ?? 6}/12 คอลัมน์, {dragDims?.h ?? widget.h ?? 4} แถว)</span>
        </div>
      )}

      {/* Selection Control Handles (Google Studio / Excel / PowerPoint Style: All 8 Handles!) */}
      {isSelected && !isPreviewMode && (
        <>
          {/* 1. Top-Left Corner Drag Handle */}
          <div
            onMouseDown={(e) => startDragResize(e, 'nw')}
            title="ลากมุมบนซ้ายเพื่อปรับขนาด"
            className="absolute -top-2 -left-2 w-4 h-4 bg-blue-600 hover:bg-blue-500 border-2 border-white rounded-xs z-40 shadow-md cursor-nwse-resize hover:scale-125 transition flex items-center justify-center text-white"
          />

          {/* 2. Top Edge Drag Handle */}
          <div
            onMouseDown={(e) => startDragResize(e, 'n')}
            title="ลากขอบบนเพื่อปรับความสูง"
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-blue-500 hover:bg-blue-600 border border-white rounded-xs z-40 shadow-sm cursor-ns-resize flex items-center justify-center transition hover:scale-110"
          >
            <div className="h-0.5 w-3 bg-white/80 rounded-full"></div>
          </div>

          {/* 3. Top-Right Corner Drag Handle */}
          <div
            onMouseDown={(e) => startDragResize(e, 'ne')}
            title="ลากมุมบนขวาเพื่อปรับขนาด"
            className="absolute -top-2 -right-2 w-4 h-4 bg-blue-600 hover:bg-blue-500 border-2 border-white rounded-xs z-40 shadow-md cursor-nesw-resize hover:scale-125 transition flex items-center justify-center text-white"
          />

          {/* 4. Right Edge Drag Handle */}
          <div
            onMouseDown={(e) => startDragResize(e, 'e')}
            title="ลากขอบข้างขวาเพื่อปรับความกว้าง"
            className="absolute top-1/2 -translate-y-1/2 -right-2 w-3.5 h-8 bg-blue-500 hover:bg-blue-600 border border-white rounded-xs z-40 shadow-sm cursor-ew-resize flex items-center justify-center transition hover:scale-110"
          >
            <div className="w-0.5 h-3 bg-white/80 rounded-full"></div>
          </div>

          {/* 5. Bottom-Right Corner Drag Handle */}
          <div
            onMouseDown={(e) => startDragResize(e, 'se')}
            title="ลากมุมล่างขวาเพื่อปรับขนาด"
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-600 hover:bg-blue-700 border-2 border-white rounded-xs z-40 shadow-md cursor-nwse-resize hover:scale-125 transition flex items-center justify-center text-white"
          >
            <CornerDownRight className="w-2.5 h-2.5" />
          </div>

          {/* 6. Bottom Edge Drag Handle */}
          <div
            onMouseDown={(e) => startDragResize(e, 's')}
            title="ลากขอบล่างเพื่อปรับความสูง"
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-blue-500 hover:bg-blue-600 border border-white rounded-xs z-40 shadow-sm cursor-ns-resize flex items-center justify-center transition hover:scale-110"
          >
            <div className="h-0.5 w-3 bg-white/80 rounded-full"></div>
          </div>

          {/* 7. Bottom-Left Corner Drag Handle */}
          <div
            onMouseDown={(e) => startDragResize(e, 'sw')}
            title="ลากมุมล่างซ้ายเพื่อปรับขนาด"
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-600 hover:bg-blue-700 border border-white rounded-xs z-40 shadow-md cursor-nesw-resize hover:scale-110 transition"
          />

          {/* 8. Left Edge Drag Handle */}
          <div
            onMouseDown={(e) => startDragResize(e, 'w')}
            title="ลากขอบซ้ายเพื่อปรับความกว้าง"
            className="absolute top-1/2 -translate-y-1/2 -left-2 w-3.5 h-8 bg-blue-500 hover:bg-blue-600 border border-white rounded-xs z-40 shadow-sm cursor-ew-resize flex items-center justify-center transition hover:scale-110"
          >
            <div className="w-0.5 h-3 bg-white/80 rounded-full"></div>
          </div>
        </>
      )}

      {/* Floating Quick Action Bar when Selected */}
      {isSelected && !isPreviewMode && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-11 left-1/2 -translate-x-1/2 z-40 bg-[#16122c] border border-violet-500/60 rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-xs text-white shadow-xl backdrop-blur-md animate-in fade-in duration-100 whitespace-nowrap"
        >
          {/* Quick Width +/- */}
          <div className="flex items-center gap-0.5 bg-[#261f49] px-1.5 py-0.5 rounded">
            <span className="text-[10px] text-slate-400">กว้าง:</span>
            <button
              onClick={() => onResize(widget.id, -1, 0)}
              title="ลดความกว้าง (-1 คอลัมน์)"
              disabled={(widget.w || 6) <= 1}
              className="p-0.5 hover:text-violet-300 disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <span className="font-bold text-violet-300 text-[10px] px-0.5 font-mono">
              {widget.w || 6}/12
            </span>
            <button
              onClick={() => onResize(widget.id, 1, 0)}
              title="เพิ่มความกว้าง (+1 คอลัมน์)"
              disabled={(widget.w || 6) >= 12}
              className="p-0.5 hover:text-violet-300 disabled:opacity-30 cursor-pointer"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Quick Height +/- */}
          <div className="flex items-center gap-0.5 bg-[#261f49] px-1.5 py-0.5 rounded">
            <span className="text-[10px] text-slate-400">สูง:</span>
            <button
              onClick={() => {
                if (widget.customHeight) {
                  const newH = Math.max(40, widget.customHeight - 30);
                  onUpdateWidget?.(widget.id, {
                    customHeight: newH,
                    h: Math.max(1, Math.round(newH / 45)),
                  });
                } else {
                  onResize(widget.id, 0, -1);
                }
              }}
              title="ลดความสูง (ย่อให้เล็กลง)"
              className="p-0.5 hover:text-violet-300 cursor-pointer"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <span className="font-bold text-violet-300 text-[10px] px-0.5 font-mono">
              {widget.customHeight ? `${widget.customHeight}px` : `${widget.h || 4} แถว`}
            </span>
            <button
              onClick={() => {
                if (widget.customHeight) {
                  const newH = widget.customHeight + 30;
                  onUpdateWidget?.(widget.id, {
                    customHeight: newH,
                    h: Math.min(24, Math.round(newH / 45)),
                  });
                } else {
                  onResize(widget.id, 0, 1);
                }
              }}
              title="เพิ่มความสูง (ขยายให้สูงขึ้น)"
              className="p-0.5 hover:text-violet-300 cursor-pointer"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Layering Controls (Bring to Front / Send to Back) */}
          {isFreeform && (
            <div className="flex items-center gap-0.5 bg-[#261f49] px-1 py-0.5 rounded">
              <button
                onClick={() => onBringForward?.(widget.id)}
                title="นำการ์ดขึ้นมาอยู่ข้างหน้าสุด (ทับการ์ดอื่น)"
                className="p-0.5 hover:text-cyan-300 transition cursor-pointer flex items-center gap-0.5 text-[10px]"
              >
                <ArrowUp className="w-3 h-3 text-cyan-400" />
                <span>หน้า</span>
              </button>
              <span className="w-[1px] h-2.5 bg-violet-700"></span>
              <button
                onClick={() => onSendBackward?.(widget.id)}
                title="ส่งการ์ดไปข้างหลัง (อยู่ใต้การ์ดอื่น)"
                className="p-0.5 hover:text-amber-300 transition cursor-pointer flex items-center gap-0.5 text-[10px]"
              >
                <ArrowDown className="w-3 h-3 text-amber-400" />
                <span>หลัง</span>
              </button>
            </div>
          )}

          {/* Quick Shift left/right */}
          {onMoveWidget && !isFreeform && (
            <div className="flex items-center gap-0.5 bg-[#261f49] px-1 py-0.5 rounded">
              <button
                onClick={() => onMoveWidget(widget.id, -1)}
                title="เลื่อนไปตำแหน่งก่อนหน้า"
                className="p-0.5 hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => onMoveWidget(widget.id, 1)}
                title="เลื่อนไปตำแหน่งถัดไป"
                className="p-0.5 hover:text-white transition cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {!isShape && (
            <>
              <span className="w-[1px] h-3 bg-violet-700"></span>
              {/* Show / Hide Title Bar Button */}
              <button
                onClick={() =>
                  onUpdateWidget &&
                  onUpdateWidget(widget.id, {
                    showTitle: widget.showTitle === false ? true : false,
                  })
                }
                title={widget.showTitle === false ? 'เปิดแสดงแถบชื่อกราฟ' : 'ซ่อนแถบชื่อกราฟ'}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                  widget.showTitle === false
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-[#261f49] hover:bg-[#342b61] text-slate-300'
                }`}
              >
                {widget.showTitle === false ? (
                  <EyeOff className="w-3 h-3 text-amber-400" />
                ) : (
                  <Eye className="w-3 h-3 text-emerald-400" />
                )}
                <span>{widget.showTitle === false ? 'ชื่อ: ซ่อน' : 'ชื่อ: เปิด'}</span>
              </button>
            </>
          )}

          <span className="w-[1px] h-3 bg-violet-700"></span>

          {/* Maximize & Delete */}
          <button
            onClick={() => onToggleMaximize(widget.id)}
            title="ขยายเต็ม 12 คอลัมน์"
            className="p-1 hover:text-teal-300 transition cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(widget.id)}
            title="ลบวิดเจ็ตนี้"
            className="p-1 hover:text-rose-400 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header bar of Widget: Title & Action Controls (Hidden when showTitle === false or for shapes) */}
      {widget.showTitle !== false && !isShape && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: currentPalette[0] || '#8b5cf6' }}
            ></span>
            <h3 className="text-xs font-bold truncate" title={widget.title}>
              {widget.title}
            </h3>
            {widget.locked && <Lock className="w-3 h-3 text-rose-500 shrink-0" />}
          </div>

          {/* Quick Studio action buttons [⤢] [x] (Hidden in preview mode) */}
          {!isPreviewMode && (
            <div
              className={`flex items-center gap-1 opacity-70 transition ${
                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMaximize(widget.id);
                }}
                title="ปรับขนาดเต็มความกว้าง"
                className="hover:opacity-100 p-1 rounded transition cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(widget.id);
                }}
                title="ลบวิดเจ็ต"
                className="hover:text-rose-500 p-1 rounded transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Drill Down Breadcrumbs navigation */}
      {widget.drillDownEnabled && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 mb-2 bg-violet-500/10 border border-violet-500/25 rounded-md text-[11px] text-violet-300 flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDrillBack();
            }}
            disabled={(widget.currentDrillLevel || 0) === 0}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-violet-600/30 hover:bg-violet-600/60 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed font-medium text-white transition text-[10px]"
            title="ย้อนกลับระดับก่อนหน้า"
          >
            <ChevronLeft className="w-3 h-3" />
            <span>ย้อน</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDrillReset();
            }}
            className="hover:underline font-semibold text-violet-400 cursor-pointer"
          >
            ทั้งหมด
          </button>
          {(widget.drillFilters || []).map((df, idx) => (
            <span key={idx} className="flex items-center gap-1">
              <span className="text-slate-500">/</span>
              <span className="font-semibold text-white bg-violet-500/20 px-1 rounded">{df.value}</span>
            </span>
          ))}
          <span className="ml-auto text-[10px] text-violet-300/80 font-mono">
            ระดับ: {(widget.drillLevels || ['region', 'category', 'product'])[widget.currentDrillLevel || 0]}
          </span>
        </div>
      )}

      {/* Widget Content Body */}
      <div className={isShape || widget.showTitle === false ? 'w-full h-full flex-1 min-h-0' : 'flex-1 min-h-0 w-full'}>
        {renderContent()}
      </div>
    </div>
  );
};
