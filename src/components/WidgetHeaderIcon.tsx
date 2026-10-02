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
  X,
  Palette,
  Smile,
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
  { id: 'emerald', label: 'เขียวมรกต', text: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
  { id: 'violet', label: 'ม่วงนีออน', text: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)' },
  { id: 'amber', label: 'ทองคำ / ส้ม', text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
  { id: 'cyan', label: 'ฟ้าสดใส', text: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.3)' },
  { id: 'rose', label: 'แดงกุหลาบ', text: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.3)' },
  { id: 'blue', label: 'น้ำเงินรอยัล', text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' },
  { id: 'white', label: 'ขาวมินิมอล', text: '#e2e8f0', bg: 'rgba(255, 255, 255, 0.1)', border: 'rgba(255, 255, 255, 0.2)' },
];

// Helper to render widget icon
export function renderWidgetHeaderIcon(
  widget: VisualWidget,
  sizeClass: string = 'w-3.5 h-3.5'
): React.ReactNode {
  if (widget.showHeaderIcon === false) return null;

  // Custom Image URL
  if (widget.headerIconType === 'image' && widget.headerImageUrl) {
    return (
      <img
        src={widget.headerImageUrl}
        alt={widget.title}
        className={`${sizeClass} object-contain rounded-md`}
        onError={(e) => {
          // fallback to icon if image fails
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
  const [activeTab, setActiveTab] = useState<'icons' | 'image'>('icons');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customImageUrl, setCustomImageUrl] = useState(widget.headerImageUrl || '');
  const popoverRef = useRef<HTMLDivElement>(null);

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
    ICON_COLORS.find((c) => c.id === 'emerald') ||
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

  const handleApplyCustomImage = () => {
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
      {/* Icon Badge Button in top-right of widget header */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isPreviewMode && onUpdateWidget) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={isPreviewMode || !onUpdateWidget}
        className={`flex items-center justify-center p-1 rounded-lg transition border cursor-pointer select-none group/badge ${
          isPreviewMode ? 'cursor-default pointer-events-none' : 'hover:scale-105 active:scale-95'
        }`}
        style={{
          color: widget.headerIconColor || currentColor.text,
          backgroundColor: widget.headerIconBg || currentColor.bg,
          borderColor: currentColor.border,
        }}
        title={isPreviewMode ? 'ไอคอนมุมขวาวิดเจ็ต' : 'คลิกเพื่อเปลี่ยนรูปหรือไอคอนการเงิน/สถิติประจำวิดเจ็ต'}
      >
        {renderWidgetHeaderIcon(widget, 'w-3.5 h-3.5')}
      </button>

      {/* Interactive Picker Popover */}
      {isOpen && !isPreviewMode && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#161131] border border-violet-500/40 rounded-2xl shadow-2xl p-3.5 z-50 text-white backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-left font-sans"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-white">เลือกรูป/ไอคอนมุมขวา</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>

          {/* Mode Switcher: Icons vs Custom Image */}
          <div className="grid grid-cols-2 gap-1 bg-[#0f0a22] p-1 rounded-xl mb-3 border border-violet-500/20 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('icons')}
              className={`py-1 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'icons'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-3 h-3" />
              <span>ไอคอนการเงิน</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('image')}
              className={`py-1 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'image'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>ใส่ URL รูปภาพ</span>
            </button>
          </div>

          {activeTab === 'icons' ? (
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
                    widget.headerIcon === item.id ||
                    (!widget.headerIcon && getDefaultIconForWidget(widget) === item.id);

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
          ) : (
            /* Custom Image URL Mode */
            <div className="space-y-3 py-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  URL รูปภาพ (ลิงก์ตรงหรือรูปภาพจากเว็บ)
                </label>
                <input
                  type="text"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://... หรือ data:image/..."
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
                onClick={handleApplyCustomImage}
                disabled={!customImageUrl.trim()}
                className="w-full py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs transition shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกรูปภาพนี้</span>
              </button>
            </div>
          )}

          {/* Bottom Actions: Clear / Reset */}
          <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
            <button
              type="button"
              onClick={handleRemoveIcon}
              className="text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
            >
              ซ่อนไอคอนมุมขวา
            </button>
            <span className="text-slate-500 font-mono">
              {widget.headerIcon ? `#${widget.headerIcon}` : 'ค่าเริ่มต้น'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
