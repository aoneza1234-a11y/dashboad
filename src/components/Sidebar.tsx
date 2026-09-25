import React from 'react';
import {
  LayoutDashboard,
  HardDrive,
  Database,
  Grid,
  Sparkles,
  Plus,
  ChevronRight,
  Eye,
  Lock,
  HelpCircle,
  BarChart2,
  ChevronDown,
  FileSpreadsheet,
  Layers,
  Palette,
  CheckCircle2,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  Bot,
  Share2,
  Bell,
  User,
  ExternalLink,
  Shield,
  FlaskConical,
  Globe,
} from 'lucide-react';
import { VisualWidget, SheetConnectionConfig, TeamUser } from '../types';
import { ThemeStyles } from '../utils/themeStyles';

interface SidebarProps {
  widgets: VisualWidget[];
  selectedWidgetId: string | null;
  onSelectWidget: (id: string) => void;
  onToggleHide: (id: string, e: React.MouseEvent) => void;
  onToggleLock: (id: string, e: React.MouseEvent) => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  connectionConfig: SheetConnectionConfig;
  onOpenConnectModal: () => void;
  onOpenTheme: () => void;
  onOpenGettingStarted: () => void;
  onOpenDataEditor: () => void;
  onNewDashboard?: () => void;
  onOpenMyDashboards?: () => void;
  onOpenDevConsole?: () => void;
  onOpenPublish?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  userEmail?: string;
  userDisplayName?: string;
  userPhotoUrl?: string;
  onGoogleSignIn?: () => void;
  onGoogleSignOut?: () => void;
  recordCount: number;
  themeStyles?: ThemeStyles;
  currentUser?: TeamUser | null;
  onOpenTemplatesModal?: () => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onOpenDataSourceStorage?: () => void;
  isTestRoute?: boolean;
  onNavigateToTestPortal?: () => void;
  onNavigateToUserPortal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  widgets,
  selectedWidgetId,
  onSelectWidget,
  onToggleHide,
  onToggleLock,
  activeNav,
  setActiveNav,
  connectionConfig,
  onOpenConnectModal,
  onOpenTheme,
  onOpenGettingStarted,
  onOpenDataEditor,
  onNewDashboard,
  onOpenMyDashboards,
  onOpenDevConsole,
  onOpenPublish,
  onOpenNotifications,
  onOpenProfile,
  userEmail = 'aoneza953@gmail.com',
  userDisplayName = '1234',
  userPhotoUrl,
  onGoogleSignIn,
  onGoogleSignOut,
  recordCount,
  themeStyles,
  currentUser,
  onOpenTemplatesModal,
  onOpenAuthModal,
  onLogout,
  onOpenDataSourceStorage,
  isTestRoute = false,
  onNavigateToTestPortal,
  onNavigateToUserPortal,
}) => {
  const sidebarBg = themeStyles ? themeStyles.sidebarBg : '#141224';
  const sidebarBorder = themeStyles ? themeStyles.sidebarBorder : '#262244';

  return (
    <aside
      id="vista-sidebar"
      style={{ backgroundColor: sidebarBg, borderColor: sidebarBorder }}
      className="w-64 text-slate-300 flex flex-col h-screen border-r select-none shrink-0 transition-colors duration-200"
    >
      {/* Brand Header */}
      <div className="p-4 flex items-center gap-3 border-b border-[#262244]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-900/40">
          <div className="flex items-end gap-0.5 h-4">
            <span className="w-1 h-2 bg-white rounded-xs"></span>
            <span className="w-1 h-3.5 bg-white rounded-xs"></span>
            <span className="w-1 h-4 bg-white rounded-xs"></span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-white tracking-wider text-base">VISTA</span>
          </div>
          <span className="text-[10px] font-semibold tracking-widest text-violet-400 block -mt-0.5 uppercase">
            BI STUDIO
          </span>
        </div>
      </div>

      {/* New Dashboard Action Button */}
      <div className="p-3">
        <button
          id="btn-new-dashboard"
          onClick={
            onNewDashboard ||
            (() => alert('พร้อมสำหรับการออกแบบแดชบอร์ด คุณสามารถเพิ่มวิชวลหรือซิงค์ชีตได้ทันที'))
          }
          className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-teal-300 to-emerald-300 hover:from-teal-200 hover:to-emerald-200 text-slate-900 font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>แดชบอร์ดใหม่</span>
        </button>
      </div>

      {/* Main Navigation Items */}
      <div className="px-2 space-y-0.5 text-xs font-medium">
        <button
          id="nav-canvas"
          onClick={() => setActiveNav('canvas')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition cursor-pointer ${
            activeNav === 'canvas'
              ? 'bg-[#231e40] text-white font-semibold'
              : 'hover:bg-[#1c1833] text-slate-300'
          }`}
        >
          <Grid className="w-4 h-4 text-violet-400" />
          <span>ผืนงาน</span>
        </button>

        <button
          id="nav-datasets"
          onClick={() => onOpenDataEditor()}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition cursor-pointer ${
            activeNav === 'datasets'
              ? 'bg-[#231e40] text-white'
              : 'hover:bg-[#1c1833] text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-violet-400" />
            <span>ชุดข้อมูล</span>
          </div>
          <span className="bg-[#2a244d] text-violet-300 px-2 py-0.5 rounded-full text-[11px] font-bold">
            {recordCount}
          </span>
        </button>

        <button
          id="nav-datasource-storage"
          onClick={() => {
            setActiveNav('datasource');
            if (onOpenDataSourceStorage) onOpenDataSourceStorage();
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition cursor-pointer ${
            activeNav === 'datasource'
              ? 'bg-[#231e40] text-white font-semibold'
              : 'hover:bg-[#1c1833] text-slate-300'
          }`}
          title="คลัง Data Source จัดเก็บและสลับไฟล์ Excel/CSV บนคลาวด์ ไม่ต้องอัปโหลดซ้ำ"
        >
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>คลัง Data Source</span>
          </div>
          <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
            Storage
          </span>
        </button>

        <button
          id="nav-dashboards"
          onClick={() => {
            setActiveNav('dashboards');
            if (onOpenMyDashboards) {
              onOpenMyDashboards();
            }
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition cursor-pointer ${
            activeNav === 'dashboards'
              ? 'bg-[#231e40] text-white font-semibold'
              : 'hover:bg-[#1c1833] text-slate-300'
          }`}
          title="คลังแดชบอร์ดที่บันทึกไว้ (จัดการ, โหลด, บันทึกใหม่, คัดลอก)"
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="w-4 h-4 text-violet-400" />
            <span>แดชบอร์ดของฉัน</span>
          </div>
          <span className="text-[10px] text-violet-300 bg-violet-500/20 px-1.5 py-0.5 rounded font-mono">
            คลัง
          </span>
        </button>

        <button
          id="nav-templates"
          onClick={() => {
            setActiveNav('templates');
            if (onOpenTemplatesModal) {
              onOpenTemplatesModal();
            }
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition cursor-pointer ${
            activeNav === 'templates'
              ? 'bg-[#231e40] text-white font-semibold'
              : 'hover:bg-[#1c1833] text-slate-300'
          }`}
          title="ดูเทมเพลตแดชบอร์ดที่ผู้ดูแลระบบมอบหมายให้คุณ"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>เทมเพลตทีม</span>
          </div>
          <span className="text-[10px] text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded font-mono">
            ทีม
          </span>
        </button>

        {/* Publish Viewer Link */}
        <button
          id="nav-publish-viewer"
          onClick={() => {
            if (onOpenPublish) onOpenPublish();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md transition cursor-pointer hover:bg-[#1c1833] text-slate-300 group"
          title="เผยแพร่แดชบอร์ดและสร้างลิงก์สำหรับผู้ชม (Viewer Link)"
        >
          <div className="flex items-center gap-2.5">
            <Share2 className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>แชร์ลิงก์ผู้ชม</span>
          </div>
          <span className="text-[10px] text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono">
            ผู้ชม
          </span>
        </button>

        {/* Notifications */}
        <button
          id="nav-notifications"
          onClick={() => {
            if (onOpenNotifications) onOpenNotifications();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md transition cursor-pointer hover:bg-[#1c1833] text-slate-300 group"
          title="การแจ้งเตือนยอดขายและข้อมูลผิดปกติ (Email, Line Notify, Push)"
        >
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>การแจ้งเตือน</span>
          </div>
        </button>

        {/* Admin Platform / Backoffice (Strictly for Admin or Direct Gate access) */}
        {onOpenDevConsole && (
          <button
            id="nav-admin-platform"
            onClick={onOpenDevConsole}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition cursor-pointer group ${
              currentUser?.role === 'admin'
                ? 'bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-200 mt-1 shadow-sm'
                : 'hover:bg-[#1c1833] text-slate-400 hover:text-rose-300'
            }`}
            title="เข้าสู่ระบบจัดการเว็บไซต์หลังบ้าน (Admin Platform) - ปิด-เปิดเว็บ, จัดการสิทธิ์ผู้ใช้, สั่งปรับปรุงระบบ"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">ระบบหลังบ้าน (Admin)</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              👑 หลังบ้าน
            </span>
          </button>
        )}
      </div>

      {/* Connections Section */}
      <div className="px-3 pt-3">
        <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
          <span>การเชื่อมต่อ Google Sheets</span>
          <button
            onClick={onOpenConnectModal}
            className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
          >
            <span>+ ปรับแต่งชีต</span>
          </button>
        </div>

        <div
          id="card-active-connection"
          onClick={onOpenConnectModal}
          className="p-2.5 rounded-lg bg-[#231d45] border border-violet-500/30 hover:border-violet-400/60 cursor-pointer transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-white truncate max-w-[130px]">
                {connectionConfig.spreadsheetTitle || 'ยอดขายรายไตรมาส'}
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>
                  {connectionConfig.sheetName || 'แผ่นงานหลัก'} (แถว {connectionConfig.headerRow || 1}-
                  {connectionConfig.dataEndRow || 'จบ'})
                </span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        </div>

        {/* Theme customization shortcut */}
        <button
          id="btn-sidebar-theme"
          onClick={onOpenTheme}
          className="w-full mt-2 py-1.5 px-2.5 rounded-md bg-[#1d1938] hover:bg-[#252047] border border-[#312a59] text-violet-300 text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Palette className="w-3.5 h-3.5 text-pink-400" />
          <span>ธีมและสีพื้นที่ทำงาน</span>
        </button>
      </div>

      {/* Dashboard Layers Section */}
      <div className="px-3 pt-4 flex-1 flex flex-col min-h-0">
        <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-violet-400" />
            ชั้นของแดชบอร์ด
          </span>
          <span className="text-[10px] text-slate-500">{widgets.length}</span>
        </div>

        <div className="text-[11px] text-slate-300 py-1 flex items-center gap-1">
          <ChevronDown className="w-3 h-3 text-slate-400" />
          <span className="font-medium text-violet-200">ภาพรวมยอดขาย</span>
        </div>

        <div className="space-y-0.5 overflow-y-auto pr-1 flex-1 text-xs">
          {widgets.map((widget) => {
            const isSelected = selectedWidgetId === widget.id;
            return (
              <div
                key={widget.id}
                id={`layer-item-${widget.id}`}
                onClick={() => onSelectWidget(widget.id)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer text-xs transition ${
                  isSelected
                    ? 'bg-[#2e2656] text-white font-medium border-l-2 border-violet-400'
                    : 'hover:bg-[#1b1733] text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[10px] text-violet-400">
                    {widget.type === 'kpi' ? '#' : widget.type === 'donut' ? '◎' : '▤'}
                  </span>
                  <span className="truncate">{widget.title}</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100">
                  <button
                    onClick={(e) => onToggleHide(widget.id, e)}
                    className={`hover:text-white cursor-pointer ${widget.hidden ? 'text-amber-400 opacity-100' : ''}`}
                    title={widget.hidden ? 'แสดง' : 'ซ่อน'}
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => onToggleLock(widget.id, e)}
                    className={`hover:text-white cursor-pointer ${widget.locked ? 'text-rose-400 opacity-100' : ''}`}
                    title={widget.locked ? 'ปลดล็อก' : 'ล็อก'}
                  >
                    <Lock className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-[#262244] space-y-2">
        <button
          id="btn-sidebar-help"
          onClick={onOpenGettingStarted}
          className="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-white transition py-1 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-violet-400" />
          <span>วิธีเริ่มต้นใช้งาน Google Sheets</span>
        </button>

        {/* Team User Card */}
        {(() => {
          const sideUserName = currentUser?.displayName || currentUser?.name || userDisplayName;
          const sideUserInitial = (sideUserName?.trim().charAt(0) || '1').toUpperCase();

          return (
            <div
              id="user-profile-card"
              className="p-2 rounded-lg bg-[#1c1833] border border-[#2d274f] flex items-center justify-between"
            >
              <div
                className="flex items-center gap-2 truncate cursor-pointer hover:opacity-90 transition"
                onClick={() => {
                  if (onOpenProfile) onOpenProfile();
                  else if (onOpenAuthModal) onOpenAuthModal();
                }}
                title={
                  currentUser
                    ? `บัญชี: ${sideUserName} - คลิกเพื่อจัดการโปรไฟล์และ API Key`
                    : 'คลิกเพื่อเข้าสู่ระบบ'
                }
              >
                {userPhotoUrl ? (
                  <img
                    src={userPhotoUrl}
                    alt="Profile"
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className={`w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                      currentUser?.role === 'admin'
                        ? 'bg-gradient-to-tr from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-tr from-violet-500 to-indigo-400'
                    }`}
                  >
                    {sideUserInitial}
                  </div>
                )}
                <div className="truncate text-left">
                  <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                    <span>{sideUserName}</span>
                    {currentUser && (
                      <span
                        className={`text-[8px] px-1 py-0.2 rounded font-mono font-medium ${
                          currentUser.role === 'admin'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-violet-500/20 text-violet-300'
                        }`}
                      >
                        {currentUser.role === 'admin' ? 'Admin' : 'Editor'}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {currentUser ? `${currentUser.department || 'ทีม'} • ${currentUser.email}` : userEmail}
                  </div>
                </div>
              </div>
              {currentUser && onLogout ? (
                <button
                  onClick={onLogout}
                  title="ออกจากระบบทีม"
                  className="text-slate-400 hover:text-rose-400 transition p-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : onGoogleSignOut ? (
                <button
                  onClick={onGoogleSignOut}
                  title="ออกจากระบบ Google"
                  className="text-slate-400 hover:text-rose-400 transition p-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={onOpenAuthModal || onGoogleSignIn}
                  title="เข้าสู่ระบบทีม"
                  className="text-[10px] text-violet-300 hover:text-white transition underline cursor-pointer"
                >
                  เข้าสู่ระบบ
                </button>
              )}
            </div>
          );
        })()}

        {/* Route Switcher: Switch between clean User Portal (/) and QA Test Lab (/test) */}
        {isTestRoute ? (
          onNavigateToUserPortal && (
            <button
              id="btn-sidebar-switch-to-user"
              onClick={onNavigateToUserPortal}
              className="w-full mt-1.5 py-1.5 px-2.5 rounded-lg bg-blue-950/70 hover:bg-blue-900 border border-blue-500/40 text-blue-200 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              title="สลับไปยังเส้นทางเว็บผู้ใช้งานจริง (Production: /) - สะอาดตา ไม่มีเครื่องมือเทส"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>ไปยังเว็บผู้ใช้งานจริง (Clean /)</span>
            </button>
          )
        ) : (
          onNavigateToTestPortal && (
            <button
              id="btn-sidebar-switch-to-test"
              onClick={onNavigateToTestPortal}
              className="w-full mt-1.5 py-1 px-2 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/20 text-purple-300/80 hover:text-purple-200 text-[10px] flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="สลับไปยังเส้นทางทดสอบระบบสำหรับผู้ทดสอบ (/test) เพื่อสลับ Persona และทดสอบจำลอง"
            >
              <FlaskConical className="w-3 h-3 text-purple-400" />
              <span>ห้องทดสอบระบบ (/test)</span>
            </button>
          )
        )}
      </div>
    </aside>
  );
};
