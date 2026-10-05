import React, { useState, useRef } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  ExternalLink,
  Trash2,
  RefreshCw,
  Sparkles,
  Building,
  ShieldCheck,
  Check,
  Maximize2,
} from 'lucide-react';
import { VisualWidget } from '../types';

interface ImageWidgetCardProps {
  widget: VisualWidget;
  onUpdateWidget?: (id: string, partial: Partial<VisualWidget>) => void;
  isSelected?: boolean;
  isPreviewMode?: boolean;
}

// Curated high-resolution SVG Preset Logos for businesses, corporations, and finance teams
export const PRESET_LOGOS = [
  {
    id: 'corp-shield',
    name: 'องค์กรมาตรฐาน (Enterprise Shield)',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%236366f1"/><stop offset="100%" stop-color="%23a855f7"/></linearGradient></defs><rect width="200" height="200" rx="36" fill="%23181335"/><path d="M100 30 L160 55 L160 115 C160 150 100 175 100 175 C100 175 40 150 40 115 L40 55 Z" fill="url(%23g1)"/><path d="M75 105 L95 125 L135 80" stroke="%23ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  },
  {
    id: 'finance-gold',
    name: 'ธุรกิจ & การเงิน (Finance Crest)',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23d97706"/></linearGradient></defs><circle cx="100" cy="100" r="88" fill="%231a1532" stroke="%23f59e0b" stroke-width="4"/><circle cx="100" cy="100" r="70" fill="url(%23gold)"/><text x="100" y="125" font-size="76" font-weight="bold" fill="%23ffffff" text-anchor="middle" font-family="Arial, sans-serif">฿</text></svg>`,
  },
  {
    id: 'analytics-chart',
    name: 'ศูนย์วิเคราะห์ข้อมูล (BI Analytics)',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="cyan" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2306b6d4"/><stop offset="100%" stop-color="%233b82f6"/></linearGradient></defs><rect width="200" height="200" rx="36" fill="%23111827"/><rect x="40" y="110" width="24" height="50" rx="6" fill="url(%23cyan)"/><rect x="74" y="80" width="24" height="80" rx="6" fill="url(%23cyan)"/><rect x="108" y="50" width="24" height="110" rx="6" fill="url(%23cyan)"/><rect x="142" y="30" width="24" height="130" rx="6" fill="%2310b981"/></svg>`,
  },
  {
    id: 'company-building',
    name: 'สำนักงานใหญ่ (Corporate HQ)',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="purple" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="200" height="200" rx="40" fill="%231c1938"/><rect x="50" y="60" width="100" height="105" rx="8" fill="url(%23purple)"/><rect x="65" y="75" width="15" height="15" rx="3" fill="%23ffffff"/><rect x="92" y="75" width="15" height="15" rx="3" fill="%23ffffff"/><rect x="120" y="75" width="15" height="15" rx="3" fill="%23ffffff"/><rect x="65" y="100" width="15" height="15" rx="3" fill="%23ffffff"/><rect x="92" y="100" width="15" height="15" rx="3" fill="%23ffffff"/><rect x="120" y="100" width="15" height="15" rx="3" fill="%23ffffff"/><rect x="85" y="130" width="30" height="35" rx="4" fill="%23ffffff"/></svg>`,
  },
  {
    id: 'brand-star',
    name: 'พรีเมียมแบรนด์ (Premium Brand)',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="star" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ec4899"/><stop offset="100%" stop-color="%23f43f5e"/></linearGradient></defs><circle cx="100" cy="100" r="88" fill="%2318112e"/><path d="M100 28 L119 72 L166 75 L130 106 L141 152 L100 127 L59 152 L70 106 L34 75 L81 72 Z" fill="url(%23star)"/></svg>`,
  },
];

export const ImageWidgetCard: React.FC<ImageWidgetCardProps> = ({
  widget,
  onUpdateWidget,
  isSelected = false,
  isPreviewMode = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const imageUrl = widget.imageUrl || '';
  const imageFit = widget.imageFit || 'contain';

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ เช่น PNG, JPG, SVG, WebP หรือ GIF');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && onUpdateWidget) {
        onUpdateWidget(widget.id, {
          imageUrl: dataUrl,
          imageAlt: file.name.replace(/\.[^/.]+$/, ''),
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim() && onUpdateWidget) {
      onUpdateWidget(widget.id, { imageUrl: urlInput.trim() });
      setUrlInput('');
      setShowUrlField(false);
    }
  };

  const handleSelectPreset = (svgDataUrl: string) => {
    if (onUpdateWidget) {
      onUpdateWidget(widget.id, { imageUrl: svgDataUrl });
    }
  };

  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateWidget) {
      onUpdateWidget(widget.id, { imageUrl: '' });
    }
  };

  const handleCycleFit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateWidget) return;
    const fits: ('contain' | 'cover' | 'fill')[] = ['contain', 'cover', 'fill'];
    const currentIdx = fits.indexOf(imageFit as any);
    const nextFit = fits[(currentIdx + 1) % fits.length];
    onUpdateWidget(widget.id, { imageFit: nextFit });
  };

  const handleImageClick = () => {
    if (widget.imageLinkUrl) {
      window.open(widget.imageLinkUrl, '_blank');
    }
  };

  // 1. When an Image is already configured: Display Image with hover tools
  if (imageUrl) {
    return (
      <div
        className="w-full h-full relative group overflow-hidden flex items-center justify-center rounded-xl"
        onClick={handleImageClick}
        style={{ cursor: widget.imageLinkUrl ? 'pointer' : 'default' }}
      >
        <img
          src={imageUrl}
          alt={widget.imageAlt || widget.title || 'โลโก้'}
          style={{ objectFit: imageFit }}
          className="w-full h-full transition-transform duration-200 select-none pointer-events-none"
        />

        {/* Optional Caption */}
        {widget.imageCaption && (
          <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs py-1 px-2 text-[10px] text-white text-center truncate">
            {widget.imageCaption}
          </div>
        )}

        {/* Hover Action Bar in Studio Mode */}
        {!isPreviewMode && onUpdateWidget && (
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 backdrop-blur-md p-1 rounded-lg border border-white/20 z-30 shadow-xl">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="p-1 rounded hover:bg-white/20 text-white text-[10px] flex items-center gap-1 transition cursor-pointer"
              title="เปลี่ยนรูปภาพจากเครื่อง"
            >
              <Upload className="w-3 h-3 text-cyan-400" />
              <span>เปลี่ยน</span>
            </button>

            <button
              type="button"
              onClick={handleCycleFit}
              className="p-1 rounded hover:bg-white/20 text-white text-[10px] flex items-center gap-1 transition cursor-pointer"
              title={`ปรับสัดส่วนภาพ (ปัจจุบัน: ${imageFit === 'contain' ? 'คงสัดส่วน' : imageFit === 'cover' ? 'เต็มกรอบ' : 'ยืด'})`}
            >
              <Maximize2 className="w-3 h-3 text-violet-400" />
              <span className="capitalize">{imageFit}</span>
            </button>

            <button
              type="button"
              onClick={handleClearImage}
              className="p-1 rounded hover:bg-rose-500/40 text-rose-300 text-[10px] flex items-center gap-1 transition cursor-pointer"
              title="ลบรูปภาพออก"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  // 2. Empty State: Interactive Image / Logo Uploader
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full h-full flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed transition-all text-center select-none ${
        isDragOver
          ? 'border-cyan-400 bg-cyan-950/40 scale-[1.01]'
          : 'border-cyan-500/40 hover:border-cyan-400/80 bg-cyan-950/20'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 flex items-center justify-center mb-2 shadow-sm">
        <ImageIcon className="w-5 h-5" />
      </div>

      <div className="font-bold text-xs text-white mb-0.5">
        อัปโหลดโลโก้หรือรูปภาพบริษัท
      </div>
      <p className="text-[10px] text-slate-400 mb-3 max-w-[220px]">
        คลิกเพื่อเลือกไฟล์ (PNG, JPG, SVG, WebP) หรือลากไฟล์มาวางที่นี่
      </p>

      {/* Upload & Link Buttons */}
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>เลือกไฟล์รูปภาพ</span>
        </button>

        <button
          type="button"
          onClick={() => setShowUrlField((prev) => !prev)}
          className="px-2.5 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
        >
          <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>วางลิงก์ URL</span>
        </button>
      </div>

      {/* URL Input Bar */}
      {showUrlField && (
        <form onSubmit={handleApplyUrl} className="w-full max-w-[260px] flex items-center gap-1 mb-3">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://... หรือ data:..."
            className="flex-1 px-2.5 py-1 text-[11px] rounded-lg bg-black/40 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            autoFocus
          />
          <button
            type="submit"
            className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold cursor-pointer"
          >
            ใช้รูปนี้
          </button>
        </form>
      )}

      {/* Curated Preset Company Logos */}
      <div className="pt-2 border-t border-white/10 w-full max-w-[260px]">
        <div className="text-[10px] text-slate-400 mb-1.5 flex items-center justify-center gap-1 font-medium">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>หรือเลือกโลโก้ตัวอย่างสำเร็จรูป:</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          {PRESET_LOGOS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPreset(p.svg)}
              title={p.name}
              className="w-7 h-7 rounded-lg overflow-hidden border border-white/20 hover:border-cyan-400 hover:scale-110 transition shadow-sm bg-black/30 p-0.5 cursor-pointer"
            >
              <img src={p.svg} alt={p.name} className="w-full h-full object-contain pointer-events-none" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
