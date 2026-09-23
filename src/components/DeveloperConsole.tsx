import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Boxes,
  Palette,
  Database,
  Activity,
  AlertTriangle,
  BarChart3,
  ShoppingBag,
  GitBranch,
  FileText,
  Bell,
  Archive,
  ShieldCheck,
  Check,
  Plus,
  Trash2,
  Copy,
  Edit3,
  RefreshCw,
  Search,
  ArrowLeft,
  Key,
  Layers,
  Clock,
  Sparkles,
  Download,
  Upload,
  Play,
  Globe,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Cpu,
  UserCheck,
  UserX,
  Send,
  Lock,
  Unlock,
  ToggleLeft,
  ToggleRight,
  CheckSquare,
  Square,
  Share2,
} from 'lucide-react';
import {
  DevUser,
  DevRole,
  DevDataSource,
  DevQueryStat,
  DevErrorLog,
  DevAuditLog,
  DevVersionCommit,
  DevWhiteLabelConfig,
  VisualWidget,
  SalesRecord,
  TeamUser,
  DashboardTemplate,
  TeamUserRole,
} from '../types';
import {
  getTeamUsers,
  toggleUserBlockStatus,
  updateUserRole,
  deleteTeamUser,
  registerTeamUser,
} from '../services/teamAuthStore';
import {
  getDashboardTemplates,
  createDashboardTemplate,
  distributeTemplateToUsers,
  deleteDashboardTemplate,
} from '../services/templateStore';


interface DeveloperConsoleProps {
  onBackToStudio: () => void;
  currentDashboardTitle: string;
  currentWidgets: VisualWidget[];
  currentSalesData: SalesRecord[];
}

type DevNavTab =
  | 'registry'
  | 'users'
  | 'widgets'
  | 'themes'
  | 'datasources'
  | 'queries'
  | 'errors'
  | 'analytics'
  | 'templates'
  | 'versions'
  | 'audit'
  | 'notifications'
  | 'backup'
  | 'whitelabel'
  | 'ai_config';

export const DeveloperConsole: React.FC<DeveloperConsoleProps> = ({
  onBackToStudio,
  currentDashboardTitle,
  currentWidgets,
  currentSalesData,
}) => {
  const [activeTab, setActiveTab] = useState<DevNavTab>('registry');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 1. Dashboard Registry State
  const [dashboards, setDashboards] = useState([
    {
      id: 'd-1',
      name: currentDashboardTitle || 'ภาพรวมยอดขาย',
      owner: 'Thirawat (Admin)',
      dataSource: 'Google Sheets (ยอดขายรายไตรมาส)',
      lastUpdate: 'วันนี้ 15:35',
      viewerCount: 1245,
      status: 'published' as const,
      widgetsCount: currentWidgets.length,
    },
    {
      id: 'd-2',
      name: 'KDC Operations Dashboard',
      owner: 'Logistics Team',
      dataSource: 'MySQL Production DB',
      lastUpdate: 'เมื่อวาน 18:20',
      viewerCount: 980,
      status: 'published' as const,
      widgetsCount: 8,
    },
    {
      id: 'd-3',
      name: 'Inventory & Stock Matrix',
      owner: 'Warehouse Lead',
      dataSource: 'PostgreSQL Warehouse',
      lastUpdate: '2 วันที่แล้ว',
      viewerCount: 420,
      status: 'draft' as const,
      widgetsCount: 6,
    },
    {
      id: 'd-4',
      name: 'Financial P&L Cockpit',
      owner: 'CFO Office',
      dataSource: 'SAP ERP REST API',
      lastUpdate: '5 วันที่แล้ว',
      viewerCount: 310,
      status: 'archived' as const,
      widgetsCount: 10,
    },
  ]);

  // 2. User & Role Management State
  const [users, setUsers] = useState<DevUser[]>([
    {
      id: 'u-1',
      name: 'Thirawat (คุณ)',
      email: 'aoneza953@gmail.com',
      role: 'SUPER_ADMIN',
      permissions: [
        'create_dashboard',
        'edit_dashboard',
        'delete_dashboard',
        'manage_datasources',
        'manage_users',
        'export_data',
        'manage_themes',
        'view_audit_logs',
      ],
      status: 'active',
      lastActive: 'กำลังใช้งาน',
    },
    {
      id: 'u-2',
      name: 'Komsan Developer',
      email: 'dev.komsan@company.com',
      role: 'DEVELOPER',
      permissions: [
        'create_dashboard',
        'edit_dashboard',
        'manage_datasources',
        'manage_themes',
      ],
      status: 'active',
      lastActive: '10 นาทีที่แล้ว',
    },
    {
      id: 'u-3',
      name: 'Nattapong Editor',
      email: 'sales.lead@company.com',
      role: 'EDITOR',
      permissions: ['create_dashboard', 'edit_dashboard', 'export_data'],
      status: 'active',
      lastActive: 'เมื่อวาน 16:40',
    },
    {
      id: 'u-4',
      name: 'Executive Viewer',
      email: 'director@company.com',
      role: 'VIEWER',
      permissions: ['export_data'],
      status: 'active',
      lastActive: '3 วันที่แล้ว',
    },
  ]);

  // Real Team Users from teamAuthStore
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>(() => getTeamUsers());
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [userSearchText, setUserSearchText] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDept, setNewUserDept] = useState('ฝ่ายขายและการตลาด');
  const [newUserRole, setNewUserRole] = useState<TeamUserRole>('editor');

  // Real Dashboard Templates from templateStore
  const [templatesList, setTemplatesList] = useState<DashboardTemplate[]>(() => getDashboardTemplates());
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [newTplTitle, setNewTplTitle] = useState(`${currentDashboardTitle || 'แดชบอร์ดหลัก'} (เทมเพลตมาตรฐาน)`);
  const [newTplDesc, setNewTplDesc] = useState('แม่แบบแดชบอร์ดมาตรฐานส่งให้ทีมงานใช้วิเคราะห์ข้อมูล');
  const [newTplCategory, setNewTplCategory] = useState('ฝ่ายวิเคราะห์และกลยุทธ์');
  const [newTplSelectedUsers, setNewTplSelectedUsers] = useState<string[]>(['all']);

  // Distribute modal for existing template
  const [distributeModalTpl, setDistributeModalTpl] = useState<DashboardTemplate | null>(null);
  const [selectedUserIdsToDistribute, setSelectedUserIdsToDistribute] = useState<string[]>([]);

  // Sync users & templates
  useEffect(() => {
    setTeamUsers(getTeamUsers());
    setTemplatesList(getDashboardTemplates());
  }, [activeTab]);


  // 3. Widget Builder State
  const [customWidgets, setCustomWidgets] = useState([
    {
      id: 'cw-1',
      name: 'KPI Executive Card',
      category: 'KPI',
      version: 'v2.1',
      published: true,
      lastUpdated: 'วันนี้',
    },
    {
      id: 'cw-2',
      name: 'Radial Speedometer Gauge',
      category: 'Gauge',
      version: 'v1.4',
      published: true,
      lastUpdated: 'เมื่อวาน',
    },
    {
      id: 'cw-3',
      name: 'Drill-Down Matrix Bar',
      category: 'Bar Chart',
      version: 'v3.0',
      published: true,
      lastUpdated: '3 วันที่แล้ว',
    },
    {
      id: 'cw-4',
      name: 'Kanban Order Pipeline',
      category: 'Kanban',
      version: 'v1.0-beta',
      published: false,
      lastUpdated: '1 สัปดาห์ก่อน',
    },
    {
      id: 'cw-5',
      name: 'GIS Thailand Map Heatmap',
      category: 'Map',
      version: 'v1.2',
      published: true,
      lastUpdated: '2 สัปดาห์ก่อน',
    },
  ]);

  // 4. Themes & Corporate Presets State
  const corporateThemes = [
    {
      id: 'toyota',
      name: 'Toyota Theme (โตโยต้า)',
      primary: '#eb0a1e',
      secondary: '#1c1c1c',
      font: 'Prompt',
      radius: '8px',
      shadow: 'shadow-md',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Toyota.svg',
    },
    {
      id: 'hp',
      name: 'HP Corporate (เอชพี)',
      primary: '#0096d6',
      secondary: '#1f2937',
      font: 'Inter',
      radius: '6px',
      shadow: 'shadow-sm',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_630x630.png',
    },
    {
      id: 'fedex',
      name: 'FedEx Express (เฟดเอ็กซ์)',
      primary: '#4d148c',
      secondary: '#ff6600',
      font: 'Prompt',
      radius: '10px',
      shadow: 'shadow-lg',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/FedEx_Corporation_-_logo.svg',
    },
    {
      id: 'dhl',
      name: 'DHL Logistics (ดีเอชแอล)',
      primary: '#d40511',
      secondary: '#ffcc00',
      font: 'Kanit',
      radius: '4px',
      shadow: 'shadow-sm',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/DHL_Logo.svg',
    },
  ];
  const [activeCorporateTheme, setActiveCorporateTheme] = useState('toyota');

  // 5. Data Source Manager State
  const [dataSources, setDataSources] = useState<DevDataSource[]>([
    {
      id: 'ds-1',
      name: 'Google Sheets (ยอดขายรายไตรมาส)',
      type: 'google_sheets',
      status: 'connected',
      lastSync: '08:22 (อัตโนมัติ)',
      recordCount: currentSalesData.length,
      syncTimeMs: 120,
    },
    {
      id: 'ds-2',
      name: 'MySQL Production Replica (Orders)',
      type: 'mysql',
      status: 'connected',
      lastSync: '15:10 (อัตโนมัติ)',
      recordCount: 48200,
      syncTimeMs: 340,
    },
    {
      id: 'ds-3',
      name: 'PostgreSQL Warehouse & Inventory',
      type: 'postgres',
      status: 'degraded',
      lastSync: '12:00 (มีข้อผิดพลาดบางส่วน)',
      recordCount: 15400,
      syncTimeMs: 1250,
    },
    {
      id: 'ds-4',
      name: 'SAP ERP Open Finance API',
      type: 'rest_api',
      status: 'connected',
      lastSync: '14:45 (อัตโนมัติ)',
      recordCount: 8900,
      syncTimeMs: 410,
    },
    {
      id: 'ds-5',
      name: 'Microsoft SQL Server (HR Payroll)',
      type: 'sql_server',
      status: 'offline',
      lastSync: 'เมื่อวาน 18:00',
      recordCount: 1200,
      syncTimeMs: 0,
    },
  ]);

  // 6. Query Monitor State
  const [queryStats, setQueryStats] = useState<DevQueryStat[]>([
    {
      id: 'qs-1',
      widgetId: 'kpi-1',
      widgetTitle: 'ยอดขายรวม (Sales KPI)',
      dashboardName: 'Sales Dashboard',
      rowsProcessed: currentSalesData.length,
      executionTimeMs: 25,
      status: 'fast',
    },
    {
      id: 'qs-2',
      widgetId: 'chart-cat',
      widgetTitle: 'ยอดขายรายหมวดหมู่ (Profit Chart)',
      dashboardName: 'Sales Dashboard',
      rowsProcessed: currentSalesData.length,
      executionTimeMs: 340,
      status: 'fast',
    },
    {
      id: 'qs-3',
      widgetId: 'tbl-region',
      widgetTitle: 'ตารางข้อมูลรายละเอียด (Region Table)',
      dashboardName: 'Sales Dashboard',
      rowsProcessed: currentSalesData.length,
      executionTimeMs: 1200,
      status: 'slow',
    },
    {
      id: 'qs-4',
      widgetId: 'chart-drill',
      widgetTitle: 'กราฟเจาะลึก 3 ระดับ (Drill Down Bar)',
      dashboardName: 'KDC Operations',
      rowsProcessed: 4820,
      executionTimeMs: 415,
      status: 'moderate',
    },
  ]);

  // 7. Error Center State
  const [errorLogs, setErrorLogs] = useState<DevErrorLog[]>([
    {
      id: 'err-1',
      category: 'Formula Error',
      detail: 'หารด้วยศูนย์ในฟิลด์คำนวณ [Profit / 0] ในวิดเจ็ต KPI Card',
      stackTrace: 'CalcEngine.evaluateExpression (calcEngine.ts:142)\nat evaluateCustomFormula',
      datetime: 'วันนี้ 15:12:04',
      user: 'Thirawat (Admin)',
      resolved: false,
    },
    {
      id: 'err-2',
      category: 'API Error',
      detail: 'Google Sheets API Rate Limit Exceeded (HTTP 429: Too many requests)',
      stackTrace: 'googleSheets.ts:88\nat fetchSpreadsheetMetadata',
      datetime: 'วันนี้ 14:48:21',
      user: 'Komsan Developer',
      resolved: true,
    },
    {
      id: 'err-3',
      category: 'Sheet not found',
      detail: "ไม่พบชีตชื่อ 'Q4_Projections' ใน Spreadsheet ID ที่เชื่อมต่อ",
      stackTrace: 'ConnectSheetModal.tsx:210\nat validateSheetExistence',
      datetime: 'เมื่อวาน 17:33:00',
      user: 'Nattapong Editor',
      resolved: true,
    },
    {
      id: 'err-4',
      category: 'Connection failed',
      detail: 'SQL Server Connection Timeout (Port 1433 unreachable after 5000ms)',
      stackTrace: 'DataSourceClient.connect (sqlServer.ts:45)',
      datetime: 'เมื่อวาน 18:00:15',
      user: 'System Cron',
      resolved: false,
    },
  ]);

  // 8. Version Control (Git สำหรับ Dashboard) State
  const [versions, setVersions] = useState<DevVersionCommit[]>([
    {
      version: 'v1.2',
      timestamp: 'วันนี้ 15:35',
      author: 'Thirawat (Admin)',
      message: 'เพิ่ม KPI Trend เทียบช่วงเดือนก่อนหน้า, แถบ Global Filter และ Drill Down 3 ระดับ',
      widgetsCount: currentWidgets.length,
      isActive: true,
    },
    {
      version: 'v1.1',
      timestamp: 'เมื่อวาน 18:40',
      author: 'Komsan Developer',
      message: 'ปรับปรุงฟอร์มูล่า Formula Builder และ Conditional Color Formatting',
      widgetsCount: currentWidgets.length - 1,
      isActive: false,
    },
    {
      version: 'v1.0',
      timestamp: '2 วันที่แล้ว',
      author: 'Thirawat (Admin)',
      message: 'บันทึกเวอร์ชันเริ่มต้นของแดชบอร์ดผู้บริหาร (Initial Production Release)',
      widgetsCount: 4,
      isActive: false,
    },
  ]);

  // 9. Audit Log State
  const [auditLogs, setAuditLogs] = useState<DevAuditLog[]>([
    {
      id: 'al-1',
      user: 'Thirawat (Admin)',
      role: 'SUPER_ADMIN',
      action: 'แก้ไขวิดเจ็ต (Edited KPI Card)',
      target: 'kpi-rev-1 (Total Revenue)',
      timestamp: '15:35:12',
      status: 'success',
    },
    {
      id: 'al-2',
      user: 'Thirawat (Admin)',
      role: 'SUPER_ADMIN',
      action: 'เปิดใช้งาน Drill Down (Enabled 3-Tier Drill)',
      target: 'chart-drill-exec',
      timestamp: '15:30:45',
      status: 'success',
    },
    {
      id: 'al-3',
      user: 'Admin System',
      role: 'SYSTEM',
      action: 'ลบวิดเจ็ตขยะ (Deleted Widget)',
      target: 'temp-placeholder-99',
      timestamp: '15:02:10',
      status: 'warning',
    },
    {
      id: 'al-4',
      user: 'Komsan Developer',
      role: 'DEVELOPER',
      action: 'อัปเดตสิทธิ์ผู้ใช้ (Updated User Permissions)',
      target: 'Nattapong Editor -> Can Export Data',
      timestamp: '14:20:00',
      status: 'success',
    },
  ]);

  // 10. White Label Config State
  const [whiteLabel, setWhiteLabel] = useState<DevWhiteLabelConfig>({
    companyName: 'Vista BI Studio',
    systemName: 'Enterprise Analytics Cloud',
    domain: 'analytics.vistabi.com',
    primaryColor: '#7c3aed',
    secondaryColor: '#1e1b4b',
    loginTheme: 'modern',
  });

  return (
    <div className="flex h-screen bg-[#0f0c1d] text-slate-100 font-sans select-none overflow-hidden">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Left Navigation Sidebar */}
      <aside className="w-64 bg-[#141026] border-r border-[#261f47] flex flex-col shrink-0">
        {/* Header Branding */}
        <div className="p-4 border-b border-[#261f47] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-900/40 font-bold text-sm">
              🛠
            </div>
            <div>
              <div className="text-xs font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                <span>VISTA DEV CONSOLE</span>
              </div>
              <div className="text-[10px] text-violet-400 font-mono">v2.4.0 • Enterprise Admin</div>
            </div>
          </div>
        </div>

        {/* Back to Studio Action */}
        <div className="p-3">
          <button
            onClick={onBackToStudio}
            className="w-full px-3 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600 border border-violet-500/40 text-violet-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
            <span>กลับไป สตูดิโอออกแบบ (Studio)</span>
          </button>
        </div>

        {/* Nav Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 text-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider">
            จัดการระบบหลัก (Core Management)
          </div>

          {[
            { id: 'registry', label: '1. Dashboard Registry', icon: LayoutDashboard, badge: dashboards.length },
            { id: 'users', label: '2. User & Role Management', icon: Users, badge: users.length },
            { id: 'widgets', label: '3. Widget Builder', icon: Boxes, badge: '5' },
            { id: 'themes', label: '4. Theme Builder (แบรนด์)', icon: Palette, badge: 'Toyota' },
            { id: 'datasources', label: '5. Data Source Manager', icon: Database, badge: dataSources.length },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition cursor-pointer font-medium ${
                  isActive
                    ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f1938]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-violet-800 text-white'
                        : 'bg-[#282147] text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="text-[10px] font-bold text-slate-500 uppercase px-2 pt-3 pb-1 tracking-wider">
            ประสิทธิภาพและตรวจสอบ (Observability)
          </div>

          {[
            { id: 'queries', label: '6. Query Monitor', icon: Activity, badge: '25ms' },
            { id: 'errors', label: '7. Error Center', icon: AlertTriangle, badge: '2 Unresolved', badgeColor: 'bg-rose-500/20 text-rose-300' },
            { id: 'analytics', label: '8. Dashboard Analytics', icon: BarChart3, badge: '1.2k' },
            { id: 'templates', label: '9. Template Manager', icon: ShoppingBag, badge: 'Public' },
            { id: 'versions', label: '10. Version Control (Git)', icon: GitBranch, badge: 'v1.2' },
            { id: 'audit', label: '11. Audit Log', icon: FileText, badge: 'Live' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition cursor-pointer font-medium ${
                  isActive
                    ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f1938]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      (item as any).badgeColor || (isActive ? 'bg-violet-800 text-white' : 'bg-[#282147] text-slate-400')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="text-[10px] font-bold text-slate-500 uppercase px-2 pt-3 pb-1 tracking-wider">
            องค์กร & ธุรกิจ (Enterprise & SaaS)
          </div>

          {[
            { id: 'notifications', label: '12. Notification Center', icon: Bell },
            { id: 'backup', label: '13. Backup & Restore', icon: Archive },
            { id: 'whitelabel', label: '14. White Label SaaS', icon: Building },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition cursor-pointer font-medium ${
                  isActive
                    ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f1938]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Admin Footer Status */}
        <div className="p-3 border-t border-[#261f47] bg-[#100d20] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-300 font-semibold">Production Online</span>
          </div>
          <span className="font-mono text-[10px]">99.98% SLA</span>
        </div>
      </aside>

      {/* Main Developer Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0e0b1c]">
        {/* Top Navbar */}
        <header className="h-14 px-6 border-b border-[#261f47] bg-[#141026] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-white capitalize">
              {activeTab === 'registry' && '📋 ทะเบียนแดชบอร์ดทั้งระบบ (Dashboard Registry)'}
              {activeTab === 'users' && '👥 การจัดการผู้ใช้และสิทธิ์การเข้าถึง (User & Role Management)'}
              {activeTab === 'widgets' && '🧩 สตูดิโอสร้างวิดเจ็ตและปลั๊กอิน (Widget Builder)'}
              {activeTab === 'themes' && '🎨 ตัวสร้างธีมองค์กรและอัตลักษณ์แบรนด์ (Theme Builder)'}
              {activeTab === 'datasources' && '🗄️ จัดการแหล่งข้อมูลและการเชื่อมต่อ (Data Source Manager)'}
              {activeTab === 'queries' && '⚡ ตรวจสอบความเร็วคิวรี่และประสิทธิภาพ (Query Monitor)'}
              {activeTab === 'errors' && '⚠️ ศูนย์รวมข้อผิดพลาดทั้งระบบ (Error Center)'}
              {activeTab === 'analytics' && '📈 สถิติการเข้าชมและวิเคราะห์ผู้ใช้ (Dashboard Analytics)'}
              {activeTab === 'templates' && '🛍️ จัดการคลังเทมเพลตมาตรฐาน (Template Marketplace Manager)'}
              {activeTab === 'versions' && '🌿 ประวัติเวอร์ชันและกู้คืน (Git Version Control & Rollback)'}
              {activeTab === 'audit' && '📜 บันทึกกิจกรรมระบบ (Audit Log Trail)'}
              {activeTab === 'notifications' && '🔔 ศูนย์การแจ้งเตือน (Notification Center)'}
              {activeTab === 'backup' && '💾 ระบบสำรองข้อมูลและกู้คืน (Backup & Restore)'}
              {activeTab === 'whitelabel' && '🏷️ ระบบไวท์เลเบลสำหรับขาย SaaS (White Label System)'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#1b1534] border border-[#312759] px-3 py-1.5 rounded-lg text-xs">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาข้อมูลในระบบ..."
                className="bg-transparent border-none outline-none text-white text-xs w-48 placeholder-slate-500"
              />
            </div>

            <button
              onClick={() => showToast('รีเฟรชข้อมูลระบบสำเร็จ (Sync OK)')}
              className="p-2 rounded-lg bg-[#20193e] hover:bg-[#2b2254] text-slate-300 hover:text-white transition cursor-pointer"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tab Body View */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: DASHBOARD REGISTRY */}
          {activeTab === 'registry' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">ทะเบียนแดชบอร์ดทั้งองค์กร</h2>
                  <p className="text-xs text-slate-400">
                    ดูแดชบอร์ดทั้งหมด ตรวจสอบสถานะ เจ้าของข้อมูล และจัดการโคลน สำรอง หรือนำออกสู่ระบบ
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newDash = {
                      id: `d-${Date.now()}`,
                      name: 'New Custom Dashboard',
                      owner: 'Thirawat (Admin)',
                      dataSource: 'Google Sheets',
                      lastUpdate: 'เพิ่งสร้าง',
                      viewerCount: 0,
                      status: 'draft' as const,
                      widgetsCount: 0,
                    };
                    setDashboards([newDash, ...dashboards]);
                    showToast('สร้างแดชบอร์ดใหม่ลงใน Registry เรียบร้อย');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ ลงทะเบียนแดชบอร์ดใหม่</span>
                </button>
              </div>

              {/* Dashboards Table */}
              <div className="rounded-xl border border-[#2a2252] bg-[#16122c] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#2a2252] bg-[#1a1535] text-slate-400 font-semibold">
                      <th className="py-3 px-4">ชื่อแดชบอร์ด</th>
                      <th className="py-3 px-4">เจ้าของ (Owner)</th>
                      <th className="py-3 px-4">แหล่งข้อมูล (Data Source)</th>
                      <th className="py-3 px-4">อัปเดตล่าสุด</th>
                      <th className="py-3 px-4">ผู้เข้าชม (Views)</th>
                      <th className="py-3 px-4">สถานะ (Status)</th>
                      <th className="py-3 px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#241c45] text-slate-300">
                    {dashboards.map((d) => (
                      <tr key={d.id} className="hover:bg-[#1e183e] transition">
                        <td className="py-3 px-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4 text-violet-400" />
                            <span>{d.name}</span>
                            <span className="text-[10px] bg-[#29204e] text-violet-300 px-1.5 py-0.5 rounded">
                              {d.widgetsCount} วิดเจ็ต
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{d.owner}</td>
                        <td className="py-3 px-4 text-slate-400">{d.dataSource}</td>
                        <td className="py-3 px-4 text-slate-400">{d.lastUpdate}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                          {d.viewerCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              d.status === 'published'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : d.status === 'draft'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                            }`}
                          >
                            {d.status === 'published' && '● Published'}
                            {d.status === 'draft' && '◐ Draft'}
                            {d.status === 'archived' && '○ Archived'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                const clone = {
                                  ...d,
                                  id: `d-${Date.now()}`,
                                  name: `${d.name} (Copy)`,
                                  lastUpdate: 'เพิ่งโคลน',
                                };
                                setDashboards([clone, ...dashboards]);
                                showToast(`โคลนแดชบอร์ด "${d.name}" สำเร็จ`);
                              }}
                              className="p-1.5 rounded hover:bg-[#2e2459] text-slate-400 hover:text-white transition cursor-pointer"
                              title="Clone แดชบอร์ด"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                const updated = dashboards.map((item) =>
                                  item.id === d.id
                                    ? {
                                        ...item,
                                        status: (item.status === 'published'
                                          ? 'archived'
                                          : 'published') as any,
                                      }
                                    : item
                                );
                                setDashboards(updated);
                                showToast(`สลับสถานะ Publish/Archive สำเร็จ`);
                              }}
                              className="p-1.5 rounded hover:bg-[#2e2459] text-slate-400 hover:text-violet-300 transition cursor-pointer"
                              title="สลับ Publish / Archive"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDashboards(dashboards.filter((item) => item.id !== d.id));
                                showToast(`ลบแดชบอร์ด "${d.name}" แล้ว`);
                              }}
                              className="p-1.5 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                              title="ลบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: USER & ROLE MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-violet-400" />
                    <span>การจัดการผู้ใช้ในทีมและบล็อก/ปลดบล็อก (Team User Management)</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    ดูรายชื่อผู้ใช้ทั้งหมดในทีม ควบคุมการเปิด/ปิดบล็อกผู้ใช้งาน และกำหนดสิทธิ์การเข้าถึงระบบ
                  </p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ เพิ่มผู้ใช้งานใหม่ในทีม</span>
                </button>
              </div>

              {/* Status and Search Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#16122c] border border-[#2a2252]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">กรองสถานะ:</span>
                  {(['all', 'active', 'blocked'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setUserStatusFilter(filter)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        userStatusFilter === filter
                          ? 'bg-violet-600 text-white shadow-md'
                          : 'bg-[#20193e] text-slate-400 hover:text-white'
                      }`}
                    >
                      {filter === 'all' && `ทั้งหมด (${teamUsers.length})`}
                      {filter === 'active' && `🟢 ใช้งานปกติ (${teamUsers.filter((u) => u.status === 'active').length})`}
                      {filter === 'blocked' && `🔴 ถูกบล็อก (${teamUsers.filter((u) => u.status === 'blocked').length})`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                    placeholder="ค้นหาชื่อ, อีเมล หรือแผนก..."
                    className="bg-[#20193e] border border-[#312759] rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Roles Legend Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl border border-purple-500/40 bg-purple-950/20 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-purple-300">👑 ผู้ดูแลระบบ (Admin)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      เข้าถึงระบบหลังบ้าน (Developer Console) จัดการผู้ใช้ บล็อก/ปลดบล็อก และสร้าง/แจกจ่ายเทมเพลต
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/20 flex items-start gap-2.5">
                  <Users className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-emerald-300">👥 ผู้ใช้ในทีม (Team Editor / Power BI)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      สร้าง/แก้ไข/ลบแดชบอร์ดของตนเอง เชื่อม Google Sheets ปรับแต่งธีม <strong>โดยไม่เห็นและเข้าไม่ถึงหลังบ้าน 100%</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/20 flex items-start gap-2.5">
                  <UserX className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-rose-300">🚫 สถานะถูกบล็อก (Blocked)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      ถูกระงับสิทธิ์ชั่วคราว เมื่อเข้าสู่ระบบจะพบการแจ้งเตือนว่าถูกบล็อก ไม่สามารถเข้าใช้งานแดชบอร์ดได้
                    </div>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-xl border border-[#2a2252] bg-[#16122c] overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#2a2252] bg-[#1a1535] text-slate-400 font-semibold">
                      <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                      <th className="py-3 px-4">อีเมล / แผนก</th>
                      <th className="py-3 px-4">สิทธิ์ในระบบ (Role)</th>
                      <th className="py-3 px-4">สถานะการใช้งาน</th>
                      <th className="py-3 px-4">สวิตช์ เปิด/ปิด บล็อกผู้ใช้</th>
                      <th className="py-3 px-4">เทมเพลตที่ได้รับ</th>
                      <th className="py-3 px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#241c45] text-slate-300">
                    {teamUsers
                      .filter((u) => {
                        if (userStatusFilter === 'active' && u.status !== 'active') return false;
                        if (userStatusFilter === 'blocked' && u.status !== 'blocked') return false;
                        if (userSearchText.trim()) {
                          const query = userSearchText.toLowerCase();
                          return (
                            u.displayName.toLowerCase().includes(query) ||
                            u.email.toLowerCase().includes(query) ||
                            (u.department && u.department.toLowerCase().includes(query))
                          );
                        }
                        return true;
                      })
                      .map((u) => {
                        const isSelf = u.email === 'aoneza953@gmail.com';
                        const isBlocked = u.status === 'blocked';

                        return (
                          <tr
                            key={u.id}
                            className={`transition ${
                              isBlocked ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'hover:bg-[#1e183e]'
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                    isBlocked
                                      ? 'bg-rose-900/60 text-rose-300 border border-rose-500/50'
                                      : u.role === 'admin'
                                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                                      : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                                  }`}
                                >
                                  {(u.displayName || u.name || u.email || 'U').trim().charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>{u.displayName}</span>
                                    {isSelf && (
                                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1 rounded border border-purple-500/30 font-normal">
                                        (คุณ)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400">สมัครเมื่อ {u.createdAt}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-mono text-slate-300">{u.email}</div>
                              <div className="text-[10px] text-violet-300 mt-0.5">{u.department || 'ไม่ระบุแผนก'}</div>
                            </td>

                            <td className="py-3 px-4">
                              <select
                                value={u.role}
                                disabled={isSelf}
                                onChange={(e) => {
                                  const newRole = e.target.value as TeamUserRole;
                                  const updated = updateUserRole(u.id, newRole);
                                  setTeamUsers(updated);
                                  showToast(`เปลี่ยนสิทธิ์ ${u.displayName} เป็น ${newRole === 'admin' ? 'แอดมิน' : 'ผู้ใช้ในทีม'}`);
                                }}
                                className={`text-[11px] rounded-md px-2 py-1 outline-none font-semibold cursor-pointer border ${
                                  u.role === 'admin'
                                    ? 'bg-purple-950/70 border-purple-500/60 text-purple-200'
                                    : 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                                }`}
                              >
                                <option value="admin">👑 Admin (ระบบหลังบ้าน)</option>
                                <option value="editor">👥 Editor (ผู้ใช้ในทีม)</option>
                              </select>
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 w-fit ${
                                  !isBlocked
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    !isBlocked ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                                  }`}
                                />
                                <span>{!isBlocked ? 'เปิดใช้งาน (Active)' : 'ถูกบล็อก (Blocked)'}</span>
                              </span>
                            </td>

                            {/* Block / Unblock Toggle Switch */}
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                disabled={isSelf}
                                onClick={() => {
                                  if (isSelf) {
                                    showToast('ไม่อนุญาตให้บล็อกบัญชีตนเอง');
                                    return;
                                  }
                                  const updated = toggleUserBlockStatus(u.id);
                                  setTeamUsers(updated);
                                  const nextUser = updated.find((item) => item.id === u.id);
                                  if (nextUser?.status === 'blocked') {
                                    showToast(`🚫 บล็อกผู้ใช้ ${u.displayName} เรียบร้อย (จะไม่สามารถล็อกอินได้)`);
                                  } else {
                                    showToast(`✅ ปลดบล็อกผู้ใช้ ${u.displayName} แล้ว (สามารถเข้าใช้งานได้ตามปกติ)`);
                                  }
                                }}
                                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                                  isSelf
                                    ? 'opacity-40 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-400'
                                    : isBlocked
                                    ? 'bg-rose-600 hover:bg-rose-500 border-rose-400 text-white shadow-md shadow-rose-950/50'
                                    : 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-500/50 text-emerald-300'
                                }`}
                                title={isBlocked ? 'คลิกเพื่อปลดบล็อก' : 'คลิกเพื่อบล็อกผู้ใช้'}
                              >
                                {isBlocked ? (
                                  <>
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>ปลดบล็อก</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3.5 h-3.5" />
                                    <span>บล็อกผู้ใช้</span>
                                  </>
                                )}
                              </button>
                            </td>

                            <td className="py-3 px-4">
                              <span className="text-[11px] font-mono text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                                {u.assignedTemplateIds?.length || 0} เทมเพลต
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                disabled={isSelf}
                                onClick={() => {
                                  if (isSelf) {
                                    showToast('ไม่อนุญาตให้ลบบัญชีตนเอง');
                                    return;
                                  }
                                  const updated = deleteTeamUser(u.id);
                                  setTeamUsers(updated);
                                  showToast(`ลบผู้ใช้ ${u.displayName} แล้ว`);
                                }}
                                className={`p-1.5 rounded transition cursor-pointer ${
                                  isSelf
                                    ? 'opacity-30 cursor-not-allowed text-slate-600'
                                    : 'hover:bg-rose-950/60 text-slate-400 hover:text-rose-400'
                                }`}
                                title="ลบผู้ใช้ออกจากทีม"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Add User Modal */}
              {showAddUserModal && (
                <div
                  className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
                  onClick={() => setShowAddUserModal(false)}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-[#16122c] border border-violet-500/40 rounded-2xl shadow-2xl p-6 text-white text-left space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-violet-400" />
                        <span>เพิ่มสมาชิกใหม่ในทีม (Add Team Member)</span>
                      </h3>
                      <button
                        onClick={() => setShowAddUserModal(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-300 mb-1 font-medium">ชื่อ - นามสกุล หรือ ชื่อเรียก:</label>
                        <input
                          type="text"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="เช่น อนุชา สดใส (ผู้ช่วยนักวิเคราะห์)"
                          className="w-full px-3 py-2 rounded-lg bg-[#221b44] border border-[#372b69] text-white focus:outline-none focus:border-violet-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-medium">อีเมล (ใช้เข้าสู่ระบบ):</label>
                        <input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="anucha.s@team.internal"
                          className="w-full px-3 py-2 rounded-lg bg-[#221b44] border border-[#372b69] text-white focus:outline-none focus:border-violet-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-medium">แผนก / ทีมงาน:</label>
                        <input
                          type="text"
                          value={newUserDept}
                          onChange={(e) => setNewUserDept(e.target.value)}
                          placeholder="เช่น ทีมการตลาด, ฝ่ายปฏิบัติการ"
                          className="w-full px-3 py-2 rounded-lg bg-[#221b44] border border-[#372b69] text-white focus:outline-none focus:border-violet-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-medium">สิทธิ์เริ่มต้น:</label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as TeamUserRole)}
                          className="w-full px-3 py-2 rounded-lg bg-[#221b44] border border-[#372b69] text-white focus:outline-none focus:border-violet-400"
                        >
                          <option value="editor">👥 ผู้ใช้ในทีม (Team Editor - ทำงานแดชบอร์ด ไม่มีหลังบ้าน)</option>
                          <option value="admin">👑 ผู้ดูแลระบบ (Admin - เข้าหลังบ้านและจัดการผู้ใช้ได้)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setShowAddUserModal(false)}
                        className="px-3 py-1.5 rounded-lg bg-[#241c47] hover:bg-[#322663] text-slate-300 text-xs transition cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newUserName.trim() || !newUserEmail.trim()) {
                            showToast('กรุณาระบุชื่อและอีเมลให้ครบถ้วน');
                            return;
                          }
                          const res = registerTeamUser(newUserName, newUserEmail, 'password123', newUserDept);
                          if (res.success && res.user) {
                            if (newUserRole === 'admin') {
                              updateUserRole(res.user.id, 'admin');
                            }
                            setTeamUsers(getTeamUsers());
                            setShowAddUserModal(false);
                            setNewUserName('');
                            setNewUserEmail('');
                            showToast(`เพิ่มผู้ใช้ ${newUserName} เรียบร้อย!`);
                          } else {
                            showToast(res.error || 'ไม่สามารถเพิ่มผู้ใช้ได้');
                          }
                        }}
                        className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition cursor-pointer shadow-md"
                      >
                        บันทึกผู้ใช้
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* TAB 3: WIDGET BUILDER */}
          {activeTab === 'widgets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">สตูดิโอสร้างวิดเจ็ตใหม่ (Widget Builder)</h2>
                  <p className="text-xs text-slate-400">
                    สำหรับนักพัฒนา: สร้าง ออกแบบ ปรับแต่ง และควบคุมเวอร์ชันของ Custom Widgets ก่อน Publish สู่ Dashboard Studio
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newW = {
                      id: `cw-${Date.now()}`,
                      name: 'New Custom Widget',
                      category: 'Custom Code',
                      version: 'v1.0-dev',
                      published: false,
                      lastUpdated: 'เพิ่งสร้าง',
                    };
                    setCustomWidgets([...customWidgets, newW]);
                    showToast('สร้าง Widget Template ใหม่แล้ว');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ สร้าง Widget ใหม่</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {customWidgets.map((cw) => (
                  <div
                    key={cw.id}
                    className="p-4 rounded-xl bg-[#16122c] border border-[#2a2252] hover:border-violet-500/60 transition flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] bg-violet-950 text-violet-300 border border-violet-800/50 px-2 py-0.5 rounded font-mono">
                          {cw.category}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            cw.published
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {cw.published ? 'Published' : 'Draft Dev'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-2">{cw.name}</h3>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>เวอร์ชัน: <span className="text-violet-300 font-mono">{cw.version}</span></span>
                        <span>•</span>
                        <span>{cw.lastUpdated}</span>
                      </div>
                    </div>

                    <div className="pt-3 mt-4 border-t border-[#261e47] flex items-center justify-between">
                      <button
                        onClick={() => {
                          const nextV = `v${(parseFloat(cw.version.replace('v', '')) + 0.1).toFixed(1)}`;
                          setCustomWidgets(
                            customWidgets.map((item) =>
                              item.id === cw.id ? { ...item, version: nextV, published: true } : item
                            )
                          );
                          showToast(`เผยแพร่ ${cw.name} เวอร์ชัน ${nextV} สู่ระบบแล้ว!`);
                        }}
                        className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Publish Widget</span>
                      </button>

                      <button
                        onClick={() => {
                          setCustomWidgets(customWidgets.filter((item) => item.id !== cw.id));
                          showToast(`ลบ Widget ${cw.name} แล้ว`);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 transition cursor-pointer"
                        title="ลบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: THEME BUILDER (TOYOTA, HP, FEDEX, DHL) */}
          {activeTab === 'themes' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">ระบบธีมองค์กรและแบรนด์ (Corporate Themes)</h2>
                <p className="text-xs text-slate-400">
                  สลับธีมอัตลักษณ์องค์กรสำเร็จรูป (Toyota, HP, FedEx, DHL) หรือปรับแต่งสีและรูปแบบการ์ดได้อิสระ
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {corporateThemes.map((ct) => (
                  <div
                    key={ct.id}
                    onClick={() => {
                      setActiveCorporateTheme(ct.id);
                      showToast(`เปิดใช้งานธีมองค์กร: ${ct.name}`);
                    }}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      activeCorporateTheme === ct.id
                        ? 'bg-[#20183b] border-violet-500 shadow-lg shadow-violet-950/60'
                        : 'bg-[#16122c] border-[#2a2252] hover:border-[#3d3175]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{ct.name}</span>
                        {activeCorporateTheme === ct.id && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                            กำลังใช้งาน (Active)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">สีหลัก:</span>
                          <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: ct.primary }} />
                          <span className="text-[10px] font-mono text-slate-300">{ct.primary}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">สีรอง:</span>
                          <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: ct.secondary }} />
                          <span className="text-[10px] font-mono text-slate-300">{ct.secondary}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2">
                        <span>ฟอนต์: <span className="text-white">{ct.font}</span></span>
                        <span>•</span>
                        <span>ขอบมน: <span className="text-white">{ct.radius}</span></span>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#261f47] flex justify-end">
                      <button
                        type="button"
                        className="px-3 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
                      >
                        นำธีมนี้ไปใช้ในสตูดิโอ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: DATA SOURCE MANAGER */}
          {activeTab === 'datasources' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">จัดการการเชื่อมต่อแหล่งข้อมูล (Data Sources)</h2>
                  <p className="text-xs text-slate-400">
                    มอนิเตอร์และทดสอบสถานะการเชื่อมต่อ Google Sheets, MySQL, PostgreSQL, REST API และ SQL Server
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newDs: DevDataSource = {
                      id: `ds-${Date.now()}`,
                      name: 'New Data Connection',
                      type: 'postgres',
                      status: 'connected',
                      lastSync: 'เพิ่งเชื่อมต่อ',
                      recordCount: 0,
                      syncTimeMs: 140,
                    };
                    setDataSources([...dataSources, newDs]);
                    showToast('เพิ่ม Data Source ใหม่เรียบร้อย');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ เชื่อมต่อ Connection ใหม่</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataSources.map((ds) => (
                  <div
                    key={ds.id}
                    className="p-4 rounded-xl bg-[#16122c] border border-[#2a2252] flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-violet-400" />
                          <h3 className="text-sm font-bold text-white">{ds.name}</h3>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            ds.status === 'connected'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : ds.status === 'degraded'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {ds.status === 'connected' && '● Connected'}
                          {ds.status === 'degraded' && '▲ Degraded'}
                          {ds.status === 'offline' && '✕ Offline'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 p-2.5 rounded-lg bg-[#110d24] border border-[#231a44] text-[11px]">
                        <div>
                          <div className="text-slate-400 text-[10px]">ประเภท:</div>
                          <div className="font-mono text-violet-300 uppercase">{ds.type}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px]">จำนวนแถว:</div>
                          <div className="font-mono text-white">{ds.recordCount.toLocaleString()} แถว</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px]">Latency:</div>
                          <div className="font-mono text-emerald-400">{ds.syncTimeMs} ms</div>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 mt-2">
                        ซิงค์ล่าสุด: <span className="text-slate-300">{ds.lastSync}</span>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#261e47] flex items-center justify-between">
                      <button
                        onClick={() => {
                          showToast(`ทดสอบเชื่อมต่อ ${ds.name} สำเร็จ! (Response: 45ms)`);
                        }}
                        className="px-2.5 py-1 rounded bg-[#241c47] hover:bg-[#322663] text-violet-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Play className="w-3 h-3 text-emerald-400" />
                        <span>ทดสอบเชื่อมต่อ (Test)</span>
                      </button>

                      <button
                        onClick={() => {
                          setDataSources(dataSources.filter((item) => item.id !== ds.id));
                          showToast(`ยกเลิก Connection ${ds.name} แล้ว`);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 transition cursor-pointer"
                        title="ลบการเชื่อมต่อ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: QUERY MONITOR */}
          {activeTab === 'queries' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">ตรวจสอบเวลาประมวลผลคิวรี่ (Query Monitor & Performance)</h2>
                <p className="text-xs text-slate-400">
                  ดูว่าวิชวลหรือการคำนวณใดใช้เวลาโหลดนาน เพื่อปรับแต่งการรวมข้อมูล (Aggregation) ให้รวดเร็ว
                </p>
              </div>

              <div className="rounded-xl border border-[#2a2252] bg-[#16122c] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#2a2252] bg-[#1a1535] text-slate-400 font-semibold">
                      <th className="py-3 px-4">วิชวล / วิดเจ็ต</th>
                      <th className="py-3 px-4">แดชบอร์ด</th>
                      <th className="py-3 px-4">แถวข้อมูลที่ประมวลผล</th>
                      <th className="py-3 px-4">ความเร็วการคำนวณ (Execution Time)</th>
                      <th className="py-3 px-4">ประสิทธิภาพ (Status)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#241c45] text-slate-300 font-mono">
                    {queryStats.map((qs) => (
                      <tr key={qs.id} className="hover:bg-[#1e183e] transition">
                        <td className="py-3 px-4 font-sans font-bold text-white">{qs.widgetTitle}</td>
                        <td className="py-3 px-4 font-sans text-slate-400">{qs.dashboardName}</td>
                        <td className="py-3 px-4">{qs.rowsProcessed.toLocaleString()} rows</td>
                        <td className="py-3 px-4 font-bold text-violet-300">{qs.executionTimeMs} ms</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans border ${
                              qs.status === 'fast'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : qs.status === 'moderate'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}
                          >
                            {qs.status === 'fast' && '⚡ เร็วมาก (Fast)'}
                            {qs.status === 'moderate' && '⏱ ปานกลาง (Moderate)'}
                            {qs.status === 'slow' && '🐢 โหลดช้า (Optimize Needed)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: ERROR CENTER */}
          {activeTab === 'errors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">ศูนย์รวมข้อผิดพลาด (Error Center)</h2>
                  <p className="text-xs text-slate-400">
                    ติดตาม Formula Error, API Error, Sheet Missing และ Connection Failed พร้อม Stack Trace ละเอียด
                  </p>
                </div>
                <button
                  onClick={() => {
                    setErrorLogs(errorLogs.map((e) => ({ ...e, resolved: true })));
                    showToast('มาร์กทุกข้อผิดพลาดเป็น Resolved แล้ว');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#241c47] hover:bg-[#322663] text-violet-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>มาร์กแก้ปัญหาทั้งหมดแล้ว (Resolve All)</span>
                </button>
              </div>

              <div className="space-y-3">
                {errorLogs.map((err) => (
                  <div
                    key={err.id}
                    className={`p-4 rounded-xl border transition ${
                      err.resolved
                        ? 'bg-[#151126]/60 border-[#241d44] opacity-60'
                        : 'bg-[#1e152e] border-rose-500/40 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${err.resolved ? 'text-slate-400' : 'text-rose-400'}`} />
                        <span className="font-bold text-white text-xs">{err.category}</span>
                        <span className="text-[10px] text-slate-400">• {err.datetime}</span>
                        <span className="text-[10px] bg-[#291f48] text-violet-300 px-1.5 py-0.2 rounded font-mono">
                          User: {err.user}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setErrorLogs(
                            errorLogs.map((e) =>
                              e.id === err.id ? { ...e, resolved: !e.resolved } : e
                            )
                          );
                          showToast(err.resolved ? 'เปลี่ยนเป็น Unresolved' : 'แก้ไขปัญหาแล้ว');
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition cursor-pointer ${
                          err.resolved
                            ? 'bg-slate-800 text-slate-400 hover:text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {err.resolved ? 'แก้ไขแล้ว (Resolved)' : '✓ มาร์กเป็น Resolved'}
                      </button>
                    </div>

                    <div className="text-xs text-rose-200 mt-2 font-medium">{err.detail}</div>

                    <div className="mt-2 p-2.5 rounded-lg bg-[#0d0a1a] border border-[#21193d] font-mono text-[10px] text-slate-400 overflow-x-auto">
                      <pre>{err.stackTrace}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: DASHBOARD ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">วิเคราะห์การใช้งานแดชบอร์ด (Dashboard Analytics)</h2>
                <p className="text-xs text-slate-400">
                  สถิติจำนวนครั้งการเข้าชม ผู้ใช้ที่ไม่ซ้ำ และระยะเวลาเฉลี่ยบนหน้าจอแดชบอร์ด
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-[#16122c] border border-[#2a2252]">
                  <div className="text-[11px] text-slate-400 font-medium">ยอดเข้าชมทั้งหมด (Total Views)</div>
                  <div className="text-2xl font-black text-white mt-1">2,855 ครั้ง</div>
                  <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    <span>+18.4% จากเดือนที่แล้ว</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#16122c] border border-[#2a2252]">
                  <div className="text-[11px] text-slate-400 font-medium">ผู้ใช้งานจริง (Active Users)</div>
                  <div className="text-2xl font-black text-violet-300 mt-1">142 คน</div>
                  <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    <span>+9.2% สัปดาห์นี้</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#16122c] border border-[#2a2252]">
                  <div className="text-[11px] text-slate-400 font-medium">เวลาเฉลี่ยบนแดชบอร์ด</div>
                  <div className="text-2xl font-black text-amber-300 mt-1">4m 32s</div>
                  <div className="text-[10px] text-slate-400 mt-1">เวลาพิจารณาตัดสินใจ</div>
                </div>
                <div className="p-4 rounded-xl bg-[#16122c] border border-[#2a2252]">
                  <div className="text-[11px] text-slate-400 font-medium">การส่งออกรายงาน (Exports)</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">318 ครั้ง</div>
                  <div className="text-[10px] text-slate-400 mt-1">PDF / Excel / Images</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#16122c] border border-[#2a2252] space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  อันดับแดชบอร์ดยอดนิยม (Top Dashboards Ranking)
                </h3>
                <div className="space-y-2">
                  {[
                    { name: 'ภาพรวมยอดขาย & KPI ผู้บริหาร', views: 1245, pct: 100, team: 'Management' },
                    { name: 'KDC Operations & Logistics', views: 980, pct: 78, team: 'Supply Chain' },
                    { name: 'Inventory & Stock Matrix', views: 420, pct: 33, team: 'Warehouse' },
                    { name: 'Financial P&L Cockpit', views: 310, pct: 24, team: 'Finance' },
                  ].map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-3 text-xs">
                      <span className="w-5 font-bold font-mono text-slate-400">#{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-bold text-white">{item.name}</span>
                          <span className="text-violet-300 font-mono font-semibold">{item.views.toLocaleString()} วิว</span>
                        </div>
                        <div className="w-full bg-[#241c45] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-violet-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: TEMPLATE MANAGER & DISTRIBUTION */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-violet-400" />
                    <span>คลังแม่แบบแดชบอร์ดและการส่งมอบงานให้ทีม (Template Distribution)</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    สร้างเทมเพลตจากระบบหลังบ้าน และเลือกได้ว่าจะส่งเทมเพลตนี้ไปให้ User คนไหนบ้างในทีม
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateTemplateModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ บันทึกแดชบอร์ดปัจจุบันเป็นเทมเพลต</span>
                </button>
              </div>

              {/* Template list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templatesList.map((tpl) => {
                  const isAll = tpl.assignedToUserIds.includes('all');
                  const assignedUsers = teamUsers.filter((u) => tpl.assignedToUserIds.includes(u.id));

                  return (
                    <div
                      key={tpl.id}
                      className="p-4 rounded-xl bg-[#16122c] border border-[#2a2252] hover:border-violet-500/50 transition flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30">
                              {tpl.category}
                            </span>
                            <h3 className="text-sm font-bold text-white mt-1.5">{tpl.title || tpl.name}</h3>
                          </div>
                          <button
                            onClick={() => {
                              const updated = deleteDashboardTemplate(tpl.id);
                              setTemplatesList(updated);
                              showToast(`ลบเทมเพลต "${tpl.title || tpl.name}" แล้ว`);
                            }}
                            className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                            title="ลบเทมเพลต"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">{tpl.description}</p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                          <span>📦 <strong>{tpl.widgets.length}</strong> วิดเจ็ต</span>
                          <span>•</span>
                          <span>สร้างโดย {tpl.createdBy}</span>
                          <span>•</span>
                          <span>{tpl.createdAt}</span>
                        </div>
                      </div>

                      {/* Recipient Users Display */}
                      <div className="pt-3 border-t border-[#251d45] space-y-2">
                        <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                          <span>ผู้ใช้ที่ได้รับสิทธิ์เทมเพลตนี้:</span>
                          <button
                            onClick={() => {
                              setDistributeModalTpl(tpl);
                              setSelectedUserIdsToDistribute([...tpl.assignedToUserIds]);
                            }}
                            className="text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <Send className="w-3 h-3" />
                            <span>แก้ไขผู้รับ</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {isAll ? (
                            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>สมาชิกทุกคนในทีม (All Members)</span>
                            </span>
                          ) : assignedUsers.length > 0 ? (
                            assignedUsers.map((u) => (
                              <span
                                key={u.id}
                                className="text-[11px] bg-violet-500/20 text-violet-200 border border-violet-500/30 px-2 py-0.5 rounded-md flex items-center gap-1"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                <span>{u.displayName}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">
                              ยังไม่ได้ส่งให้ผู้ใช้คนใด
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setDistributeModalTpl(tpl);
                            setSelectedUserIdsToDistribute([...tpl.assignedToUserIds]);
                          }}
                          className="w-full mt-2 py-1.5 rounded-lg bg-[#221b44] hover:bg-violet-600 hover:text-white text-slate-300 border border-[#372b69] text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>เลือกส่งเทมเพลตนี้ไปยัง User</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Create Template Modal */}
              {showCreateTemplateModal && (
                <div
                  className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
                  onClick={() => setShowCreateTemplateModal(false)}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg bg-[#16122c] border border-violet-500/40 rounded-2xl shadow-2xl p-6 text-white text-left space-y-4 max-h-[90vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-violet-400" />
                        <span>สร้างเทมเพลตใหม่และส่งให้สมาชิกในทีม</span>
                      </h3>
                      <button
                        onClick={() => setShowCreateTemplateModal(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-300 mb-1 font-medium">ชื่อเทมเพลต:</label>
                        <input
                          type="text"
                          value={newTplTitle}
                          onChange={(e) => setNewTplTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#221b44] border border-[#372b69] text-white focus:outline-none focus:border-violet-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-medium">หมวดหมู่เทมเพลต:</label>
                        <input
                          type="text"
                          value={newTplCategory}
                          onChange={(e) => setNewTplCategory(e.target.value)}
                          placeholder="เช่น ยอดขาย, การตลาด, ผู้บริหาร"
                          className="w-full px-3 py-2 rounded-lg bg-[#221b44] border border-[#372b69] text-white focus:outline-none focus:border-violet-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-medium">คำอธิบายเทมเพลต:</label>
                        <textarea
                          rows={2}
                          value={newTplDesc}
                          onChange={(e) => setNewTplDesc(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#221b44] border border-[#372b69] text-white focus:outline-none focus:border-violet-400"
                        />
                      </div>

                      <div className="pt-2 border-t border-[#29214e]">
                        <label className="block text-slate-200 mb-2 font-bold flex items-center justify-between">
                          <span>เลือกส่งเทมเพลตนี้ให้ใครบ้าง (Select Users to Receive):</span>
                          <span className="text-[11px] text-violet-400 font-normal">
                            เลือกได้หลายคน
                          </span>
                        </label>

                        {/* All Team Toggle */}
                        <div
                          onClick={() => {
                            if (newTplSelectedUsers.includes('all')) {
                              setNewTplSelectedUsers([]);
                            } else {
                              setNewTplSelectedUsers(['all']);
                            }
                          }}
                          className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center gap-3 mb-2 ${
                            newTplSelectedUsers.includes('all')
                              ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                              : 'bg-[#221b44] border-[#372b69] text-slate-300'
                          }`}
                        >
                          {newTplSelectedUsers.includes('all') ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                          <div>
                            <div className="font-bold text-xs">👥 ส่งให้สมาชิกทุกคนในทีม (All Team Members)</div>
                            <div className="text-[10px] opacity-80">ผู้ใช้ทุกคนในทีมจะเห็นเทมเพลตนี้ทันทีเมื่อเข้าใช้งาน</div>
                          </div>
                        </div>

                        {/* Individual Users List */}
                        {!newTplSelectedUsers.includes('all') && (
                          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                            {teamUsers.map((u) => {
                              const isChecked = newTplSelectedUsers.includes(u.id);
                              return (
                                <div
                                  key={u.id}
                                  onClick={() => {
                                    if (isChecked) {
                                      setNewTplSelectedUsers(newTplSelectedUsers.filter((id) => id !== u.id));
                                    } else {
                                      setNewTplSelectedUsers([...newTplSelectedUsers, u.id]);
                                    }
                                  }}
                                  className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                                    isChecked
                                      ? 'bg-violet-950/50 border-violet-500 text-violet-200'
                                      : 'bg-[#1c1638] border-[#29204e] text-slate-400 hover:text-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {isChecked ? (
                                      <CheckSquare className="w-4 h-4 text-violet-400" />
                                    ) : (
                                      <Square className="w-4 h-4 text-slate-500" />
                                    )}
                                    <div>
                                      <div className="font-bold text-xs text-white">{u.displayName}</div>
                                      <div className="text-[10px] text-slate-400">{u.email} ({u.department})</div>
                                    </div>
                                  </div>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">
                                    {u.role}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setShowCreateTemplateModal(false)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#241c47] hover:bg-[#322663] text-slate-300 text-xs transition cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newTplTitle.trim()) {
                            showToast('กรุณาระบุชื่อเทมเพลต');
                            return;
                          }
                          const recipients = newTplSelectedUsers.length > 0 ? newTplSelectedUsers : ['all'];
                          const created = createDashboardTemplate(
                            newTplTitle,
                            newTplDesc,
                            newTplCategory,
                            currentWidgets,
                            recipients,
                            'Thirawat (Admin)'
                          );
                          setTemplatesList(getDashboardTemplates());
                          setTeamUsers(getTeamUsers());
                          setShowCreateTemplateModal(false);
                          showToast(`สร้างเทมเพลต "${created.title}" และแจกจ่ายให้ทีมเรียบร้อย!`);
                        }}
                        className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition cursor-pointer shadow-md flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>บันทึกและส่งมอบเทมเพลต</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Distribute Existing Template Modal */}
              {distributeModalTpl && (
                <div
                  className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
                  onClick={() => setDistributeModalTpl(null)}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-[#16122c] border border-violet-500/40 rounded-2xl shadow-2xl p-6 text-white text-left space-y-4 max-h-[90vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Send className="w-5 h-5 text-violet-400" />
                          <span>เลือกส่งเทมเพลตให้สมาชิกในทีม</span>
                        </h3>
                        <div className="text-xs text-violet-300 mt-0.5 font-semibold">
                          "{distributeModalTpl.title || distributeModalTpl.name}"
                        </div>
                      </div>
                      <button
                        onClick={() => setDistributeModalTpl(null)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* All Members Option */}
                      <div
                        onClick={() => {
                          if (selectedUserIdsToDistribute.includes('all')) {
                            setSelectedUserIdsToDistribute([]);
                          } else {
                            setSelectedUserIdsToDistribute(['all']);
                          }
                        }}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
                          selectedUserIdsToDistribute.includes('all')
                            ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                            : 'bg-[#221b44] border-[#372b69] text-slate-300'
                        }`}
                      >
                        {selectedUserIdsToDistribute.includes('all') ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                        <div>
                          <div className="font-bold text-xs">👥 ส่งให้สมาชิกทุกคนในทีม (All Members)</div>
                          <div className="text-[10px] opacity-80">ผู้ใช้ทุกคนในทีมจะเข้าถึงเทมเพลตนี้ได้</div>
                        </div>
                      </div>

                      {/* Individual Members List */}
                      {!selectedUserIdsToDistribute.includes('all') && (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          <div className="text-[11px] font-bold text-slate-400">ระบุผู้ใช้รายบุคคล:</div>
                          {teamUsers.map((u) => {
                            const isChecked = selectedUserIdsToDistribute.includes(u.id);
                            return (
                              <div
                                key={u.id}
                                onClick={() => {
                                  if (isChecked) {
                                    setSelectedUserIdsToDistribute(
                                      selectedUserIdsToDistribute.filter((id) => id !== u.id)
                                    );
                                  } else {
                                    setSelectedUserIdsToDistribute([...selectedUserIdsToDistribute, u.id]);
                                  }
                                }}
                                className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                                  isChecked
                                    ? 'bg-violet-950/50 border-violet-500 text-violet-200'
                                    : 'bg-[#1c1638] border-[#29204e] text-slate-400 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-violet-400" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-500" />
                                  )}
                                  <div>
                                    <div className="font-bold text-xs text-white">{u.displayName}</div>
                                    <div className="text-[10px] text-slate-400">{u.email} ({u.department})</div>
                                  </div>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">
                                  {u.role}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setDistributeModalTpl(null)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#241c47] hover:bg-[#322663] text-slate-300 text-xs transition cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const targets =
                            selectedUserIdsToDistribute.length > 0 ? selectedUserIdsToDistribute : ['all'];
                          distributeTemplateToUsers(distributeModalTpl.id, targets);
                          setTemplatesList(getDashboardTemplates());
                          setTeamUsers(getTeamUsers());
                          setDistributeModalTpl(null);
                          showToast(`อัปเดตการส่งมอบเทมเพลต "${distributeModalTpl.title || distributeModalTpl.name}" แล้ว!`);
                        }}
                        className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition cursor-pointer shadow-md flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>ยืนยันการส่งมอบเทมเพลต</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 10: VERSION CONTROL (GIT FOR DASHBOARD) */}
          {activeTab === 'versions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">ประวัติเวอร์ชันและการย้อนกลับ (Git for Dashboard)</h2>
                  <p className="text-xs text-slate-400">
                    บันทึก Commit ทุกการปรับเปลี่ยนโครงสร้างผืนงาน สามารถกด Rollback ย้อนคืนได้ทันที 1 คลิก
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newVer = {
                      version: `v1.${versions.length + 1}`,
                      timestamp: 'เพิ่งบันทึก',
                      author: 'Thirawat (Admin)',
                      message: 'สแนปช็อตสถานะล่าสุดของผืนงานแดชบอร์ด',
                      widgetsCount: currentWidgets.length,
                      isActive: true,
                    };
                    setVersions([
                      newVer,
                      ...versions.map((v) => ({ ...v, isActive: false })),
                    ]);
                    showToast(`Commit เวอร์ชัน ${newVer.version} เรียบร้อย!`);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ บันทึก Commit เวอร์ชันใหม่</span>
                </button>
              </div>

              <div className="space-y-3">
                {versions.map((v) => (
                  <div
                    key={v.version}
                    className={`p-4 rounded-xl border transition flex items-center justify-between ${
                      v.isActive
                        ? 'bg-[#20183b] border-violet-500 shadow-lg shadow-violet-950/40'
                        : 'bg-[#16122c] border-[#2a2252]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#271f49] text-violet-300 mt-0.5">
                        <GitBranch className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm font-mono">{v.version}</span>
                          {v.isActive && (
                            <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                              เวอร์ชันปัจจุบัน (Active)
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">• {v.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{v.message}</p>
                        <div className="text-[11px] text-slate-400 mt-1">
                          ผู้บันทึก: <span className="text-violet-300">{v.author}</span> | {v.widgetsCount} วิดเจ็ต
                        </div>
                      </div>
                    </div>

                    {!v.isActive && (
                      <button
                        onClick={() => {
                          setVersions(
                            versions.map((item) => ({
                              ...item,
                              isActive: item.version === v.version,
                            }))
                          );
                          showToast(`Rollback ย้อนกลับสู่เวอร์ชัน ${v.version} สำเร็จ!`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600 border border-amber-500/40 text-amber-200 hover:text-white text-xs font-semibold transition cursor-pointer"
                      >
                        ย้อนกลับเวอร์ชันนี้ (Rollback)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 11: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">บันทึกกิจกรรมระบบ (Audit Log Trail)</h2>
                <p className="text-xs text-slate-400">
                  เก็บบันทึกประวัติการแก้ไข การลบ และการเปลี่ยนแปลงทุกอย่างในระบบอย่างโปร่งใส
                </p>
              </div>

              <div className="rounded-xl border border-[#2a2252] bg-[#16122c] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#2a2252] bg-[#1a1535] text-slate-400 font-semibold">
                      <th className="py-3 px-4">เวลา</th>
                      <th className="py-3 px-4">ผู้ดำเนินการ (User)</th>
                      <th className="py-3 px-4">บทบาท</th>
                      <th className="py-3 px-4">การกระทำ (Action)</th>
                      <th className="py-3 px-4">เป้าหมาย (Target)</th>
                      <th className="py-3 px-4 text-right">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#241c45] text-slate-300">
                    {auditLogs.map((al) => (
                      <tr key={al.id} className="hover:bg-[#1e183e] transition">
                        <td className="py-3 px-4 font-mono text-slate-400">{al.timestamp}</td>
                        <td className="py-3 px-4 font-bold text-white">{al.user}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-violet-300">{al.role}</td>
                        <td className="py-3 px-4">{al.action}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{al.target}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Success
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 14: WHITE LABEL SAAS */}
          {activeTab === 'whitelabel' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <h2 className="text-base font-bold text-white">ระบบไวท์เลเบลสำหรับขาย SaaS (White Label System)</h2>
                <p className="text-xs text-slate-400">
                  ปรับชื่อระบบ โดเมน โลโก้ และสีสัน เพื่อนำ Vista BI Studio ไปขายต่อเป็นซอฟต์แวร์แบรนด์ของคุณเอง
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#16122c] border border-[#2a2252] space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ชื่อองค์กร / ชื่อแบรนด์ (Company Name)
                  </label>
                  <input
                    type="text"
                    value={whiteLabel.companyName}
                    onChange={(e) => setWhiteLabel({ ...whiteLabel, companyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e0a1c] border border-[#312759] text-white text-xs outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ชื่อผลิตภัณฑ์ BI (System / Portal Name)
                  </label>
                  <input
                    type="text"
                    value={whiteLabel.systemName}
                    onChange={(e) => setWhiteLabel({ ...whiteLabel, systemName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e0a1c] border border-[#312759] text-white text-xs outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Custom Domain (โดเมนองค์กร)
                  </label>
                  <input
                    type="text"
                    value={whiteLabel.domain}
                    onChange={(e) => setWhiteLabel({ ...whiteLabel, domain: e.target.value })}
                    placeholder="เช่น analytics.yourcompany.com"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e0a1c] border border-[#312759] text-white text-xs outline-none focus:border-violet-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      สีแบรนด์หลัก (Primary Color)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={whiteLabel.primaryColor}
                        onChange={(e) => setWhiteLabel({ ...whiteLabel, primaryColor: e.target.value })}
                        className="w-8 h-8 rounded border border-[#312759] cursor-pointer"
                      />
                      <span className="font-mono text-xs text-white">{whiteLabel.primaryColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      สไตล์หน้าล็อกอิน
                    </label>
                    <select
                      value={whiteLabel.loginTheme}
                      onChange={(e) => setWhiteLabel({ ...whiteLabel, loginTheme: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e0a1c] border border-[#312759] text-white text-xs outline-none cursor-pointer"
                    >
                      <option value="modern">Modern Glass Dark</option>
                      <option value="corporate">Corporate Enterprise</option>
                      <option value="dark">Pure Midnight Black</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#261e47] flex justify-end">
                  <button
                    onClick={() => showToast('บันทึกการตั้งค่า White Label สำเร็จ')}
                    className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>บันทึกการตั้งค่าแบรนด์</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12, 13, 9: NOTIFICATIONS, BACKUP, TEMPLATES */}
          {(activeTab === 'notifications' || activeTab === 'backup' || activeTab === 'templates') && (
            <div className="p-6 rounded-xl bg-[#16122c] border border-[#2a2252] space-y-4">
              <h2 className="text-base font-bold text-white">
                {activeTab === 'notifications' && 'ศูนย์การแจ้งเตือน (Notification Center)'}
                {activeTab === 'backup' && 'ระบบสำรองข้อมูลและกู้คืน (Backup & Restore System)'}
                {activeTab === 'templates' && 'จัดการเทมเพลตองค์กร (Organization Template Manager)'}
              </h2>

              <p className="text-xs text-slate-400">
                {activeTab === 'notifications' && 'ส่งการแจ้งเตือนเมื่อ Sync ล้มเหลว, แดชบอร์ดเกิด Error หรือผู้ใช้เข้าสู่ระบบ ไปยัง Email, LINE Notify, Teams และ Slack'}
                {activeTab === 'backup' && 'กำหนดรอบการสำรองข้อมูลอัตโนมัติ (รายวัน / รายสัปดาห์ / รายเดือน) และกู้คืนข้อมูลผืนงานในคลิกเดียว'}
                {activeTab === 'templates' && 'นำเข้าหรือส่งออกแม่แบบแดชบอร์ดในรูปแบบ JSON สำหรับใช้งานร่วมกันภายในเครือบริษัท'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => showToast('ดำเนินการคำสั่งบนระบบเรียบร้อย')}
                  className="px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition cursor-pointer text-center"
                >
                  {activeTab === 'notifications' && 'ทดสอบยิง Alert ไปยัง LINE Notify'}
                  {activeTab === 'backup' && 'สร้าง Manual Backup ตอนนี้ (ZIP)'}
                  {activeTab === 'templates' && 'ส่งออกเทมเพลตทั้งหมด (Export All)'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
