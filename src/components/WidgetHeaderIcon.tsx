import React, { useState, useRef, useEffect } from 'react';
import {
  DollarSign,
  Coins,
  Wallet,
  CreditCard,
  Landmark,
  PiggyBank,
  Receipt,
  Percent,
  Calculator,
  Scale,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  ArrowUpRight,
  Briefcase,
  ShoppingCart,
  ShoppingBag,
  Target,
  Award,
  Gem,
  Building2,
  Users,
  Zap,
  Sparkles,
  ShieldCheck,
  Globe,
  Layers,
  Image as ImageIcon,
  Check,
  Palette,
  Upload,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { VisualWidget } from '../types';

export interface WidgetIconOption {
  id: string;
  name: string;
  category: 'finance' | 'growth' | 'business' | 'tech';
  component: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export const WIDGET_ICONS: WidgetIconOption[] = [
  // Finance & Money
  { id: 'dollar', name: 'การเงิน / เงินบาท', category: 'finance', component: DollarSign },
  { id: 'coins', name: 'เหรียญ / ผลตอบแทน', category: 'finance', component: Coins },
  { id: 'wallet', name: 'กระเป๋าเงิน / งบประมาณ', category: 'finance', component: Wallet },
  { id: 'credit-card', name: 'บัตรเครดิต / ชำระเงิน', category: 'finance', component: CreditCard },
  { id: 'bank', name: 'ธนาคาร / สถาบันการเงิน', category: 'finance', component: Landmark },
  { id: 'piggy-bank', name: 'การออม / กำไรสะสม', category: 'finance', component: PiggyBank },
  { id: 'receipt', name: 'ใบเสร็จ / บิลค่าใช้จ่าย', category: 'finance', component: Receipt },
  { id: 'percent', name: 'ร้อยละ / มาร์จิ้น', category: 'finance', component: Percent },
  { id: 'calculator', name: 'คำนวณ / ต้นทุน', category: 'finance', component: Calculator },
  { id: 'scale', name: 'สมดุล / งบดุล', category: 'finance', component: Scale },

  // Growth & Trends
  { id: 'trending-up', name: 'เติบโต / ขาขึ้น', category: 'growth', component: TrendingUp },
  { id: 'trending-down', name: 'ลดลง / ขาลง', category: 'growth', component: TrendingDown },
  { id: 'arrow-up-right', name: 'ผลตอบแทนบวก', category: 'growth', component: ArrowUpRight },
  { id: 'barchart', name: 'กราฟแท่งสถิติ', category: 'growth', component: BarChart3 },
  { id: 'piechart', name: 'สัดส่วนพาย', category: 'growth', component: PieChart },
  { id: 'linechart', name: 'กราฟเส้นแนวโน้ม', category: 'growth', component: LineChart },
  { id: 'activity', name: 'ความเคลื่อนไหวสด', category: 'growth', component: Activity },

  // Business & Sales
  { id: 'briefcase', name: 'ธุรกิจ / พอร์ต', category: 'business', component: Briefcase },
  { id: 'shopping-cart', name: 'ยอดสั่งซื้อ / ขาย', category: 'business', component: ShoppingCart },
  { id: 'shopping-bag', name: 'สินค้า / ออเดอร์', category: 'business', component: ShoppingBag },
  { id: 'target', name: 'เป้าหมายยอด / KPI', category: 'business', component: Target },
  { id: 'award', name: 'รางวัล / ยอดเยี่ยม', category: 'business', component: Award },
  { id: 'gem', name: 'สินทรัพย์มีค่า', category: 'business', component: Gem },
  { id: 'building', name: 'องค์กร / สำนักงาน', category: 'business', component: Building2 },
  { id: 'users', name: 'ลูกค้า / สมาชิก', category: 'business', component: Users },

  // Tech & Operations
  { id: 'zap', name: 'ประสิทธิภาพ / ด่วน', category: 'tech', component: Zap },
  { id: 'sparkles', name: 'ไฮไลต์พิเศษ', category: 'tech', component: Sparkles },
  { id: 'shield', name: 'ความปลอดภัย / คุ้มครอง', category: 'tech', component: ShieldCheck },
  { id: 'globe', name: 'ตลาดต่างประเทศ', category: 'tech', component: Globe },
  { id: 'layers', name: 'โครงสร้างข้อมูล', category: 'tech', component: Layers },
];

export const ICON_COLORS = [
  { id: 'amber', label: 'ทองคำ / การเงิน', text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.45)' },
  { id: 'emerald', label: 'เขียวมรกต / กำไร', text: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.45)' },
  { id: 'violet', label: 'ม่วงนีออน / พรีเมียม', text: '#a855f7', bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.45)' },
  { id: 'cyan', label: 'ฟ้าสดใส / ธุรกิจ', text: '#06b6d4', bg: 'rgba(6, 182, 212, 0.2)', border: 'rgba(6, 182, 212, 0.45)' },
  { id: 'rose', label: 'แดงกุหลาบ / ต้นทุน', text: '#f43f5e', bg: 'rgba(244, 63, 94, 0.2)', border: 'rgba(244, 63, 94, 0.45)' },
  { id: 'blue', label: 'น้ำเงินรอยัล / สถาบัน', text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.45)' },
  { id: 'white', label: 'ขาวมินิมอล', text: '#f8fafc', bg: 'rgba(255, 255, 255, 0.15)', border: 'rgba(255, 255, 255, 0.3)' },
];

// Curated high-res SVG financial graphics (preset images)
export interface PresetFinancialGraphic {
  id: string;
  name: string;
  label: string;
  svgDataUri: string;
}

export const PRESET_FINANCIAL_GRAPHICS: PresetFinancialGraphic[] = [
  {
    id: 'gold-coin-3d',
    name: 'เหรียญทองคำ 3D',
    label: 'เหรียญทอง',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" fill="%23f59e0b"/><circle cx="24" cy="24" r="17" fill="%23fbbf24"/><path d="M21 14h6a5 5 0 0 1 0 10h-6v-10zm0 10h7a5 5 0 0 1 0 10h-7v-10z" fill="%23b45309"/><path d="M24 10v4m0 20v4" stroke="%23b45309" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'dollar-stack',
    name: 'กองธนบัตรดอลลาร์',
    label: 'ธนบัตรสด',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="6" y="14" width="36" height="22" rx="4" fill="%2310b981"/><circle cx="24" cy="25" r="6" fill="%23047857"/><path d="M24 21v8m-2-6h3a1 1 0 0 1 0 2h-2a1 1 0 0 0 0 2h3" stroke="%23ecfdf5" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="18" r="1.5" fill="%23a7f3d0"/><circle cx="38" cy="32" r="1.5" fill="%23a7f3d0"/></svg>`,
  },
  {
    id: 'profit-growth-chart',
    name: 'กราฟกำไรพุ่งสูง',
    label: 'กำไรพุ่ง',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="10" fill="%23064e3b"/><path d="M10 34l10-10 7 7 13-15" fill="none" stroke="%2334d399" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 16h10v10" fill="none" stroke="%2334d399" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="16" r="3" fill="%23fbbf24"/></svg>`,
  },
  {
    id: 'safe-vault',
    name: 'ตู้นิรภัยสินทรัพย์',
    label: 'ตู้นิรภัย',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="8" fill="%231e1b4b"/><rect x="10" y="10" width="28" height="28" rx="6" fill="%23312e81"/><circle cx="24" cy="24" r="8" fill="%236366f1"/><circle cx="24" cy="24" r="4" fill="%23fbbf24"/><path d="M24 16v4m0 8v4m-8-8h4m8 0h4" stroke="%23e0e7ff" stroke-width="2" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'thai-baht',
    name: 'ตราสัญลักษณ์เงินบาท ฿',
    label: 'เงินบาท ฿',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="%234338ca"/><circle cx="24" cy="24" r="16" fill="%234f46e5"/><text x="24" y="32" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="%23fbbf24" text-anchor="middle">฿</text></svg>`,
  },
  {
    id: 'crypto-gem',
    name: 'อัญมณีสินทรัพย์ดิจิทัล',
    label: 'อัญมณี',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M12 16l12-10 12 10-12 26z" fill="%238b5cf6"/><path d="M24 6l12 10-12 26z" fill="%237c3aed"/><path d="M12 16h24L24 42z" fill="%23a78bfa" opacity="0.6"/><path d="M24 6v36" stroke="%23ede9fe" stroke-width="1.5"/></svg>`,
  },
  {
    id: 'piggy-savings',
    name: 'กระปุกออมสินกำไร',
    label: 'เงินออม',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><ellipse cx="23" cy="26" rx="15" ry="12" fill="%23f43f5e"/><circle cx="36" cy="26" r="5" fill="%23fb7185"/><circle cx="38" cy="24" r="1" fill="%23881337"/><circle cx="38" cy="28" r="1" fill="%23881337"/><rect x="18" y="12" width="10" height="3" rx="1.5" fill="%23fbbf24"/><circle cx="16" cy="22" r="1.5" fill="%23fff"/></svg>`,
  },
  {
    id: 'target-kpi',
    name: 'เป้าหมาย KPI สำเร็จ',
    label: 'เป้าหมาย KPI',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="%23ef4444"/><circle cx="24" cy="24" r="14" fill="%23ffffff"/><circle cx="24" cy="24" r="8" fill="%23ef4444"/><circle cx="24" cy="24" r="3" fill="%23fbbf24"/><path d="M34 14l8-8" stroke="%23fbbf24" stroke-width="3" stroke-linecap="round"/></svg>`,
  },
];

// Helper to render widget icon or image
export function renderWidgetHeaderIcon(
  widget: VisualWidget,
  sizeClass: string = 'w-4 h-4'
): React.ReactNode {
  if (widget.showHeaderIcon === false) return null;

  // Custom Image URL / Data URI
  if (widget.headerIconType === 'image' && widget.headerImageUrl) {
    return (
      <img
        src={widget.headerImageUrl}
        alt={widget.title}
        className={`${sizeClass} object-contain rounded-md filter drop-shadow-sm select-none`}
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  const iconId = widget.headerIcon || getDefaultIconForWidget(widget);
  const matched = WIDGET_ICONS.find((i) => i.id === iconId);
  if (matched) {
    const IconComponent = matched.component;
    return <IconComponent className={sizeClass} />;
  }

  // Fallback icon based on widget type
  if (widget.type === 'kpi' || widget.metric === 'revenue' || widget.metric === 'profit') {
    return <DollarSign className={sizeClass} />;
  }
  return <BarChart3 className={sizeClass} />;
}

export function getDefaultIconForWidget(widget: VisualWidget): string {
  if (widget.headerIcon) return widget.headerIcon;
  const m = (widget.metric || '').toLowerCase();
  const t = (widget.title || '').toLowerCase();

  if (m.includes('profit') || t.includes('กำไร') || t.includes('profit')) return 'coins';
  if (m.includes('revenue') || m.includes('sales') || t.includes('ยอดขาย') || t.includes('sales') || t.includes('รายได้')) return 'dollar';
  if (m.includes('cost') || t.includes('ต้นทุน')) return 'calculator';
  if (m.includes('growth') || t.includes('เติบโต') || t.includes('trend')) return 'trending-up';
  if (widget.type === 'pie' || widget.type === 'donut') return 'piechart';
  if (widget.type === 'line' || widget.type === 'area') return 'activity';
  return 'barchart';
}

interface WidgetHeaderIconBadgeProps {
  widget: VisualWidget;
  onUpdateWidget?: (id: string, partial: Partial<VisualWidget>) => void;
  isPreviewMode?: boolean;
}

export const WidgetHeaderIconBadge: React.FC<WidgetHeaderIconBadgeProps> = ({
  widget,
  onUpdateWidget,
  isPreviewMode = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'graphics' | 'icons' | 'url'>('graphics');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customImageUrl, setCustomImageUrl] = useState(widget.headerImageUrl || '');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Color scheme
  const currentColor =
    ICON_COLORS.find((c) => c.text === widget.headerIconColor) ||
    ICON_COLORS.find((c) => c.id === 'amber') ||
    ICON_COLORS[0];

  const handleSelectIcon = (iconId: string) => {
    if (onUpdateWidget) {
      onUpdateWidget(widget.id, {
        headerIcon: iconId,
        headerIconType: 'icon',
        showHeaderIcon: true,
      });
    }
    setIsOpen(false);
  };

  const handleSelectPresetGraphic = (graphic: PresetFinancialGraphic) => {
    if (onUpdateWidget) {
      onUpdateWidget(widget.id, {
        headerImageUrl: graphic.svgDataUri,
        headerIconType: 'image',
        showHeaderIcon: true,
      });
    }
    setIsOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('ขนาดไฟล์ต้องไม่เกิน 2MB');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      const dataUri = uploadEvt.target?.result as string;
      if (dataUri && onUpdateWidget) {
        onUpdateWidget(widget.id, {
          headerImageUrl: dataUri,
          headerIconType: 'image',
          showHeaderIcon: true,
        });
        setIsOpen(false);
      }
    };
    reader.onerror = () => {
      setUploadError('ไม่สามารถอ่านไฟล์ได้');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomImageUrl = () => {
    if (onUpdateWidget && customImageUrl.trim()) {
      onUpdateWidget(widget.id, {
        headerImageUrl: customImageUrl.trim(),
        headerIconType: 'image',
        showHeaderIcon: true,
      });
    }
    setIsOpen(false);
  };

  const handleSelectColor = (color: typeof ICON_COLORS[0]) => {
    if (onUpdateWidget) {
      onUpdateWidget(widget.id, {
        headerIconColor: color.text,
        headerIconBg: color.bg,
      });
    }
  };

  const handleRemoveIcon = () => {
    if (onUpdateWidget) {
      onUpdateWidget(widget.id, {
        headerIcon: undefined,
        headerImageUrl: undefined,
        headerIconType: undefined,
        showHeaderIcon: false,
      });
    }
    setIsOpen(false);
  };

  const filteredIcons = WIDGET_ICONS.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Hidden file input for uploading picture */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/png, image/jpeg, image/svg+xml, image/webp, image/gif"
        className="hidden"
      />

      {/* Premium Sleek Icon Badge Button in top-right of widget header */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isPreviewMode && onUpdateWidget) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={isPreviewMode || !onUpdateWidget}
        className={`relative flex items-center justify-center p-1.5 rounded-xl transition-all border cursor-pointer select-none group/badge shadow-sm ${
          isPreviewMode
            ? 'cursor-default pointer-events-none'
            : 'hover:scale-110 active:scale-95 hover:shadow-md hover:border-violet-400'
        }`}
        style={{
          color: widget.headerIconColor || currentColor.text,
          backgroundColor: widget.headerIconBg || currentColor.bg,
          borderColor: currentColor.border,
        }}
        title={isPreviewMode ? 'ไอคอนมุมขวาวิดเจ็ต' : 'คลิกเพื่อเปลี่ยนรูปภาพหรือไอคอนการเงินประจำวิดเจ็ต'}
      >
        {renderWidgetHeaderIcon(widget, 'w-4 h-4')}

        {/* Edit dot indicator on hover */}
        {!isPreviewMode && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-400 opacity-0 group-hover/badge:opacity-100 transition-opacity ring-2 ring-[#0f0a22]" />
        )}
      </button>

      {/* Interactive Comprehensive Picker Popover */}
      {isOpen && !isPreviewMode && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#161131] border border-violet-500/40 rounded-2xl shadow-2xl p-4 z-50 text-white backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 text-left font-sans"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">เปลี่ยนรูปภาพ / ไอคอนมุมขวา</span>
                <span className="text-[10px] text-slate-400">เลือกกราฟิกการเงินหรืออัปโหลดรูปภาพ</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>

          {/* 3 Tabs: รูปภาพการเงิน & อัปโหลด / ไอคอนเวกเตอร์ / ใส่ URL */}
          <div className="grid grid-cols-3 gap-1 bg-[#0f0a22] p-1 rounded-xl mb-3 border border-violet-500/20 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('graphics')}
              className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'graphics'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>รูปภาพการเงิน</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('icons')}
              className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'icons'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>ไอคอนเวกเตอร์</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>ใส่ลิงก์รูป</span>
            </button>
          </div>

          {/* TAB 1: รูปภาพการเงิน & อัปโหลดจากเครื่อง */}
          {activeTab === 'graphics' && (
            <div className="space-y-3">
              {/* Device Upload Button */}
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-600/30 to-indigo-600/30 hover:from-violet-600/50 hover:to-indigo-600/50 border border-violet-400/40 text-violet-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                >
                  <Upload className="w-4 h-4 text-violet-300 group-hover:scale-110 transition-transform" />
                  <span>📁 อัปโหลดรูปภาพจากอุปกรณ์ (PNG, JPG, SVG)</span>
                </button>
                {uploadError && (
                  <p className="text-[10px] text-rose-400 mt-1 font-medium">{uploadError}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    กราฟิกการเงินและสถิติสำเร็จรูป:
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {PRESET_FINANCIAL_GRAPHICS.map((item) => {
                    const isSelected =
                      widget.headerIconType === 'image' &&
                      widget.headerImageUrl === item.svgDataUri;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectPresetGraphic(item)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer relative group ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400'
                            : 'bg-[#0f0a22] border-white/5 text-slate-300 hover:bg-white/10 hover:border-violet-500/40'
                        }`}
                        title={item.name}
                      >
                        <img
                          src={item.svgDataUri}
                          alt={item.name}
                          className="w-7 h-7 object-contain group-hover:scale-110 transition-transform"
                        />
                        <span className="text-[9px] truncate mt-1 text-slate-300 font-medium max-w-[65px]">
                          {item.label}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-amber-400 text-black flex items-center justify-center text-[7px] font-bold">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ไอคอนเวกเตอร์ */}
          {activeTab === 'icons' && (
            <>
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2.5 text-[10px] no-scrollbar">
                {[
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'finance', label: '💰 การเงิน' },
                  { id: 'growth', label: '📈 เติบโต' },
                  { id: 'business', label: '💼 ธุรกิจ' },
                  { id: 'tech', label: '⚡ ระบบ' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2 py-0.5 rounded-full shrink-0 font-medium transition cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-violet-600 text-white'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Grid of Lucide Financial & Business Icons */}
              <div className="grid grid-cols-5 gap-1.5 max-h-44 overflow-y-auto pr-1 mb-3">
                {filteredIcons.map((item) => {
                  const Icon = item.component;
                  const isCurrent =
                    widget.headerIconType !== 'image' &&
                    (widget.headerIcon === item.id ||
                      (!widget.headerIcon && getDefaultIconForWidget(widget) === item.id));

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectIcon(item.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer ${
                        isCurrent
                          ? 'bg-violet-600/30 border-violet-400 text-white ring-1 ring-violet-400'
                          : 'bg-[#0e0924] border-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                      title={item.name}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[8px] truncate mt-1 max-w-[45px] text-slate-400 group-hover:text-slate-200">
                        {item.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Color Picker for Icon Badge */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Palette className="w-3 h-3 text-violet-400" />
                  สีไอคอน
                </span>
                <div className="flex items-center gap-1.5">
                  {ICON_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectColor(c)}
                      className={`w-4 h-4 rounded-full transition cursor-pointer border ${
                        widget.headerIconColor === c.text
                          ? 'ring-2 ring-white scale-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.text, borderColor: c.border }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 3: Custom Image URL Mode */}
          {activeTab === 'url' && (
            <div className="space-y-3 py-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  URL รูปภาพจากอินเทอร์เน็ต
                </label>
                <input
                  type="text"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://example.com/finance-icon.png"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#0f0a22] border border-violet-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400"
                />
              </div>

              {customImageUrl && (
                <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10">
                  <img
                    src={customImageUrl}
                    alt="Preview"
                    className="w-8 h-8 rounded-lg object-contain bg-black/40 border border-white/10"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-[10px] text-slate-300">ตัวอย่างรูปภาพมุมขวา</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleApplyCustomImageUrl}
                disabled={!customImageUrl.trim()}
                className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs transition shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกรูปภาพนี้</span>
              </button>
            </div>
          )}

          {/* Bottom Actions: Clear / Reset */}
          <div className="pt-2.5 mt-2.5 border-t border-white/10 flex items-center justify-between text-[10px]">
            <button
              type="button"
              onClick={handleRemoveIcon}
              className="text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
            >
              ซ่อนไอคอนมุมขวา
            </button>
            <span className="text-slate-500 font-mono text-[9px]">
              {widget.headerIconType === 'image'
                ? 'โหมดรูปภาพ'
                : widget.headerIcon
                ? `#${widget.headerIcon}`
                : 'ไอคอนอัตโนมัติ'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
