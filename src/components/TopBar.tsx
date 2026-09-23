import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  History,
  Palette,
  Sun,
  Moon,
  Eye,
  Plus,
  Type,
  Filter,
  FilePlus2,
  Layers,
  Sparkles,
  AlignVerticalJustifyCenter,
  Magnet,
  Maximize2,
  TableProperties,
  PanelRightClose,
  PanelRightOpen,
  Edit2,
  Check,
  RefreshCw,
  FileSpreadsheet,
  Shapes,
  Square,
  Circle,
  Triangle,
  Star,
  Hexagon,
  Cpu,
  Share2,
  Copy,
  ExternalLink,
  Shield,
  ShieldCheck,
  X,
  LogOut,
  UserCircle2,
  Bot,
  Bell,
} from 'lucide-react';
import { FilterState, ThemePreset, VisualType, TeamUser } from '../types';
import { ThemeStyles } from '../utils/themeStyles';
import { SharePublicPortalModal } from './SharePublicPortalModal';
import { getSiteStatus, SiteStatus } from '../services/siteStatusStore';

interface TopBarProps {
  dashboardTitle: string;
  onUpdateTitle: (title: string) => void;
  isSaved: boolean;
  isSyncing: boolean;
  onSync: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenHistory: () => void;
  onOpenTheme: () => void;
  onAddVisual: () => void;
  onAddFloatingText: () => void;
  onAddShape?: (shapeType: VisualType) => void;
  onOpenFilter: () => void;
  onCreateDraft: () => void;
  onOpenDataEditor: () => void;
  onOpenConnectSheet: () => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  filterState: FilterState;
  onClearFilters: () => void;
  onToggleRegionFilter: (region: string) => void;
  onToggleCategoryFilter: (cat: string) => void;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  onAutoAlign?: () => void;
  onAutoSnap?: () => void;
  currentThemePreset?: ThemePreset;
  spacingMode?: string;
  onSpacingChange?: (mode: string) => void;
  themeStyles?: ThemeStyles;
  onOpenDevConsole?: () => void;
  onSwitchToViewer?: () => void;
  currentUser?: TeamUser | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onOpenTemplatesModal?: () => void;
  onOpenPublish?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  dashboardTitle,
  onUpdateTitle,
  isSaved,
  isSyncing,
  onSync,
  onUndo,
  onRedo,
  onOpenHistory,
  onOpenTheme,
  onAddVisual,
  onAddFloatingText,
  onOpenFilter,
  onCreateDraft,
  onOpenDataEditor,
  onOpenConnectSheet,
  inspectorOpen,
  onToggleInspector,
  filterState,
  onClearFilters,
  onToggleRegionFilter,
  onToggleCategoryFilter,
  isPreviewMode,
  onTogglePreview,
  onAutoAlign,
  onAutoSnap,
  currentThemePreset = 'violet',
  spacingMode: initialSpacing = 'ปกติ',
  onSpacingChange,
  onAddShape,
  themeStyles,
  onOpenDevConsole,
  onSwitchToViewer,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onOpenTemplatesModal,
  onOpenPublish,
  onOpenNotifications,
  onOpenProfile,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(dashboardTitle);
  const [layoutMode, setLayoutMode] = useState('กริด 12 คอลัมน์');
  const [templateMode, setTemplateMode] = useState('เลือกเทมเพลต');
  const [spacingMode, setSpacingMode] = useState(initialSpacing);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [siteStatus, setSiteStatus] = useState<SiteStatus>(getSiteStatus());

  React.useEffect(() => {
    const handleStatusUpdate = () => {
      setSiteStatus(getSiteStatus());
    };
    window.addEventListener('site_status_changed', handleStatusUpdate);
    window.addEventListener('storage', handleStatusUpdate);
    return () => {
      window.removeEventListener('site_status_changed', handleStatusUpdate);
      window.removeEventListener('storage', handleStatusUpdate);
    };
  }, []);

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const hasActiveFilters =
    filterState.regions.length > 0 || filterState.categories.length > 0;

  const topBarBg = themeStyles ? themeStyles.topBarBg : '#18152b';
  const topBarBorder = themeStyles ? themeStyles.topBarBorder : '#28224b';
  const isLight = currentThemePreset === 'light';

  return (
    <header
      style={{ backgroundColor: topBarBg, borderColor: topBarBorder }}
      className={`border-b select-none transition-colors duration-200 ${
        isLight ? 'text-slate-800' : 'text-slate-200'
      }`}
    >
      {/* Top Main Row */}
      <div className="px-5 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Breadcrumbs & Title */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="text-[11px] text-violet-300/70 flex items-center gap-1.5 font-medium">
              <span>พื้นที่ทำงาน</span>
              <span>/</span>
              <span className="text-violet-300">แดชบอร์ด BI</span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              {isEditingTitle ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    className="bg-[#241e45] text-white text-base font-bold px-2 py-0.5 rounded border border-violet-400 outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 rounded bg-violet-600 text-white hover:bg-violet-500 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white tracking-tight">
                    {dashboardTitle}
                  </h1>
                  <button
                    onClick={() => {
                      setTempTitle(dashboardTitle);
                      setIsEditingTitle(true);
                    }}
                    className="text-slate-400 hover:text-white transition cursor-pointer"
                    title="แก้ไขชื่อแดชบอร์ด"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Saved Status Badge */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#241e42] border border-[#342b5c] text-[11px] text-violet-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{isSaved ? 'บันทึกแล้ว' : 'กำลังแก้ไข...'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: History, Theme, Sync, Preview Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Undo / Redo / History */}
          <div className="flex items-center bg-[#211b3d] rounded-lg p-0.5 border border-[#2f2757]">
            <button
              id="btn-undo"
              onClick={onUndo}
              className="p-1.5 hover:bg-[#2e2656] text-slate-300 hover:text-white rounded transition cursor-pointer"
              title="เลิกทำ (Undo)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-redo"
              onClick={onRedo}
              className="p-1.5 hover:bg-[#2e2656] text-slate-300 hover:text-white rounded transition cursor-pointer"
              title="ทำซ้ำ (Redo)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-history"
              onClick={onOpenHistory}
              className="p-1.5 hover:bg-[#2e2656] text-slate-300 hover:text-white rounded transition cursor-pointer"
              title="ประวัติเวอร์ชันและสแนปช็อต"
            >
              <History className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme Switcher Button */}
          <button
            id="btn-theme-switcher"
            onClick={onOpenTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#211b3d] hover:bg-[#2e2656] border border-[#2f2757] text-violet-300 hover:text-white transition cursor-pointer"
            title="ปรับแต่งธีมของพื้นที่ทำงาน (เลือกสีหลัก ฟอนต์ เงา และพรีเซ็ต)"
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span className="font-semibold text-[11px]">ธีม</span>
          </button>

          {/* Sync status pill */}
          <button
            id="btn-sync"
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#261f4a] hover:bg-[#312860] border border-violet-500/40 text-violet-200 text-xs font-medium transition cursor-pointer"
            title="กดเพื่อดึงข้อมูลแถวล่าสุดจาก Google Sheets"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : 'text-emerald-400'}`}
            />
            <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูล'}</span>
          </button>

          {/* Google Sheets Connection Config */}
          <button
            id="btn-topbar-sheet-config"
            onClick={onOpenConnectSheet}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition cursor-pointer"
            title="ตั้งค่า Google Sheets และช่วงแถวข้อมูล"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>เชื่อมชีต</span>
          </button>

          {/* เผยแพร่ & แชร์ลิงก์ผู้ชม (Viewer Link) */}
          <button
            id="btn-public-viewer-link"
            onClick={() => {
              if (onOpenPublish) onOpenPublish();
              else setShowShareModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-200 font-semibold text-xs transition shadow-sm cursor-pointer"
            title="เผยแพร่แดชบอร์ดและสร้างลิงก์สำหรับผู้ชม"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>แชร์ลิงก์ผู้ชม</span>
          </button>

          {/* Notifications */}
          {onOpenNotifications && (
            <button
              id="btn-notifications-top"
              onClick={onOpenNotifications}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300 transition cursor-pointer"
              title="การแจ้งเตือน (Email, Line Notify, Push)"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}

          {/* Preview Mode Button */}
          <button
            id="btn-preview-mode"
            onClick={onTogglePreview}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition shadow-sm cursor-pointer ${
              isPreviewMode
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                : 'bg-[#6d28d9] hover:bg-[#7c3aed] text-white shadow-violet-900/40'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isPreviewMode ? 'ออกจากการพรีวิว' : 'พรีวิว'}</span>
          </button>

          {/* Admin Platform shortcut for admins */}
          {currentUser?.role === 'admin' && onOpenDevConsole && (
            <button
              id="btn-admin-platform-shortcut"
              onClick={onOpenDevConsole}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-bold text-xs transition shadow-md cursor-pointer"
              title="กลับไปยังระบบแอดมินส่วนกลาง (เปิด-ปิดเว็บ, จัดการผู้ใช้, ตั้งค่าระบบ)"
            >
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>ระบบแอดมิน</span>
            </button>
          )}

          {/* Team User Profile / Login Button */}
          {currentUser ? (() => {
            const userName = currentUser.displayName || currentUser.name || currentUser.email || 'User';
            const userInitial = (userName.trim().charAt(0) || 'U').toUpperCase();

            return (
              <div className="flex items-center gap-2 pl-2 border-l border-[#2e2652]">
                <div
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#201a3d] border border-[#342a63] cursor-pointer hover:bg-[#28214d] transition"
                  onClick={() => {
                    if (onOpenProfile) onOpenProfile();
                    else if (onOpenAuthModal) onOpenAuthModal();
                  }}
                  title={`บัญชี: ${userName} - คลิกเพื่อจัดการโปรไฟล์และ API Key`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                      currentUser.role === 'admin'
                        ? 'bg-gradient-to-tr from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-tr from-violet-500 to-indigo-400'
                    }`}
                  >
                    {userInitial}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
                      <span>{userName}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                          currentUser.role === 'admin'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        }`}
                      >
                        {currentUser.role === 'admin' ? '👑 Admin' : '👥 Editor'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      {currentUser.department || 'ทีมปฏิบัติการ'}
                    </div>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="ออกจากระบบทีม"
                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })() : (
            <button
              id="btn-open-team-login"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-sm cursor-pointer ml-1"
              title="เข้าสู่ระบบหรือสมัครสมาชิกสำหรับทีม"
            >
              <UserCircle2 className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบทีม</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Toolbar Row */}
      <div
        className={`px-5 py-2 flex items-center justify-between gap-3 text-xs border-t relative z-20 flex-wrap ${
          isLight
            ? 'bg-slate-50/90 border-slate-200'
            : 'bg-[#151226]/90 border-[#231e42]'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Add Visual Button */}
          <button
            id="btn-add-visual"
            onClick={onAddVisual}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#7c3aed] hover:bg-[#8b5cf6] text-white font-medium shadow transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>เพิ่มวิชวล</span>
          </button>

          {/* Floating Text */}
          <button
            id="btn-floating-text"
            onClick={onAddFloatingText}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border transition cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-[#221c3d] border-[#342b5e] text-slate-200 hover:bg-[#2b244d]'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-violet-400" />
            <span>T ข้อความลอย</span>
          </button>

          {/* Shapes Dropdown with clean frame labels & no clipping */}
          {onAddShape && (
            <div className="relative">
              <button
                id="btn-add-shape-topbar"
                onClick={() => setShowShapeMenu((prev) => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border transition cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-[#221c3d] border-[#342b5e] text-slate-200 hover:bg-[#2b244d]'
                }`}
                title="สร้างรูปทรงตกแต่ง (กรอบการ์ด, กรอบมน, วงกลม, สามเหลี่ยม, ดาว, เพชร, แคปซูล)"
              >
                <Shapes className="w-3.5 h-3.5 text-pink-400" />
                <span>+ รูปทรง</span>
              </button>

              {showShapeMenu && (
                <div className="absolute top-full left-0 mt-1.5 w-44 bg-[#1f1938] border border-[#362b60] rounded-xl shadow-2xl p-1.5 z-50">
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    เลือกรูปทรง
                  </div>
                  {[
                    { type: 'shape_rect' as VisualType, label: 'กรอบการ์ด', icon: <Square className="w-3.5 h-3.5" /> },
                    { type: 'shape_rounded' as VisualType, label: 'กรอบมน', icon: <Square className="w-3.5 h-3.5 rounded-sm" /> },
                    { type: 'shape_circle' as VisualType, label: 'วงกลม', icon: <Circle className="w-3.5 h-3.5" /> },
                    { type: 'shape_triangle' as VisualType, label: 'สามเหลี่ยม', icon: <Triangle className="w-3.5 h-3.5" /> },
                    { type: 'shape_star' as VisualType, label: 'ดาว', icon: <Star className="w-3.5 h-3.5" /> },
                    { type: 'shape_diamond' as VisualType, label: 'เพชร', icon: <Hexagon className="w-3.5 h-3.5 rotate-45" /> },
                    { type: 'shape_pill' as VisualType, label: 'แคปซูล', icon: <Circle className="w-3.5 h-3.5" /> },
                  ].map((s) => (
                    <button
                      key={s.type}
                      onClick={() => {
                        onAddShape(s.type);
                        setShowShapeMenu(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-[#32275b] flex items-center gap-2 text-xs text-slate-200 cursor-pointer"
                    >
                      <span className="text-violet-400">{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Filter */}
          <button
            id="btn-toolbar-filter"
            onClick={onOpenFilter}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border transition cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-[#221c3d] border-[#342b5e] text-slate-200 hover:bg-[#2b244d]'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-violet-400" />
            <span>ตัวกรองแดชบอร์ด</span>
          </button>

          {/* Create Draft */}
          <button
            id="btn-create-draft"
            onClick={onCreateDraft}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border transition cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-[#221c3d] border-[#342b5e] text-slate-200 hover:bg-[#2b244d]'
            }`}
          >
            <FilePlus2 className="w-3.5 h-3.5 text-violet-400" />
            <span>+ สร้างแบบร่าง</span>
          </button>

          <span className="w-[1px] h-4 bg-slate-500/30 mx-1"></span>

          {/* Interactive Layout Dropdown */}
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700'
                : 'bg-[#201a3b] border-[#302757] text-slate-300'
            }`}
          >
            <span className="opacity-60">เลย์เอาต์:</span>
            <select
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value)}
              className="bg-transparent font-medium outline-none cursor-pointer"
            >
              <option value="กริด 12 คอลัมน์" className="bg-[#201a3b] text-white">กริด 12 คอลัมน์</option>
              <option value="ผืนงานอิสระ" className="bg-[#201a3b] text-white">ผืนงานอิสระ</option>
              <option value="คอลัมน์คู่" className="bg-[#201a3b] text-white">คอลัมน์คู่</option>
            </select>
          </div>

          {/* Interactive Template Dropdown */}
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700'
                : 'bg-[#201a3b] border-[#302757] text-slate-300'
            }`}
          >
            <span className="opacity-60">จัดหน้า:</span>
            <select
              value={templateMode}
              onChange={(e) => {
                setTemplateMode(e.target.value);
                if (onAutoAlign) onAutoAlign();
              }}
              className="bg-transparent font-medium outline-none cursor-pointer"
            >
              <option value="เลือกเทมเพลต" className="bg-[#201a3b] text-white">เลือกเทมเพลต</option>
              <option value="สรุปภาพรวม KPI" className="bg-[#201a3b] text-white">สรุปภาพรวม KPI</option>
              <option value="เปรียบเทียบหมวดหมู่" className="bg-[#201a3b] text-white">เปรียบเทียบหมวดหมู่</option>
              <option value="เจาะลึกภูมิภาค" className="bg-[#201a3b] text-white">เจาะลึกภูมิภาค</option>
            </select>
          </div>

          {/* Auto Snap Button (kept, vertical/horizontal alignment buttons removed per user instruction) */}
          <button
            onClick={
              onAutoSnap ||
              (() => alert('เปิดโหมดจัดชิดขอบแม่เหล็ก (Magnetic Snap)'))
            }
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-[11px] cursor-pointer transition ${
              isLight
                ? 'bg-white border-slate-300 text-teal-700 hover:bg-slate-100'
                : 'bg-[#201a3b] hover:bg-[#2b244d] border-[#302757] text-slate-300'
            }`}
            title="จัดชิดอัตโนมัติ"
          >
            <Magnet className="w-3.5 h-3.5 text-teal-400" />
            <span>จัดชิดอัตโนมัติ</span>
          </button>

          {/* Spacing */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700'
                : 'bg-[#201a3b] border-[#302757] text-slate-300'
            }`}
          >
            <span className="opacity-60">ช่องว่าง:</span>
            <select
              value={spacingMode}
              onChange={(e) => {
                const val = e.target.value;
                setSpacingMode(val);
                if (onSpacingChange) onSpacingChange(val);
              }}
              className="bg-transparent font-medium outline-none cursor-pointer"
            >
              <option value="ปกติ" className="bg-[#201a3b] text-white">ปกติ (16px)</option>
              <option value="กระชับ" className="bg-[#201a3b] text-white">กระชับ (10px)</option>
              <option value="กว้าง" className="bg-[#201a3b] text-white">กว้าง (24px)</option>
              <option value="กว้างพิเศษ" className="bg-[#201a3b] text-white">กว้างพิเศษ (32px)</option>
            </select>
          </div>
        </div>

        {/* Right side tools: Data Editor & BI Panel */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-edit-data"
            onClick={onOpenDataEditor}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#231c3f] hover:bg-[#2e2552] border border-[#362c61] text-slate-200 transition cursor-pointer"
          >
            <TableProperties className="w-3.5 h-3.5 text-violet-300" />
            <span>แก้ไขข้อมูล</span>
          </button>

          <button
            id="btn-toggle-inspector"
            onClick={onToggleInspector}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition cursor-pointer ${
              inspectorOpen
                ? 'bg-[#352a63] border-violet-400 text-white font-medium'
                : 'bg-[#231c3f] hover:bg-[#2e2552] border-[#362c61] text-slate-300'
            }`}
          >
            {inspectorOpen ? (
              <PanelRightClose className="w-3.5 h-3.5 text-violet-300" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5 text-violet-300" />
            )}
            <span>แผง BI</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="px-5 py-1.5 bg-[#120f21] border-t border-[#1e1936] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-slate-400">
            <Filter className="w-3 h-3 text-violet-400" />
            <span>ตัวกรอง:</span>
          </div>

          {!hasActiveFilters ? (
            <span className="text-slate-300 font-medium">แสดงข้อมูลทั้งหมด</span>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {filterState.regions.map((reg) => (
                <span
                  key={reg}
                  onClick={() => onToggleRegionFilter(reg)}
                  className="px-2 py-0.5 rounded-full bg-violet-900/60 border border-violet-500/50 text-violet-200 flex items-center gap-1 cursor-pointer hover:bg-rose-900/40"
                >
                  <span>{reg}</span>
                  <span className="text-violet-400">×</span>
                </span>
              ))}
              {filterState.categories.map((cat) => (
                <span
                  key={cat}
                  onClick={() => onToggleCategoryFilter(cat)}
                  className="px-2 py-0.5 rounded-full bg-teal-900/60 border border-teal-500/50 text-teal-200 flex items-center gap-1 cursor-pointer hover:bg-rose-900/40"
                >
                  <span>{cat}</span>
                  <span className="text-teal-400">×</span>
                </span>
              ))}
              <button
                onClick={onClearFilters}
                className="text-slate-400 hover:text-white underline ml-1 cursor-pointer"
              >
                ล้างทั้งหมด
              </button>
            </div>
          )}

          <button
            onClick={onOpenFilter}
            className="text-violet-400 hover:text-violet-300 font-medium ml-1 cursor-pointer"
          >
            + เพิ่มตัวกรอง
          </button>
        </div>

        <div className="text-slate-400 text-[10px] flex items-center gap-2">
          <span>
            Google Sheets: <span className="text-emerald-400 font-semibold">พร้อมใช้งาน</span>
          </span>
          <span>•</span>
          <span>
            ธีม: <span className="text-violet-300 capitalize">{currentThemePreset}</span>
          </span>
        </div>
      </div>

      {/* Share / Public Viewer Portal & Site Management Modal */}
      <SharePublicPortalModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        dashboardTitle={dashboardTitle}
        onPreviewViewer={onSwitchToViewer}
      />
    </header>
  );
};
