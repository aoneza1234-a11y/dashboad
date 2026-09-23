import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Plus,
  Sparkles,
  Layers,
  Shapes,
  Maximize2,
  Minimize2,
  Trash2,
  BarChart2,
  X,
  GripVertical,
  Move,
  Grid,
  Lock,
  Unlock,
  Copy,
  ArrowUpToLine,
  ArrowDownToLine,
  Magnet,
  Compass,
} from 'lucide-react';
import { VisualWidget, SalesRecord, FilterState, VisualType } from '../types';
import { DynamicWidgetCard } from './DynamicWidgetCard';
import { InlineFilterBar } from './InlineFilterBar';
import { ThemeStyles } from '../utils/themeStyles';

interface CanvasProps {
  widgets: VisualWidget[];
  selectedWidgetId: string | null;
  onSelectWidget: (id: string) => void;
  onDeleteWidget: (id: string) => void;
  onUpdateWidget: (id: string, partial: Partial<VisualWidget>) => void;
  onResizeWidget: (id: string, deltaW: number, deltaH: number) => void;
  onToggleMaximizeWidget: (id: string) => void;
  salesData: SalesRecord[];
  allSalesData: SalesRecord[];
  filterState: FilterState;
  onUpdateFilterState: (partial: Partial<FilterState>) => void;
  onClearFilters: () => void;
  onCrossFilter: (dimension: string, value: any) => void;
  onAddVisual?: () => void;
  onAddShape?: (shapeType: VisualType) => void;
  isPreviewMode: boolean;
  spacingMode?: string;
  detectedHeaders?: string[];
  themeStyles?: ThemeStyles;
  onReorderWidgets?: (widgets: VisualWidget[]) => void;
}

type ResizeDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface DragSession {
  type: 'move' | 'resize';
  widgetId: string;
  startX: number;
  startY: number;
  initX: number;
  initY: number;
  initW: number;
  initH: number;
  direction?: ResizeDirection;
}

export const Canvas: React.FC<CanvasProps> = ({
  widgets,
  selectedWidgetId,
  onSelectWidget,
  onDeleteWidget,
  onUpdateWidget,
  onResizeWidget,
  onToggleMaximizeWidget,
  salesData,
  allSalesData,
  filterState,
  onUpdateFilterState,
  onClearFilters,
  onCrossFilter,
  onAddVisual,
  onAddShape,
  isPreviewMode,
  spacingMode = 'ปกติ',
  detectedHeaders = [],
  themeStyles,
  onReorderWidgets,
}) => {
  const [isFloatingBarMinimized, setIsFloatingBarMinimized] = useState(false);
  const [snapMode, setSnapMode] = useState<'free' | 'snap8' | 'snap24'>('free'); // Default to 100% Freeform without forced grid lock!
  const [showGuides, setShowGuides] = useState(true);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Active Drag / Resize session state
  const [activeSession, setActiveSession] = useState<DragSession | null>(null);
  const [liveCoords, setLiveCoords] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Alignment guide lines
  const [activeGuideLines, setActiveGuideLines] = useState<{
    vertical?: number;
    horizontal?: number;
  }>({});

  // Ensure all widgets have initial pixel x, y, customWidth, customHeight in freeform layout
  useEffect(() => {
    if (widgets.length > 0) {
      const containerWidth = canvasContainerRef.current?.clientWidth || 1200;
      let curX = 24;
      let curY = 24;
      let maxRowH = 0;

      widgets.forEach((w, idx) => {
        if (
          w.x === undefined ||
          w.y === undefined ||
          !w.customWidth ||
          !w.customHeight
        ) {
          const colWidth = Math.max(100, Math.floor((containerWidth - 64) / 12));
          const width = w.customWidth || Math.round((w.w || 6) * colWidth);
          const height = w.customHeight || Math.round((w.h || 4) * 55);

          let newX = w.x ?? curX;
          let newY = w.y ?? curY;

          if (w.x === undefined || w.y === undefined) {
            if (newX + width > containerWidth - 24) {
              newX = 24;
              newY = curY + maxRowH + 20;
              maxRowH = 0;
            }
            curX = newX + width + 20;
            maxRowH = Math.max(maxRowH, height);
          }

          onUpdateWidget(w.id, {
            x: Math.max(0, Math.round(newX)),
            y: Math.max(0, Math.round(newY)),
            customWidth: Math.max(140, Math.round(width)),
            customHeight: Math.max(70, Math.round(height)),
            zIndex: w.zIndex || idx + 1,
          });
        }
      });
    }
  }, [widgets.length]);

  // Snap calculation helper based on snapMode
  const snapVal = (val: number): number => {
    if (snapMode === 'snap8') return Math.round(val / 8) * 8;
    if (snapMode === 'snap24') return Math.round(val / 24) * 24;
    return Math.round(val); // 'free' = 1px precision
  };

  // Start Moving a Widget freely
  const handleStartMove = (widgetId: string, e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    // Don't drag if clicking buttons, resize handles, inputs, selects
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('.recharts-surface') ||
      target.closest('[data-resize-handle]') ||
      target.closest('.no-drag')
    ) {
      return;
    }

    const w = widgets.find((item) => item.id === widgetId);
    if (!w || w.locked || isPreviewMode) return;

    onSelectWidget(widgetId);

    const session: DragSession = {
      type: 'move',
      widgetId,
      startX: e.clientX,
      startY: e.clientY,
      initX: w.x ?? 24,
      initY: w.y ?? 24,
      initW: w.customWidth || 400,
      initH: w.customHeight || 240,
    };

    setActiveSession(session);
    setLiveCoords({
      x: session.initX,
      y: session.initY,
      w: session.initW,
      h: session.initH,
    });

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Start Resizing a Widget in any of 8 directions
  const handleStartResize = (
    widgetId: string,
    direction: ResizeDirection,
    e: React.PointerEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const w = widgets.find((item) => item.id === widgetId);
    if (!w || w.locked || isPreviewMode) return;

    onSelectWidget(widgetId);

    const session: DragSession = {
      type: 'resize',
      widgetId,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      initX: w.x ?? 24,
      initY: w.y ?? 24,
      initW: w.customWidth || 400,
      initH: w.customHeight || 240,
    };

    setActiveSession(session);
    setLiveCoords({
      x: session.initX,
      y: session.initY,
      w: session.initW,
      h: session.initH,
    });

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Real-time pointer move handling (both Move and Resize)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeSession) return;

    const deltaX = e.clientX - activeSession.startX;
    const deltaY = e.clientY - activeSession.startY;

    if (activeSession.type === 'move') {
      let rawX = activeSession.initX + deltaX;
      let rawY = activeSession.initY + deltaY;

      // Smart alignment guides with other widgets (magnetic snap within 6px)
      let guideV: number | undefined;
      let guideH: number | undefined;

      if (showGuides) {
        const threshold = 6;
        for (const other of widgets) {
          if (other.id === activeSession.widgetId) continue;
          const otherX = other.x ?? 0;
          const otherY = other.y ?? 0;
          const otherW = other.customWidth ?? 400;
          const otherH = other.customHeight ?? 240;

          // Left align
          if (Math.abs(rawX - otherX) < threshold) {
            rawX = otherX;
            guideV = otherX;
          }
          // Right align
          else if (Math.abs(rawX + activeSession.initW - (otherX + otherW)) < threshold) {
            rawX = otherX + otherW - activeSession.initW;
            guideV = otherX + otherW;
          }
          // Top align
          if (Math.abs(rawY - otherY) < threshold) {
            rawY = otherY;
            guideH = otherY;
          }
          // Bottom align
          else if (Math.abs(rawY + activeSession.initH - (otherY + otherH)) < threshold) {
            rawY = otherY + otherH - activeSession.initH;
            guideH = otherY + otherH;
          }
        }
      }

      setActiveGuideLines({ vertical: guideV, horizontal: guideH });

      const newX = Math.max(0, snapVal(rawX));
      const newY = Math.max(0, snapVal(rawY));

      setLiveCoords({
        x: newX,
        y: newY,
        w: activeSession.initW,
        h: activeSession.initH,
      });

      onUpdateWidget(activeSession.widgetId, { x: newX, y: newY });
    } else if (activeSession.type === 'resize' && activeSession.direction) {
      let newX = activeSession.initX;
      let newY = activeSession.initY;
      let newW = activeSession.initW;
      let newH = activeSession.initH;

      const dir = activeSession.direction;

      // Horizontal resize
      if (dir.includes('e')) {
        newW = Math.max(140, snapVal(activeSession.initW + deltaX));
      } else if (dir.includes('w')) {
        const candidateW = activeSession.initW - deltaX;
        if (candidateW >= 140) {
          newW = snapVal(candidateW);
          newX = Math.max(0, snapVal(activeSession.initX + deltaX));
        }
      }

      // Vertical resize
      if (dir.includes('s')) {
        newH = Math.max(70, snapVal(activeSession.initH + deltaY));
      } else if (dir.includes('n')) {
        const candidateH = activeSession.initH - deltaY;
        if (candidateH >= 70) {
          newH = snapVal(candidateH);
          newY = Math.max(0, snapVal(activeSession.initY + deltaY));
        }
      }

      setLiveCoords({ x: newX, y: newY, w: newW, h: newH });
      onUpdateWidget(activeSession.widgetId, {
        x: newX,
        y: newY,
        customWidth: newW,
        customHeight: newH,
      });
    }
  };

  // Pointer Up finishes drag or resize session
  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeSession) {
      setActiveSession(null);
      setLiveCoords(null);
      setActiveGuideLines({});
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Bring widget to front
  const handleBringToFront = (id: string) => {
    const maxZ = widgets.reduce((max, w) => Math.max(max, w.zIndex || 1), 1);
    onUpdateWidget(id, { zIndex: maxZ + 1 });
  };

  // Send widget to back
  const handleSendToBack = (id: string) => {
    const minZ = widgets.reduce((min, w) => Math.min(min, w.zIndex || 1), 1);
    onUpdateWidget(id, { zIndex: Math.max(1, minZ - 1) });
  };

  // Duplicate a widget
  const handleDuplicateWidget = (w: VisualWidget) => {
    const newId = `widget-${Date.now()}`;
    const clone: VisualWidget = {
      ...JSON.parse(JSON.stringify(w)),
      id: newId,
      title: `${w.title} (คัดลอก)`,
      x: (w.x ?? 20) + 24,
      y: (w.y ?? 20) + 24,
      zIndex: (w.zIndex || 1) + 1,
    };
    if (onReorderWidgets) {
      onReorderWidgets([...widgets, clone]);
    } else {
      onUpdateWidget(newId, clone);
    }
    onSelectWidget(newId);
  };

  // Global Escape key deselect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSelectWidget('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectWidget]);

  // Deselect when clicking canvas background
  const handleEmptyCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-widget-id]') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('#bi-inline-filter-bar')
    ) {
      return;
    }
    onSelectWidget('');
  };

  // Draggable Floating Bar state
  const [floatingPos, setFloatingPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingFloating, setIsDraggingFloating] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 24,
    posY: 500,
  });

  const handleFloatingPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button:not(.drag-handle)')) return;
    e.preventDefault();
    setIsDraggingFloating(true);
    const rect = e.currentTarget.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: floatingPos ? floatingPos.x : rect.left,
      posY: floatingPos ? floatingPos.y : rect.top,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleFloatingPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingFloating) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    const newX = Math.max(10, Math.min(window.innerWidth - 200, dragStartRef.current.posX + deltaX));
    const newY = Math.max(10, Math.min(window.innerHeight - 60, dragStartRef.current.posY + deltaY));
    setFloatingPos({ x: newX, y: newY });
  };

  const handleFloatingPointerUp = (e: React.PointerEvent) => {
    if (isDraggingFloating) {
      setIsDraggingFloating(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Dynamic canvas min-height to allow scrolling down when dragging objects down
  const computedMinHeight = useMemo(() => {
    return Math.max(
      750,
      widgets.reduce(
        (maxY, w) => Math.max(maxY, (w.y || 0) + (w.customHeight || 200) + 140),
        700
      )
    );
  }, [widgets]);

  const canvasBackground = themeStyles ? themeStyles.canvasBg : '#f6f8fc';

  return (
    <main
      id="bi-studio-canvas"
      onClick={handleEmptyCanvasClick}
      style={{ backgroundColor: canvasBackground }}
      className="flex-1 overflow-y-auto flex flex-col relative select-none transition-colors duration-200"
    >
      {/* 1. Multi-slot dynamic inline filter bar with Column Distinct Values Dropdown */}
      <InlineFilterBar
        filterState={filterState}
        onUpdateFilterState={onUpdateFilterState}
        onClearFilters={onClearFilters}
        availableColumns={
          detectedHeaders.length > 0
            ? detectedHeaders
            : ['date', 'region', 'category', 'product', 'channel', 'revenue', 'cost', 'profit', 'quantity']
        }
        salesData={allSalesData}
        themeStyles={themeStyles}
      />

      {/* 2. Main Studio Freeform Canvas Area */}
      <div
        onClick={handleEmptyCanvasClick}
        className="flex-1 p-4 sm:p-6 w-full max-w-[1920px] mx-auto flex flex-col"
      >
        {/* Freeform Controls Toolbar */}
        {!isPreviewMode && widgets.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-violet-400 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5" />
                <span>การวางตำแหน่ง:</span>
              </span>

              {/* Snap mode toggle */}
              <div className="inline-flex rounded-xl p-0.5 bg-slate-200/80 dark:bg-[#181333] border border-slate-300/60 dark:border-violet-500/30 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSnapMode('free')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    snapMode === 'free'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-violet-500'
                  }`}
                  title="ขยับได้อย่างอิสระ 100% ไม่มีการล็อกกริด ลากวางหรือขยายได้ทุกพิกเซล"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>อิสระ 100% (No Grid Lock)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSnapMode('snap8')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    snapMode === 'snap8'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-violet-500'
                  }`}
                  title="ดูดติดเส้นเบาๆ ทุก 8px เพื่อให้การ์ดจัดแนวเสมอกันง่ายขึ้น"
                >
                  <Magnet className="w-3.5 h-3.5" />
                  <span>ชิดเบาๆ (8px)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSnapMode('snap24')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    snapMode === 'snap24'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-violet-500'
                  }`}
                  title="ชิดกริด 24px สำหรับการจัดวางที่เป็นระเบียบ"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>กริด (24px)</span>
                </button>
              </div>

              {/* Guides toggle */}
              <button
                type="button"
                onClick={() => setShowGuides((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                  showGuides
                    ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
                    : 'border-slate-400/30 text-slate-500'
                }`}
                title="เปิด-ปิดเส้นนำสายตาช่วยจัดแนว (Magnetic Smart Guides)"
              >
                <span>เส้นชิดแนว: {showGuides ? 'เปิด' : 'ปิด'}</span>
              </button>
            </div>

            {/* Quick stats HUD */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
              {liveCoords && (
                <span className="bg-violet-600 text-white px-2 py-0.5 rounded-md font-bold animate-pulse shadow-xs">
                  X: {liveCoords.x}px | Y: {liveCoords.y}px | W: {liveCoords.w}px | H: {liveCoords.h}px
                </span>
              )}
              <span className="bg-[#181333] border border-violet-500/30 text-violet-300 px-2 py-0.5 rounded-md">
                วิชวลทั้งหมด: {widgets.length} ชิ้น
              </span>
            </div>
          </div>
        )}

        {widgets.length === 0 ? (
          /* Empty Workspace State */
          <div className="flex flex-col items-center justify-center min-h-[450px] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-10 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center mb-4 shadow-xs">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              ยังไม่มีวิชวลในผืนงานสตูดิโอนี้
            </h3>
            <p className="text-xs text-slate-500 max-w-md mt-1 mb-6">
              เริ่มสร้างแดชบอร์ดโดยเพิ่มกราฟ ตัวเลข KPI ตาราง หรือรูปทรงตกแต่งตามต้องการ
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={onAddVisual}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <BarChart2 className="w-4 h-4" />
                <span>+ เพิ่มกราฟวิชวล</span>
              </button>
              {onAddShape && (
                <button
                  onClick={() => onAddShape('shape_rounded')}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Shapes className="w-4 h-4 text-violet-600" />
                  <span>+ เพิ่มรูปทรง</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* 100% Freeform Canvas Stage */
          <div
            ref={canvasContainerRef}
            onClick={handleEmptyCanvasClick}
            style={{
              minHeight: `${computedMinHeight}px`,
              backgroundImage: isPreviewMode
                ? 'none'
                : snapMode === 'snap24'
                ? 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 1.2px, transparent 1.2px)'
                : 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 1px, transparent 1px)',
              backgroundSize: snapMode === 'snap24' ? '24px 24px' : '16px 16px',
            }}
            className="relative w-full flex-1 rounded-3xl border border-dashed border-violet-500/25 p-4 transition-all overflow-hidden"
          >
            {/* Real-time Magnetic Guide Lines */}
            {activeGuideLines.vertical !== undefined && (
              <div
                style={{ left: `${activeGuideLines.vertical}px` }}
                className="absolute top-0 bottom-0 w-[1px] bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)] z-40 pointer-events-none"
              />
            )}
            {activeGuideLines.horizontal !== undefined && (
              <div
                style={{ top: `${activeGuideLines.horizontal}px` }}
                className="absolute left-0 right-0 h-[1px] bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)] z-40 pointer-events-none"
              />
            )}

            {/* Render Widgets with 8-Point Freeform Resize Handles & Drag Header */}
            {widgets.map((widget) => {
              const isSelected = selectedWidgetId === widget.id;
              const isDragging = activeSession?.widgetId === widget.id;
              const wPx = widget.customWidth || Math.round((widget.w || 6) * 90);
              const hPx = widget.customHeight || Math.round((widget.h || 4) * 55);

              return (
                <div
                  key={widget.id}
                  data-widget-id={widget.id}
                  onPointerDown={(e) => handleStartMove(widget.id, e)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  style={{
                    position: 'absolute',
                    left: `${widget.x ?? 24}px`,
                    top: `${widget.y ?? 24}px`,
                    width: `${wPx}px`,
                    height: `${hPx}px`,
                    zIndex: isSelected ? 50 : widget.zIndex || 10,
                  }}
                  className={`group transition-shadow duration-75 select-none ${
                    isDragging
                      ? 'opacity-95 shadow-2xl ring-2 ring-violet-500 scale-[1.002]'
                      : isSelected && !isPreviewMode
                      ? 'ring-2 ring-violet-500/90 shadow-xl'
                      : 'hover:ring-1 hover:ring-violet-400/40'
                  }`}
                >
                  {/* Selected Card Quick Action Floating Ribbon */}
                  {isSelected && !isPreviewMode && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute -top-10 left-0 bg-[#16122c] border border-violet-500/50 rounded-lg px-2 py-1 flex items-center gap-1.5 shadow-xl text-white text-[11px] z-50 animate-in fade-in zoom-in-95 duration-100"
                    >
                      <span className="font-bold text-violet-300 mr-1 truncate max-w-[120px]">
                        {widget.title}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleBringToFront(widget.id)}
                        className="hover:text-violet-300 p-1 rounded hover:bg-white/10 cursor-pointer"
                        title="นำมาไว้หน้าสุด (Bring to Front)"
                      >
                        <ArrowUpToLine className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendToBack(widget.id)}
                        className="hover:text-violet-300 p-1 rounded hover:bg-white/10 cursor-pointer"
                        title="ส่งไปไว้หลังสุด (Send to Back)"
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onUpdateWidget(widget.id, { locked: !widget.locked })
                        }
                        className={`p-1 rounded hover:bg-white/10 cursor-pointer ${
                          widget.locked ? 'text-amber-400' : 'text-slate-300'
                        }`}
                        title={widget.locked ? 'ปลดล็อกตำแหน่ง' : 'ล็อกตำแหน่งวิชวลนี้'}
                      >
                        {widget.locked ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateWidget(widget)}
                        className="hover:text-violet-300 p-1 rounded hover:bg-white/10 cursor-pointer"
                        title="คัดลอกวิชวลนี้ (Duplicate)"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteWidget(widget.id)}
                        className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-white/10 cursor-pointer"
                        title="ลบวิชวลนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Widget Card Container */}
                  <div className="w-full h-full relative overflow-hidden rounded-2xl">
                    <DynamicWidgetCard
                      widget={widget}
                      isSelected={isSelected}
                      onSelect={onSelectWidget}
                      onDelete={onDeleteWidget}
                      onResize={onResizeWidget}
                      onToggleMaximize={onToggleMaximizeWidget}
                      onUpdateWidget={onUpdateWidget}
                      onCrossFilter={onCrossFilter}
                      activeCrossFilter={filterState.crossFilter}
                      filteredRecords={salesData}
                      allRecords={allSalesData}
                      themeStyles={themeStyles}
                      isPreviewMode={isPreviewMode}
                      isFreeform={true}
                      onBringForward={() => handleBringToFront(widget.id)}
                      onSendBackward={() => handleSendToBack(widget.id)}
                    />
                  </div>

                  {/* 8 Interactive Freeform Resize Handles (Shown when selected in edit mode) */}
                  {isSelected && !isPreviewMode && !widget.locked && (
                    <>
                      {/* Top-Left (nw) */}
                      <div
                        data-resize-handle="nw"
                        onPointerDown={(e) => handleStartResize(widget.id, 'nw', e)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-violet-600 rounded-sm cursor-nwse-resize shadow-md hover:scale-125 transition-transform z-30"
                        title="ย่อ/ขยายมุมซ้ายบน"
                      />

                      {/* Top-Center (n) */}
                      <div
                        data-resize-handle="n"
                        onPointerDown={(e) => handleStartResize(widget.id, 'n', e)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-2 bg-white border-2 border-violet-600 rounded-full cursor-ns-resize shadow-md hover:scale-125 transition-transform z-30"
                        title="ย่อ/ขยายความสูงด้านบน"
                      />

                      {/* Top-Right (ne) */}
                      <div
                        data-resize-handle="ne"
                        onPointerDown={(e) => handleStartResize(widget.id, 'ne', e)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-violet-600 rounded-sm cursor-nesw-resize shadow-md hover:scale-125 transition-transform z-30"
                        title="ย่อ/ขยายมุมขวาบน"
                      />

                      {/* Right-Center (e) */}
                      <div
                        data-resize-handle="e"
                        onPointerDown={(e) => handleStartResize(widget.id, 'e', e)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-2 h-6 bg-white border-2 border-violet-600 rounded-full cursor-ew-resize shadow-md hover:scale-125 transition-transform z-30"
                        title="ย่อ/ขยายความกว้างด้านขวา"
                      />

                      {/* Bottom-Right (se) */}
                      <div
                        data-resize-handle="se"
                        onPointerDown={(e) => handleStartResize(widget.id, 'se', e)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-violet-600 border-2 border-white rounded-sm cursor-nwse-resize shadow-lg hover:scale-125 transition-transform z-30 flex items-center justify-center text-white"
                        title="ย่อ/ขยายอิสระทุกทิศทาง"
                      />

                      {/* Bottom-Center (s) */}
                      <div
                        data-resize-handle="s"
                        onPointerDown={(e) => handleStartResize(widget.id, 's', e)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-2 bg-white border-2 border-violet-600 rounded-full cursor-ns-resize shadow-md hover:scale-125 transition-transform z-30"
                        title="ย่อ/ขยายความสูงด้านล่าง"
                      />

                      {/* Bottom-Left (sw) */}
                      <div
                        data-resize-handle="sw"
                        onPointerDown={(e) => handleStartResize(widget.id, 'sw', e)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-violet-600 rounded-sm cursor-nesw-resize shadow-md hover:scale-125 transition-transform z-30"
                        title="ย่อ/ขยายมุมซ้ายล่าง"
                      />

                      {/* Left-Center (w) */}
                      <div
                        data-resize-handle="w"
                        onPointerDown={(e) => handleStartResize(widget.id, 'w', e)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2 h-6 bg-white border-2 border-violet-600 rounded-full cursor-ew-resize shadow-md hover:scale-125 transition-transform z-30"
                        title="ย่อ/ขยายความกว้างด้านซ้าย"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Studio Quick Action Floating Bar (Draggable anywhere on screen) */}
      {!isPreviewMode && (
        <div
          style={
            floatingPos
              ? { left: `${floatingPos.x}px`, top: `${floatingPos.y}px` }
              : { bottom: '24px', left: '28px' }
          }
          className="fixed z-40 touch-none"
        >
          {isFloatingBarMinimized ? (
            <div
              onPointerDown={handleFloatingPointerDown}
              onPointerMove={handleFloatingPointerMove}
              onPointerUp={handleFloatingPointerUp}
              className="flex items-center gap-1.5 bg-[#191530]/95 hover:bg-[#251f47] text-violet-300 pl-2 pr-3 py-1.5 rounded-full border border-violet-500/50 shadow-2xl backdrop-blur-md text-xs font-medium transition cursor-move group select-none ring-1 ring-white/10"
              title="คลิกลากเพื่อย้ายตำแหน่ง • ดับเบิลคลิกเพื่อเปิด"
            >
              <span className="p-0.5 text-violet-400 opacity-60 group-hover:opacity-100 drag-handle">
                <Move className="w-3 h-3" />
              </span>
              <button
                onClick={() => setIsFloatingBarMinimized(false)}
                className="flex items-center gap-1.5 cursor-pointer font-semibold text-violet-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>+ เพิ่มวัตถุ</span>
              </button>
            </div>
          ) : (
            <div
              onPointerDown={handleFloatingPointerDown}
              onPointerMove={handleFloatingPointerMove}
              onPointerUp={handleFloatingPointerUp}
              className="flex items-center gap-2 bg-[#191530]/95 backdrop-blur-md border border-violet-500/40 pl-2 pr-3 py-1.5 rounded-full shadow-2xl text-xs text-white animate-in fade-in duration-150 select-none ring-1 ring-white/10"
            >
              <div
                className="cursor-move p-1 text-slate-400 hover:text-violet-300 drag-handle"
                title="คลิกลากเพื่อย้ายตำแหน่งแถบเครื่องมือนี้ไปตรงไหนก็ได้บนหน้าจอ"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>

              <span className="text-[11px] text-violet-300 font-medium">สตูดิโอ:</span>
              {onAddVisual && (
                <button
                  onClick={onAddVisual}
                  className="flex items-center gap-1 hover:text-violet-300 px-2 py-1 rounded-md hover:bg-white/10 transition font-medium cursor-pointer"
                  title="เพิ่มกราฟวิชวลใหม่"
                >
                  <Plus className="w-3.5 h-3.5 text-violet-400" />
                  <span>+ กราฟ</span>
                </button>
              )}

              {onAddShape && (
                <button
                  onClick={() => onAddShape('shape_rounded')}
                  className="flex items-center gap-1 hover:text-pink-300 px-2 py-1 rounded-md hover:bg-white/10 transition font-medium cursor-pointer"
                  title="เพิ่มรูปทรงกรอบมน"
                >
                  <Shapes className="w-3.5 h-3.5 text-pink-400" />
                  <span>+ รูปทรง</span>
                </button>
              )}

              {/* Quick Position Snaps */}
              <div className="flex items-center gap-1 border-l border-white/15 pl-1.5 ml-0.5">
                <button
                  onClick={() => setFloatingPos({ x: window.innerWidth - 240, y: window.innerHeight - 70 })}
                  className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 cursor-pointer"
                  title="ย้ายไปมุมขวาล่าง"
                >
                  ขวาล่าง
                </button>
                <button
                  onClick={() => setFloatingPos({ x: 28, y: 70 })}
                  className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 cursor-pointer"
                  title="ย้ายไปมุมซ้ายบน"
                >
                  ซ้ายบน
                </button>
              </div>

              <button
                onClick={() => setIsFloatingBarMinimized(true)}
                className="ml-1 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
                title="ย่อแถบเครื่องมือนี้"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
};
