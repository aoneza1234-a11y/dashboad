import React, { useState, useEffect } from 'react';
import {
  Globe,
  Users,
  Shield,
  Bot,
  Database,
  HardDrive,
  BarChart3,
  Sliders,
  Bell,
  Key,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Download,
  Upload,
  Calendar,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Cpu,
  Eye,
  LogOut,
  Smartphone,
  Server,
  Activity,
  UserCheck,
  UserX,
  FileCode,
  Settings,
} from 'lucide-react';
import {
  getSiteStatus,
  saveSiteStatus,
  toggleSiteOnline,
  logoutAdminSession,
  SiteStatus,
} from '../../services/siteStatusStore';
import {
  getTeamUsers,
  toggleUserBlockStatus,
  updateUserRole,
  deleteTeamUser,
  registerTeamUser,
} from '../../services/teamAuthStore';
import { TeamUser, VisualWidget, SalesRecord } from '../../types';

interface AdminPlatformProps {
  onBackToUserPortal?: () => void;
  onOpenViewerPortal?: () => void;
  currentWidgets?: VisualWidget[];
  currentSalesData?: SalesRecord[];
}

type AdminSection =
  | 'overview'
  | 'site_control'
  | 'users'
  | 'all_data'
  | 'storage_backup'
  | 'security'
  | 'subscriptions'
  | 'cms_seo'
  | 'portal_links';

export const AdminPlatform: React.FC<AdminPlatformProps> = ({
  onBackToUserPortal,
  onOpenViewerPortal,
  currentWidgets = [],
  currentSalesData = [],
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [siteStatus, setSiteStatus] = useState<SiteStatus>(getSiteStatus());
  const [users, setUsers] = useState<TeamUser[]>(getTeamUsers());
  const [searchUser, setSearchUser] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // New user form state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [newUserDepartment, setNewUserDepartment] = useState('Marketing');
  const [newUserPackage, setNewUserPackage] = useState<'Free' | 'Basic' | 'Pro' | 'Enterprise'>('Pro');

  // Maintenance form
  const [maintTitle, setMaintTitle] = useState(siteStatus.maintenanceTitle);
  const [maintMsg, setMaintMsg] = useState(siteStatus.maintenanceMessage);
  const [maintContact, setMaintContact] = useState(siteStatus.contactEmail || 'admin@studio-bi.com');
  const [statusSaved, setStatusSaved] = useState(false);

  // Platform & Program Name settings
  const [platformName, setPlatformName] = useState(siteStatus.platformName || 'Studio BI Analytics');
  const [platformSubtitle, setPlatformSubtitle] = useState(siteStatus.platformSubtitle || 'ระบบบริหารและวิเคราะห์แดชบอร์ดอัจฉริยะ');

  // CMS settings
  const [bannerEnabled, setBannerEnabled] = useState(siteStatus.cmsSettings?.bannerEnabled || false);
  const [bannerMsg, setBannerMsg] = useState(siteStatus.cmsSettings?.bannerMessage || '');
  const [seoTitle, setSeoTitle] = useState(siteStatus.cmsSettings?.seoTitle || '');
  const [seoDesc, setSeoDesc] = useState(siteStatus.cmsSettings?.seoDescription || '');

  // Admin Security & Route settings
  const [adminPasscode, setAdminPasscode] = useState(siteStatus.adminPasscode || 'admin1234');
  const [defaultLanding, setDefaultLanding] = useState<'studio' | 'viewer'>(siteStatus.defaultLandingPortal || 'studio');
  const [passcodeSaved, setPasscodeSaved] = useState(false);

  // Audit logs
  const [auditLogs] = useState([
    { id: '1', time: '10:45:12', user: 'admin@studio-bi.com', action: 'สลับสถานะเว็บไซต์เป็น: ออนไลน์', ip: '192.168.1.1' },
    { id: '2', time: '09:20:30', user: 'komsan.m@team.internal', action: 'สร้างแดชบอร์ดใหม่: สรุปยอดขาย Q3', ip: '110.168.4.15' },
    { id: '3', time: '08:15:00', user: 'system', action: 'สำรองข้อมูลอัตโนมัติประจำวัน (Daily Backup)', ip: '127.0.0.1' },
    { id: '4', time: '07:40:22', user: 'aoneza953@gmail.com', action: 'อัปเดตระบบความปลอดภัยและสิทธิ์การเข้าถึง', ip: '192.168.1.1' },
    { id: '5', time: '06:12:18', user: 'guest_viewer', action: 'เปิดชมแดชบอร์ดสาธารณะ (Viewer)', ip: '184.22.10.88' },
  ]);

  useEffect(() => {
    const handleStatusUpdate = () => {
      const s = getSiteStatus();
      setSiteStatus(s);
      setPlatformName(s.platformName || 'Studio BI Analytics');
      setPlatformSubtitle(s.platformSubtitle || 'ระบบบริหารและวิเคราะห์แดชบอร์ดอัจฉริยะ');
      setAdminPasscode(s.adminPasscode || 'admin1234');
      setDefaultLanding(s.defaultLandingPortal || 'studio');
    };
    window.addEventListener('site_status_changed', handleStatusUpdate);
    return () => window.removeEventListener('site_status_changed', handleStatusUpdate);
  }, []);

  const handleSaveSecurityRouting = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated = saveSiteStatus({
      adminPasscode: adminPasscode.trim() || 'admin1234',
      defaultLandingPortal: defaultLanding,
    });
    setSiteStatus(updated);
    setPasscodeSaved(true);
    setTimeout(() => setPasscodeSaved(false), 2500);
  };

  const handleLockAdminSession = () => {
    logoutAdminSession();
    if (onBackToUserPortal) {
      onBackToUserPortal();
    } else {
      window.location.href = originUrl;
    }
  };

  const handleToggleOnline = () => {
    const updated = toggleSiteOnline();
    setSiteStatus(updated);
  };

  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveSiteStatus({
      maintenanceTitle: maintTitle,
      maintenanceMessage: maintMsg,
      contactEmail: maintContact,
    });
    setSiteStatus(updated);
    setStatusSaved(true);
    setTimeout(() => setStatusSaved(false), 2500);
  };

  const handleSaveCMS = () => {
    const updated = saveSiteStatus({
      platformName: platformName.trim() || 'Studio BI Analytics',
      platformSubtitle: platformSubtitle.trim(),
      cmsSettings: {
        ...siteStatus.cmsSettings,
        bannerEnabled,
        bannerMessage: bannerMsg,
        seoTitle,
        seoDescription: seoDesc,
      },
    });
    setSiteStatus(updated);
    alert('บันทึกชื่อโปรแกรมและการตั้งค่า CMS & SEO เรียบร้อยแล้ว');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserName.trim()) return;

    registerTeamUser(
      newUserName.trim(),
      newUserEmail.trim(),
      'password123',
      newUserDepartment || 'ทั่วไป'
    );

    setUsers(getTeamUsers());
    setShowAddUserModal(false);
    setNewUserEmail('');
    setNewUserName('');
  };

  const handleToggleBlock = (userId: string) => {
    toggleUserBlockStatus(userId);
    setUsers(getTeamUsers());
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้นี้ออกจากระบบ?')) {
      deleteTeamUser(userId);
      setUsers(getTeamUsers());
    }
  };

  const handleExportBackup = () => {
    const fullBackup = {
      siteStatus,
      users,
      widgets: currentWidgets,
      salesData: currentSalesData,
      exportDate: new Date().toISOString(),
      platformVersion: 'Enterprise v2.6.0',
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bi_platform_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  
  // 3 Distinct Environments
  const vercelUserProdUrl = 'https://dashboad-rose.vercel.app/';
  const devTestLabUrl = 'https://ais-dev-aa2zmjdacxdmdrezttgtgd-153425927614.asia-southeast1.run.app/test';
  const userPortalUrl = `${originUrl}/`;
  const testPortalUrl = `${originUrl}/test`;
  const viewerPortalUrl = `${originUrl}?portal=viewer`;
  const adminPortalUrl = `${originUrl}?portal=admin`;

  const copyToClip = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d091a] text-white antialiased font-sans select-none">
      {/* 1. Left Platform Sidebar */}
      <aside className="w-64 border-r border-violet-500/20 bg-[#130f24] flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                <span>ADMIN PLATFORM</span>
              </div>
              <div className="text-[10px] text-violet-400 font-mono font-semibold">
                ระบบจัดการเว็บไซต์ส่วนกลาง
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-xs font-medium">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            ควบคุมระบบ
          </div>

          <button
            onClick={() => setActiveSection('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeSection === 'overview'
                ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-900/40'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 text-violet-400" />
            <span>ภาพรวม & สถิติระบบ</span>
          </button>

          <button
            onClick={() => setActiveSection('site_control')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeSection === 'site_control'
                ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-900/40'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Server className="w-4 h-4 text-amber-400" />
              <span>เปิด-ปิดเว็บ & ปรับปรุง</span>
            </div>
            <span className={`w-2 h-2 rounded-full ${siteStatus.isOnline ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
          </button>

          <button
            onClick={() => setActiveSection('portal_links')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeSection === 'portal_links'
                ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-900/40'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ExternalLink className="w-4 h-4 text-cyan-400" />
            <span>ลิงก์ระบบทั้ง 3 เว็บ</span>
          </button>

          <div className="pt-3 px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            จัดการข้อมูล & ผู้ใช้
          </div>

          <button
            onClick={() => setActiveSection('users')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeSection === 'users'
                ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-900/40'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>จัดการผู้ใช้งาน ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('all_data')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeSection === 'all_data'
                ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-900/40'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>ข้อมูลทั้งหมด & Audit Log</span>
          </button>

          <div className="pt-3 px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            ระบบความปลอดภัย & ทรัพยากร
          </div>

          <button
            onClick={() => setActiveSection('storage_backup')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeSection === 'storage_backup'
                ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-900/40'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <HardDrive className="w-4 h-4 text-orange-400" />
            <span>พื้นที่จัดเก็บ & สำรองข้อมูล</span>
          </button>

          <button
            onClick={() => setActiveSection('security')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeSection === 'security'
                ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-900/40'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 text-teal-400" />
            <span>ความปลอดภัย & เซสชัน</span>
          </button>

          <button
            onClick={() => setActiveSection('subscriptions')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeSection === 'subscriptions'
                ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-900/40'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-pink-400" />
            <span>Subscription & รายได้</span>
          </button>

          <button
            onClick={() => setActiveSection('cms_seo')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeSection === 'cms_seo'
                ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-900/40'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FileCode className="w-4 h-4 text-yellow-400" />
            <span>CMS, แบนเนอร์ & SEO</span>
          </button>
        </nav>

        {/* Footer / Switch back to User Portal */}
        <div className="p-3 border-t border-white/10 bg-[#0e0a1c]">
          <button
            onClick={onBackToUserPortal}
            className="w-full py-2.5 px-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/40 text-violet-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>สลับไปยังเว็บไซต์ผู้ใช้</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Administration Workspace */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0d091a]">
        {/* Top bar for admin */}
        <header className="h-16 border-b border-violet-500/20 px-6 flex items-center justify-between bg-[#130f24]/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-extrabold text-white">
              {activeSection === 'overview' && 'ภาพรวมสถานะระบบ (Platform Overview)'}
              {activeSection === 'site_control' && 'จัดการเปิด-ปิดเว็บไซต์ & ปรับปรุงระบบ (Site Maintenance)'}
              {activeSection === 'portal_links' && 'ลิงก์ระบบทั้ง 3 เว็บ (Platform Portals)'}
              {activeSection === 'users' && 'จัดการผู้ใช้งาน & แพ็กเกจสมาชิก (User Management)'}
              {activeSection === 'all_data' && 'จัดการข้อมูลทั้งหมด & ประวัติระบบ (Data & Audit)'}
              {activeSection === 'storage_backup' && 'พื้นที่จัดเก็บ & สำรองกู้คืน (Storage & Backup)'}
              {activeSection === 'security' && 'ระบบความปลอดภัย & เซสชัน (Security & Sessions)'}
              {activeSection === 'subscriptions' && 'แพ็กเกจสมาชิก & รายได้ (Subscriptions & Billing)'}
              {activeSection === 'cms_seo' && 'CMS ข่าวสาร, แบนเนอร์ประกาศ & SEO (Content Management)'}
            </h1>
          </div>

          {/* Quick status & Direct Navigation to User Portal */}
          <div className="flex items-center gap-2.5">
            {/* Master Site Toggle */}
            <button
              onClick={handleToggleOnline}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md ${
                siteStatus.isOnline
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 animate-pulse'
              }`}
              title={siteStatus.isOnline ? 'คลิกเพื่อปิดเว็บไซต์สำหรับผู้ใช้' : 'คลิกเพื่อเปิดเว็บไซต์สำหรับผู้ใช้'}
            >
              <span className={`w-2 h-2 rounded-full ${siteStatus.isOnline ? 'bg-emerald-400' : 'bg-rose-400 animate-ping'}`} />
              <span>{siteStatus.isOnline ? 'เว็บผู้ใช้: เปิดอยู่' : 'เว็บผู้ใช้: ปิดปรับปรุง'}</span>
            </button>

            {/* Direct button to enter User Website */}
            <button
              onClick={onBackToUserPortal}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-violet-900/40"
              title="เข้าสู่หน้าสร้างแดชบอร์ดของผู้ใช้งาน (User Portal / Studio)"
            >
              <Eye className="w-3.5 h-3.5 text-violet-200" />
              <span>เข้าสู่เว็บไซต์ผู้ใช้</span>
            </button>

            {/* Quick Viewer */}
            <button
              onClick={onOpenViewerPortal || (() => window.open(viewerPortalUrl, '_blank'))}
              className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="เปิดดูแดชบอร์ดในมุมมองผู้ชม (Viewer Portal)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">ดูเว็บผู้ชม</span>
            </button>

            <button
              onClick={handleExportBackup}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer border border-white/10"
              title="สำรองข้อมูลด่วนเป็น JSON"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Content body based on active section */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* SECTION: Overview */}
          {activeSection === 'overview' && (
            <div className="space-y-6 max-w-6xl">
              {/* HERO MASTER CONTROL CARD: เปิด-ปิดเว็บไซต์สำหรับผู้ใช้ & เข้าสู่หน้าเว็บ */}
              <div
                className={`p-6 rounded-3xl border transition-all duration-300 shadow-2xl relative overflow-hidden ${
                  siteStatus.isOnline
                    ? 'bg-gradient-to-r from-emerald-950/40 via-[#1b143a] to-[#120e26] border-emerald-500/40 shadow-emerald-950/20'
                    : 'bg-gradient-to-r from-rose-950/50 via-[#211129] to-[#120e26] border-rose-500/50 shadow-rose-950/30'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg shrink-0 ${
                          siteStatus.isOnline
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                        }`}
                      >
                        <Server className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-base font-black text-white tracking-tight">
                            ศูนย์ควบคุมสถานะเว็บไซต์สำหรับผู้ใช้ (User Website Master Control)
                          </h2>
                          <span
                            className={`px-3 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm ${
                              siteStatus.isOnline
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                siteStatus.isOnline ? 'bg-emerald-400' : 'bg-rose-400 animate-ping'
                              }`}
                            />
                            <span>
                              {siteStatus.isOnline
                                ? 'เปิดให้บริการปกติ (ONLINE)'
                                : 'ปิดปรับปรุงชั่วคราว (MAINTENANCE)'}
                            </span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                          {siteStatus.isOnline
                            ? 'เว็บไซต์สำหรับผู้ใช้งานเปิดให้บริการตามปกติ สมาชิกสามารถเข้าสร้างและแก้ไขแดชบอร์ดได้ และผู้ชมสามารถเข้าดูรายงานได้ตลอด 24 ชั่วโมง'
                            : 'เว็บไซต์สำหรับผู้ใช้งานและผู้ชมถูกปิดปรับปรุงชั่วคราว บุคคลทั่วไปที่เข้าชมจะเห็นหน้าจอ Maintenance (ผู้ดูแลระบบสามารถเข้าดูตัวอย่างได้เสมอ)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions on Master Card */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {/* Toggle Button */}
                    <button
                      onClick={handleToggleOnline}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg ${
                        siteStatus.isOnline
                          ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/40 shadow-rose-900/30'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 shadow-emerald-900/30'
                      }`}
                      title="สลับสถานะเปิด-ปิดเว็บไซต์สำหรับผู้ใช้ทันที"
                    >
                      {siteStatus.isOnline ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                      <span>
                        {siteStatus.isOnline
                          ? 'คลิกเพื่อปิดเว็บสำหรับผู้ใช้'
                          : 'คลิกเพื่อเปิดเว็บสำหรับผู้ใช้'}
                      </span>
                    </button>

                    {/* Direct Go to User Website */}
                    <button
                      onClick={() => window.open(userPortalUrl, '_blank')}
                      className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-violet-900/40"
                      title="เปิดหน้าเว็บสำหรับผู้ใช้งานในแท็บใหม่ (ผู้ใช้จะเริ่มต้นด้วยการสมัครสมาชิก/เข้าสู่ระบบ)"
                    >
                      <ExternalLink className="w-4 h-4 text-violet-200" />
                      <span>เปิดเว็บผู้ใช้ (แท็บใหม่)</span>
                    </button>

                    <button
                      onClick={onBackToUserPortal}
                      className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="สลับไปยังหน้าเว็บสตูดิโอผู้ใช้งานในแท็บนี้"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>สลับไปหน้าผู้ใช้</span>
                    </button>

                    {/* Viewer Portal */}
                    <button
                      onClick={onOpenViewerPortal || (() => window.open(viewerPortalUrl, '_blank'))}
                      className="px-3.5 py-2.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="เปิดดูหน้าจอในมุมมองของผู้ชม (Viewer Portal)"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>ดูเว็บผู้ชม</span>
                    </button>

                    {/* Quick Config Link */}
                    <button
                      onClick={() => setActiveSection('site_control')}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                      title="ตั้งค่าข้อความและเวลาในหน้าปิดปรับปรุง"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#16112d] border border-violet-500/30">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>ผู้ใช้งานทั้งหมด</span>
                    <Users className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-2">{users.length} คน</div>
                  <div className="text-[11px] text-emerald-400 mt-1">ออนไลน์พร้อมกัน 3 คน</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#16112d] border border-violet-500/30">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>จำนวนผู้เข้าชม (Viewers)</span>
                    <Eye className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-2">
                    {siteStatus.viewerConfig?.totalViewsCount || 142} ครั้ง
                  </div>
                  <div className="text-[11px] text-cyan-400 mt-1">จากลิงก์สาธารณะ</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#16112d] border border-violet-500/30">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>วิดเจ็ตบนแดชบอร์ด (Widgets)</span>
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-2">
                    {currentWidgets.length > 0 ? `${currentWidgets.length} การ์ด` : '12 การ์ด'}
                  </div>
                  <div className="text-[11px] text-purple-400 mt-1">พร้อมใช้งานในสตูดิโอ</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#16112d] border border-violet-500/30">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>รายได้รวม (MRR)</span>
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-2">฿48,500</div>
                  <div className="text-[11px] text-emerald-400 mt-1">+14% เทียบเดือนก่อน</div>
                </div>
              </div>

              {/* System Portal Quick Access */}
              <div className="p-5 rounded-2xl bg-[#16112d] border border-violet-500/30 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-violet-400" />
                    <span>ระบบแยก 3 เว็บไซต์สมบูรณ์แบบ (Production / QA Test / ระบบหลังบ้าน Admin)</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>ซิงค์คำสั่งแบบ Real-time ข้ามเว็บ</span>
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* 1. Production User Website (Vercel) */}
                  <div className="p-3.5 rounded-xl bg-[#1a1435] border border-blue-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-300">1. เว็บไซต์จริงผู้ใช้งาน (Production Web)</span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold">Vercel</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      เว็บจริงสำหรับผู้ใช้งาน & ลูกค้า (<span className="text-blue-300 font-mono">dashboad-rose.vercel.app</span>) สะอาด 100% ไม่มีปุ่มเทส
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => window.open(vercelUserProdUrl, '_blank')}
                        className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer shadow-md"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>เปิดเว็บจริง Vercel</span>
                      </button>
                      <button
                        onClick={() => copyToClip(vercelUserProdUrl, 'vercel')}
                        className="p-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-500/40 text-blue-200 transition cursor-pointer"
                        title="คัดลอกลิงก์ Vercel"
                      >
                        {copiedLink === 'vercel' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* 2. QA Test Lab (Dev / Test) */}
                  <div className="p-3.5 rounded-xl bg-[#1e153b] border border-purple-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300">2. ห้องทดสอบระบบ (QA Test Lab)</span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono font-bold">Dev / Test</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      เว็บสำหรับทดสอบระบบ สลับ Persona 3 บัญชี ปรับแต่งฟีเจอร์ก่อนปล่อยขึ้นเว็บจริง
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => window.open(devTestLabUrl, '_blank')}
                        className="flex-1 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer shadow-md"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>เปิดห้องทดสอบ QA</span>
                      </button>
                      <button
                        onClick={() => copyToClip(devTestLabUrl, 'dev_test')}
                        className="p-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-200 transition cursor-pointer"
                        title="คัดลอกลิงก์ทดสอบ"
                      >
                        {copiedLink === 'dev_test' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* 3. Admin Backoffice Platform */}
                  <div className="p-3.5 rounded-xl bg-[#231227] border border-rose-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300">3. ศูนย์ควบคุมหลังบ้าน (Admin Platform)</span>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold">👑 Admin Master</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      ควบคุมสั่งปรับปรุง ปิด-เปิดเว็บ ส่งแจ้งเตือนแบนเนอร์ และคุมสิทธิ์ผู้ใช้ทุกเว็บ
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="flex-1 py-1.5 rounded-lg bg-rose-600/30 border border-rose-500/40 text-rose-200 text-xs font-bold text-center">
                        ✓ กำลังใช้งานอยู่
                      </div>
                      <button
                        onClick={() => copyToClip(adminPortalUrl, 'admin')}
                        className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-200 transition cursor-pointer"
                        title="คัดลอกลิงก์ระบบหลังบ้าน"
                      >
                        {copiedLink === 'admin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Audit Logs */}
              <div className="p-5 rounded-2xl bg-[#16112d] border border-violet-500/30 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>บันทึกกิจกรรมล่าสุดของระบบ (System Activity Logs)</span>
                </h3>
                <div className="divide-y divide-white/5 text-xs">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-400 text-[11px]">{log.time}</span>
                        <span className="text-violet-300 font-semibold">{log.user}</span>
                        <span className="text-slate-200">{log.action}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{log.ip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Site Control */}
          {activeSection === 'site_control' && (
            <div className="space-y-6 max-w-4xl">
              {/* Online/Offline Toggle */}
              <div className="p-6 rounded-3xl bg-[#16112d] border border-violet-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      สวิตช์สถานะเปิดให้บริการเว็บไซต์สำหรับผู้ใช้ (Master Site Switch)
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      เมื่อปิดใช้งาน ผู้ใช้ทั่วไปที่เปิดหน้าเว็บ Dashboard และผู้ชมจะพบหน้า 'เว็บไซต์ปิดปรับปรุงชั่วคราว'
                    </p>
                  </div>
                  <button
                    onClick={handleToggleOnline}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shrink-0 ${
                      siteStatus.isOnline
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40 animate-pulse'
                    }`}
                  >
                    {siteStatus.isOnline ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    <span>{siteStatus.isOnline ? 'ออนไลน์ (เปิดให้ใช้งานปกติ)' : 'ปิดปรับปรุง (Maintenance Mode)'}</span>
                  </button>
                </div>

                {/* Direct Action Bar to test the website */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    เข้าตรวจสอบหน้าเว็บเพื่อดูผลลัพธ์จริงแบบเรียลไทม์:
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onBackToUserPortal}
                      className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>เข้าสู่เว็บไซต์ผู้ใช้ (Studio)</span>
                    </button>
                    <button
                      onClick={onOpenViewerPortal || (() => window.open(viewerPortalUrl, '_blank'))}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>ดูเว็บผู้ชม (Viewer)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Maintenance Message Form */}
              <form onSubmit={handleSaveMaintenance} className="p-6 rounded-3xl bg-[#16112d] border border-violet-500/30 space-y-4">
                <h3 className="text-sm font-bold text-white">ข้อความแจ้งเตือนในหน้าปิดปรับปรุง:</h3>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">หัวข้อแจ้งเตือน (Maintenance Title):</label>
                  <input
                    type="text"
                    value={maintTitle}
                    onChange={(e) => setMaintTitle(e.target.value)}
                    className="w-full bg-[#201a40] border border-violet-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">รายละเอียดข้อความ (Maintenance Message):</label>
                  <textarea
                    rows={4}
                    value={maintMsg}
                    onChange={(e) => setMaintMsg(e.target.value)}
                    className="w-full bg-[#201a40] border border-violet-500/30 rounded-xl p-3.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">อีเมลติดต่อฝ่ายสนับสนุน:</label>
                  <input
                    type="email"
                    value={maintContact}
                    onChange={(e) => setMaintContact(e.target.value)}
                    className="w-full bg-[#201a40] border border-violet-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                {statusSaved && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>บันทึกการตั้งค่าหน้าปิดปรับปรุงเรียบร้อยแล้ว</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-violet-900/40"
                >
                  บันทึกข้อมูลหน้าปิดปรับปรุง
                </button>
              </form>
            </div>
          )}

          {/* SECTION: Portal Links */}
          {activeSection === 'portal_links' && (
            <div className="space-y-6 max-w-4xl">
              {/* Security Banner Note */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-emerald-200">ระบบแยกทางเข้า 3 ลิงก์อย่างสมบูรณ์แบบ & ปลอดภัย 100%</div>
                  <div className="text-emerald-300/90 leading-relaxed">
                    หากผู้ใช้หรือผู้ชมลบพารามิเตอร์ของลิงก์ออกทั้งหมด (เช่น ลบ <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-white">?portal=viewer</code> หรือ <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-white">?portal=app</code> ออก) 
                    ระบบจะนำผู้ใช้เข้าสู่ <strong className="text-white">หน้าเว็บสำหรับผู้ใช้งาน (User App)</strong> เสมอ และไม่มีทางหลุดเข้าสู่ระบบหลังบ้าน (Admin Platform) โดยเด็ดขาด
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#16112d] border border-violet-500/30 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-violet-400" />
                  <span>จัดการและคัดลอกลิงก์ 3 เว็บไซต์ (แยกการเข้าถึงเด็ดขาด)</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ระบบถูกออกแบบให้แยกอิสระเป็น 3 เว็บไซต์ คุณสามารถคัดลอกลิงก์ที่ถูกต้องส่งให้แก่กลุ่มเป้าหมายแต่ละกลุ่ม:
                </p>

                {/* 1. Production Web (Vercel) */}
                <div className="p-4 rounded-2xl bg-[#1a1435] border border-blue-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                      <span className="text-xs font-bold text-blue-300">1. เว็บไซต์จริงผู้ใช้งาน (Production Web - Vercel)</span>
                    </div>
                    <span className="text-[10px] text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded font-mono font-bold">
                      สำหรับผู้ใช้และลูกค้าจริง
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    เว็บสะอาด 100% ไม่มีปุ่มทดสอบหรือแถบเทส สำหรับส่งให้ลูกค้า/ผู้ใช้งานจริงเข้าทำงาน
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={vercelUserProdUrl}
                      className="flex-1 bg-[#120d26] border border-blue-500/40 rounded-xl px-3 py-2 text-xs text-blue-200 font-mono select-all focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClip(vercelUserProdUrl, 'vercel_links')}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow"
                    >
                      {copiedLink === 'vercel_links' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink === 'vercel_links' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                    <button
                      onClick={() => window.open(vercelUserProdUrl, '_blank')}
                      className="px-3.5 py-2 rounded-xl border border-blue-500/40 hover:bg-white/10 text-blue-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>เปิดเว็บ</span>
                    </button>
                  </div>
                </div>

                {/* 2. QA Test Lab */}
                <div className="p-4 rounded-2xl bg-[#1e153b] border border-purple-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                      <span className="text-xs font-bold text-purple-300">2. ห้องทดสอบระบบ (QA Test Lab / Sandbox)</span>
                    </div>
                    <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded font-mono font-bold">
                      สำหรับทีมเทสและทดลอง
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    เว็บสำหรับทดสอบระบบ สลับ Persona 3 บัญชี ปรับแต่งฟีเจอร์ก่อนปล่อยขึ้นเว็บจริง
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={devTestLabUrl}
                      className="flex-1 bg-[#120d26] border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-purple-200 font-mono select-all focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClip(devTestLabUrl, 'dev_test_links')}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow"
                    >
                      {copiedLink === 'dev_test_links' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink === 'dev_test_links' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                    <button
                      onClick={() => window.open(devTestLabUrl, '_blank')}
                      className="px-3.5 py-2 rounded-xl border border-purple-500/40 hover:bg-white/10 text-purple-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>เปิดเว็บ</span>
                    </button>
                  </div>
                </div>

                {/* 3. Admin Platform */}
                <div className="p-4 rounded-2xl bg-[#231227] border border-rose-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <span className="text-xs font-bold text-rose-300">3. ศูนย์ควบคุมหลังบ้าน (Admin Platform)</span>
                    </div>
                    <span className="text-[10px] text-rose-400 font-medium">เฉพาะผู้ดูแลระบบ (ป้องกันด้วย Passcode)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    ลิงก์เฉพาะผู้ดูแลระบบและเจ้าของ มีหน้าต่างล็อกรหัสผ่าน Master Passcode ป้องกันบุคคลภายนอก 100%
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={adminPortalUrl}
                      className="flex-1 bg-[#120d26] border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-rose-200 font-mono select-all focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClip(adminPortalUrl, 'admin')}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow"
                    >
                      {copiedLink === 'admin' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink === 'admin' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                    <button
                      onClick={handleLockAdminSession}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-rose-300 hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition"
                      title="ล็อกระบบหลังบ้านและกลับสู่หน้าผู้ใช้ทันที"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>ล็อกหน้าจอ</span>
                    </button>
                  </div>
                </div>

                {/* 4. Viewer Portal */}
                <div className="p-4 rounded-2xl bg-[#1e193c] border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <span className="text-xs font-bold text-cyan-300">4. ลิงก์สำหรับผู้ชมทั่วไป (Viewer Portal Link)</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-medium">ดูอย่างเดียว ปลอดภัย ไม่มีเมนูแก้ไข</span>
                  </div>
                  <p className="text-[11px] text-slate-400">สำหรับส่งให้ผู้บริหาร ลูกค้า หรือบุคคลทั่วไปเปิดดูรายงานและฟิลเตอร์ข้อมูล</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={viewerPortalUrl}
                      className="flex-1 bg-[#120d26] border border-cyan-500/40 rounded-xl px-3 py-2 text-xs text-cyan-200 font-mono select-all focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClip(viewerPortalUrl, 'viewer')}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow"
                    >
                      {copiedLink === 'viewer' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink === 'viewer' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                    <button
                      onClick={() => window.open(viewerPortalUrl, '_blank')}
                      className="px-3.5 py-2 rounded-xl border border-cyan-500/40 hover:bg-white/10 text-cyan-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>เปิดเว็บ</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Security & Routing Configuration */}
              <div className="p-6 rounded-3xl bg-[#16112d] border border-violet-500/30 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-400" />
                  <span>ตั้งค่าความปลอดภัยและการนำทาง (Security & Route Settings)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Default Landing Page Setting */}
                  <div className="p-4 rounded-2xl bg-[#1e193c] border border-white/10 space-y-2.5">
                    <label className="text-xs font-bold text-white block">
                      หน้าเริ่มต้นเมื่อผู้ใช้เปิดลิงก์หลัก หรือลบพารามิเตอร์ออก:
                    </label>
                    <div className="space-y-2 text-xs">
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white">
                        <input
                          type="radio"
                          name="defaultLanding"
                          value="studio"
                          checked={defaultLanding === 'studio'}
                          onChange={() => setDefaultLanding('studio')}
                          className="w-4 h-4 accent-violet-600 cursor-pointer"
                        />
                        <span>หน้าเว็บผู้ใช้งาน (User App / Studio) - แนะนำ</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white">
                        <input
                          type="radio"
                          name="defaultLanding"
                          value="viewer"
                          checked={defaultLanding === 'viewer'}
                          onChange={() => setDefaultLanding('viewer')}
                          className="w-4 h-4 accent-cyan-500 cursor-pointer"
                        />
                        <span>หน้าเว็บผู้ชม (Public Viewer Portal)</span>
                      </label>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1">
                      * ไม่ว่าจะเลือกแบบใด ระบบจะไม่มีทางพาผู้ใช้หลุดเข้าระบบหลังบ้านเด็ดขาด
                    </div>
                  </div>

                  {/* Admin Master Passcode Setting */}
                  <div className="p-4 rounded-2xl bg-[#1e193c] border border-white/10 space-y-2.5">
                    <label className="text-xs font-bold text-white block">
                      รหัสผ่านผู้ดูแลระบบ (Admin Master Passcode):
                    </label>
                    <input
                      type="text"
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      placeholder="เช่น admin1234"
                      className="w-full bg-[#120d26] border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-rose-200 font-mono focus:outline-none focus:border-rose-400"
                    />
                    <div className="text-[11px] text-slate-400">
                      ใช้สำหรับปลดล็อกหน้าจอเมื่อมีคนเข้าลิงก์ <code className="text-rose-300 font-mono">?portal=admin</code>
                    </div>
                  </div>
                </div>

                {passcodeSaved && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>บันทึกการตั้งค่าความปลอดภัยและทางเข้าเว็บไซต์เรียบร้อยแล้ว</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleSaveSecurityRouting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-violet-900/40"
                  >
                    บันทึกการตั้งค่าลิงก์และความปลอดภัย
                  </button>

                  <button
                    onClick={handleLockAdminSession}
                    className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>ล็อกออกจากระบบหลังบ้านทันที</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Users */}
          {activeSection === 'users' && (
            <div className="space-y-4 max-w-6xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาผู้ใช้จากชื่อหรืออีเมล..."
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      className="bg-[#1c163b] border border-violet-500/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none w-64"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-violet-900/40"
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้างผู้ใช้ใหม่</span>
                </button>
              </div>

              {/* Users Table */}
              <div className="rounded-2xl border border-violet-500/20 bg-[#15112d] overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#1b1538] text-slate-400 font-semibold">
                      <th className="py-3 px-4">ชื่อสมาชิก</th>
                      <th className="py-3 px-4">อีเมล</th>
                      <th className="py-3 px-4">แผนก</th>
                      <th className="py-3 px-4">สิทธิ์ในระบบ</th>
                      <th className="py-3 px-4">สถานะบัญชี</th>
                      <th className="py-3 px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users
                      .filter(
                        (u) =>
                          u.displayName.toLowerCase().includes(searchUser.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchUser.toLowerCase())
                      )
                      .map((user) => (
                        <tr key={user.id} className="hover:bg-white/5 transition">
                          <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-violet-600/30 flex items-center justify-center text-xs font-bold text-violet-300">
                              {user.displayName.charAt(0)}
                            </div>
                            <span>{user.displayName}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">{user.email}</td>
                          <td className="py-3 px-4 text-slate-300">{user.department || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                            }`}>
                              {user.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้ใช้ (Editor)'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}>
                              {user.status === 'active' ? 'ปกติ (Active)' : 'ระงับการใช้งาน (Blocked)'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleToggleBlock(user.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                                user.status === 'active'
                                  ? 'bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {user.status === 'active' ? 'ระงับบัญชี' : 'ปลดบล็อก'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition cursor-pointer"
                              title="ลบผู้ใช้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION: Storage & Backup */}
          {activeSection === 'storage_backup' && (
            <div className="space-y-6 max-w-4xl">
              <div className="p-6 rounded-3xl bg-[#16112d] border border-violet-500/30 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-orange-400" />
                  <span>พื้นที่จัดเก็บข้อมูล & สำรองฐานข้อมูล</span>
                </h3>

                <div className="p-4 rounded-2xl bg-[#1e193c] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">พื้นที่จัดเก็บที่ใช้ไป (Storage Meter)</span>
                    <span className="text-orange-400 font-mono font-bold">142 MB / 10 GB (1.4%)</span>
                  </div>
                  <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full w-[1.4%]" />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleExportBackup}
                    className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-orange-900/40"
                  >
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลด Full Backup ทันที (JSON)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: CMS & SEO */}
          {activeSection === 'cms_seo' && (
            <div className="space-y-6 max-w-4xl">
              <div className="p-6 rounded-3xl bg-[#16112d] border border-violet-500/30 space-y-5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-yellow-400" />
                  <span>ตั้งค่าชื่อโปรแกรม (Branding) & ประกาศประชาสัมพันธ์ (CMS)</span>
                </h3>

                {/* 1. App Title / Platform Name */}
                <div className="p-4 rounded-2xl bg-[#1e193c] border border-violet-500/30 space-y-3">
                  <div className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                    <span>🏷️ ชื่อโปรแกรม / ชื่อระบบ (Program / Platform Name)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    ชื่อนี้จะแสดงเป็นหัวโปรแกรมในหน้าผู้ใช้งาน (User Portal), แดชบอร์ดสตูดิโอ (Studio BI), และลิงก์สำหรับผู้ชม (Viewer Portal)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300 font-semibold block">ชื่อโปรแกรมหลัก:</label>
                      <input
                        type="text"
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                        placeholder="เช่น Studio BI Analytics, บริษัท สยาม บิสซิเนส อินเทลลิเจนซ์"
                        className="w-full bg-[#120d26] border border-violet-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-violet-400 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300 font-semibold block">คำบรรยาย / สโลแกน:</label>
                      <input
                        type="text"
                        value={platformSubtitle}
                        onChange={(e) => setPlatformSubtitle(e.target.value)}
                        placeholder="เช่น แพลตฟอร์มสร้างและวิเคราะห์แดชบอร์ดอัจฉริยะ"
                        className="w-full bg-[#120d26] border border-violet-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Announcement Banner */}
                <div className="p-4 rounded-2xl bg-[#1e193c] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">แสดงแบนเนอร์ประกาศบนเว็บผู้ใช้</div>
                      <div className="text-[11px] text-slate-400">ข้อความจะขึ้นแสดงที่แถบด้านบนสุดของเว็บผู้ใช้งานทุกคน</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={bannerEnabled}
                      onChange={(e) => setBannerEnabled(e.target.checked)}
                      className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                    />
                  </div>
                  {bannerEnabled && (
                    <input
                      type="text"
                      value={bannerMsg}
                      onChange={(e) => setBannerMsg(e.target.value)}
                      placeholder="กรอกข้อความประกาศ เช่น 🎉 อัปเดตใหม่ รองรับการเชื่อมต่อแบบเรียลไทม์..."
                      className="w-full bg-[#120d26] border border-yellow-500/40 rounded-xl px-3.5 py-2 text-xs text-yellow-200 focus:outline-none"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">SEO Meta Title:</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full bg-[#201a40] border border-violet-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">SEO Meta Description:</label>
                  <textarea
                    rows={3}
                    value={seoDesc}
                    onChange={(e) => setSeoDesc(e.target.value)}
                    className="w-full bg-[#201a40] border border-violet-500/30 rounded-xl p-3.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleSaveCMS}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-violet-900/40"
                >
                  บันทึกการตั้งค่า CMS & SEO
                </button>
              </div>
            </div>
          )}

          {/* SECTION: Subscriptions & Billing */}
          {activeSection === 'subscriptions' && (
            <div className="space-y-6 max-w-4xl">
              <div className="p-6 rounded-3xl bg-[#16112d] border border-violet-500/30 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-pink-400" />
                  <span>แพ็กเกจสมาชิก (Subscription Plans) & ระบบ Billing</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    { name: 'Free', price: '฿0', users: '1 ผู้ใช้', limit: '3 แดชบอร์ด', color: 'border-slate-500/40 text-slate-300' },
                    { name: 'Basic', price: '฿590/ด.', users: '3 ผู้ใช้', limit: '10 แดชบอร์ด', color: 'border-blue-500/40 text-blue-300' },
                    { name: 'Pro', price: '฿1,890/ด.', users: '10 ผู้ใช้', limit: 'ไม่จำกัด', color: 'border-violet-500/40 text-violet-300' },
                    { name: 'Enterprise', price: '฿4,900/ด.', users: 'ไม่จำกัด', limit: 'Custom Branding & White-label', color: 'border-amber-500/40 text-amber-300' },
                  ].map((pkg, i) => (
                    <div key={i} className={`p-4 rounded-2xl bg-[#1d173b] border ${pkg.color} space-y-2`}>
                      <div className="text-xs font-bold">{pkg.name}</div>
                      <div className="text-lg font-black text-white">{pkg.price}</div>
                      <div className="text-[11px] text-slate-400">{pkg.users}</div>
                      <div className="text-[11px] text-slate-400">{pkg.limit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Security */}
          {activeSection === 'security' && (
            <div className="space-y-6 max-w-4xl">
              <div className="p-6 rounded-3xl bg-[#16112d] border border-violet-500/30 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-400" />
                  <span>ระบบความปลอดภัย & เซสชันการเข้าสู่ระบบ</span>
                </h3>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#1e193c] border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">บังคับใช้การยืนยันตัวตนสองขั้นตอน (MFA / 2FA)</div>
                      <div className="text-[11px] text-slate-400">ผู้ใช้ทุกคนต้องยืนยัน OTP ก่อนเข้าสู่ระบบ</div>
                    </div>
                    <input type="checkbox" className="w-4 h-4 rounded accent-violet-600 cursor-pointer" />
                  </div>

                  <div className="p-4 rounded-2xl bg-[#1e193c] border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">หมดอายุเซสชันอัตโนมัติ (Session Timeout)</div>
                      <div className="text-[11px] text-slate-400">ตัดการเชื่อมต่อเมื่อไม่มีการใช้งานเกิน 60 นาที</div>
                    </div>
                    <span className="text-xs text-violet-300 font-mono">60 นาที</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: All Data & Audit */}
          {activeSection === 'all_data' && (
            <div className="space-y-6 max-w-5xl">
              <div className="p-6 rounded-3xl bg-[#16112d] border border-violet-500/30 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>ชุดข้อมูลยอดขายทั้งหมดในระบบ ({currentSalesData.length} แถว)</span>
                </h3>

                <div className="rounded-2xl border border-white/10 overflow-x-auto max-h-[400px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#1b1538] sticky top-0 text-slate-400 font-semibold border-b border-white/10">
                      <tr>
                        <th className="py-2.5 px-3">วันที่</th>
                        <th className="py-2.5 px-3">ภูมิภาค</th>
                        <th className="py-2.5 px-3">หมวดหมู่</th>
                        <th className="py-2.5 px-3">สินค้า</th>
                        <th className="py-2.5 px-3 text-right">ยอดขาย</th>
                        <th className="py-2.5 px-3 text-right">กำไร</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {currentSalesData.slice(0, 50).map((r, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="py-2 px-3 text-slate-300">{r.date}</td>
                          <td className="py-2 px-3 text-white">{r.region}</td>
                          <td className="py-2 px-3 text-slate-300">{r.category}</td>
                          <td className="py-2 px-3 text-white">{r.product}</td>
                          <td className="py-2 px-3 text-right text-emerald-400">฿{(r.revenue || 0).toLocaleString()}</td>
                          <td className="py-2 px-3 text-right text-violet-300">฿{(r.profit || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowAddUserModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#17132e] border border-violet-500/40 rounded-3xl p-6 shadow-2xl text-white space-y-4"
          >
            <h3 className="font-bold text-base">สร้างผู้ใช้งานใหม่ในระบบ</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300">ชื่อผู้ใช้งาน:</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สมชาย ใจดี"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-[#201a40] border border-violet-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">อีเมล:</label>
                <input
                  type="email"
                  required
                  placeholder="user@company.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-[#201a40] border border-violet-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">แผนก:</label>
                <input
                  type="text"
                  placeholder="เช่น Marketing, Sales"
                  value={newUserDepartment}
                  onChange={(e) => setNewUserDepartment(e.target.value)}
                  className="w-full bg-[#201a40] border border-violet-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">สิทธิ์ในระบบ:</label>
                <select
                  value={newUserRole}
                  onChange={(e: any) => setNewUserRole(e.target.value)}
                  className="w-full bg-[#201a40] border border-violet-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="editor">ผู้ใช้งาน (Editor - สร้างแดชบอร์ด)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin - เข้าจัดการเว็บ)</option>
                  <option value="viewer">ผู้ชม (Viewer - ดูอย่างเดียว)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold"
                >
                  บันทึกผู้ใช้
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
