import React, { useState, useEffect } from 'react';
import {
  X,
  LayoutDashboard,
  Plus,
  FolderOpen,
  Trash2,
  Copy,
  Clock,
  Layers,
  Sparkles,
  Check,
  Save,
  Palette,
  ShoppingBag,
  RefreshCw,
  User,
  Shield,
  ArrowRight,
  Database,
} from 'lucide-react';
import {
  SavedDashboard,
  VisualWidget,
  SalesRecord,
  ThemePreset,
  TeamUser,
  ThemeConfig,
  FilterState,
  SheetConnectionConfig,
} from '../types';
import {
  dbGetDashboards,
  dbSaveDashboard,
  dbDeleteDashboard,
  DBDashboard,
  DBUser,
} from '../services/cloudDatabase';

interface MyDashboardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDashboardTitle: string;
  currentWidgets: VisualWidget[];
  currentSalesData: SalesRecord[];
  currentThemePreset: ThemePreset;
  currentUser: TeamUser | null;
  currentThemeConfig?: ThemeConfig;
  currentFilterState?: FilterState;
  currentConnectionConfig?: SheetConnectionConfig;
  currentSpacingMode?: string;
  onLoadDashboard: (
    widgets: VisualWidget[],
    salesData: SalesRecord[],
    themePreset?: ThemePreset,
    title?: string,
    filterState?: FilterState,
    connectionConfig?: SheetConnectionConfig
  ) => void;
  onSaveCurrentDashboard?: (title: string, description?: string) => void;
}

export const MyDashboardsModal: React.FC<MyDashboardsModalProps> = ({
  isOpen,
  onClose,
  currentDashboardTitle,
  currentWidgets,
  currentSalesData,
  currentThemePreset,
  currentUser,
  currentThemeConfig,
  currentFilterState,
  currentConnectionConfig,
  currentSpacingMode,
  onLoadDashboard,
  onSaveCurrentDashboard,
}) => {
  const [cloudDashboards, setCloudDashboards] = useState<DBDashboard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [activeTab, setActiveTab] = useState<'saved' | 'save_current' | 'marketplace'>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const loadProjects = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const dbUser: DBUser = {
        userId: currentUser.id,
        email: currentUser.email,
        name: currentUser.displayName,
        role: currentUser.role,
        createdDate: currentUser.createdAt,
      };
      const list = await dbGetDashboards(dbUser);
      setCloudDashboards(list);
    } catch (e) {
      console.warn('Failed to load dashboards', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProjects();
      setNewTitle(currentDashboardTitle || '');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSaveCurrent = async () => {
    if (!currentUser) return;
    const titleToUse = newTitle.trim() || currentDashboardTitle || 'แดชบอร์ดของฉัน (บันทึกใหม่)';
    const dId = `dash-${currentUser.id}-${Date.now()}`;

    const newDash: DBDashboard = {
      dashboardId: dId,
      userId: currentUser.id,
      dashboardName: titleToUse,
      dashboardConfig: {
        widgets: currentWidgets,
        salesData: currentSalesData,
        themeConfig: currentThemeConfig || {
          preset: currentThemePreset,
          primaryColor: '#7c3aed',
          fontFamily: 'Prompt',
          borderRadius: 'rounded-lg',
          shadowStyle: 'shadow-sm',
        },
        filterState: currentFilterState,
        connectionConfig: currentConnectionConfig,
        spacingMode: currentSpacingMode,
      },
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };

    try {
      await dbSaveDashboard(newDash);
      setCloudDashboards((prev) => [newDash, ...prev]);
      if (onSaveCurrentDashboard) {
        onSaveCurrentDashboard(titleToUse, newDesc.trim());
      }
      setSaveSuccessMsg('บันทึกแดชบอร์ดลง Cloud Database เรียบร้อยแล้ว!');
      setActiveTab('saved');
      setTimeout(() => setSaveSuccessMsg(''), 2500);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('คุณต้องการลบแดชบอร์ดนี้ใช่หรือไม่?')) return;
    try {
      await dbDeleteDashboard(id);
      setCloudDashboards((prev) => prev.filter((d) => d.dashboardId !== id));
    } catch (err) {
      console.warn(err);
    }
  };

  const handleSelectDashboard = (dash: DBDashboard) => {
    const cfg = dash.dashboardConfig;
    onLoadDashboard(
      cfg.widgets || currentWidgets,
      cfg.salesData || currentSalesData,
      cfg.themeConfig?.preset || 'violet',
      dash.dashboardName,
      cfg.filterState,
      cfg.connectionConfig
    );
    onClose();
  };

  const filteredDashboards = cloudDashboards.filter(
    (d) =>
      d.dashboardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentDashboard = filteredDashboards[0] || null;

  return (
    <div
      id="modal-my-dashboards"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#18152e] border border-[#342b5c] rounded-2xl shadow-2xl text-slate-200 overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2d254e] flex items-center justify-between bg-[#151227]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/30 text-violet-300 flex items-center justify-center border border-violet-500/40">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>แดชบอร์ดของฉัน (My Projects)</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {currentUser?.role === 'admin' ? '🛡️ Admin (เห็นของทุกผู้ใช้)' : `👤 ผู้ใช้: ${currentUser?.displayName}`}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                ข้อมูลผูกกับ User ID ในฐานข้อมูลจริง เข้าสู่ระบบจากอุปกรณ์ใดก็เปิดต่อได้ทันที 100%
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#282147] text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center justify-between px-6 border-b border-[#2d254e] bg-[#141126] text-xs">
          <div className="flex gap-4">
            <button
              id="tab-saved-dashboards"
              onClick={() => setActiveTab('saved')}
              className={`py-2.5 font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'saved'
                  ? 'border-violet-400 text-violet-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>แดชบอร์ดที่บันทึกไว้ ({cloudDashboards.length})</span>
            </button>
            <button
              id="tab-save-current"
              onClick={() => setActiveTab('save_current')}
              className={`py-2.5 font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'save_current'
                  ? 'border-violet-400 text-violet-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกแดชบอร์ดปัจจุบัน</span>
            </button>
            <button
              id="tab-marketplace"
              onClick={() => setActiveTab('marketplace')}
              className={`py-2.5 font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'marketplace'
                  ? 'border-violet-400 text-violet-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span>คลังเทมเพลตสำเร็จรูป</span>
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="text-emerald-400 flex items-center gap-1 text-[11px] font-semibold animate-pulse">
              <Check className="w-3.5 h-3.5" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'saved' ? (
            <div className="space-y-4">
              {/* Search & Actions Bar */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาตามชื่อแดชบอร์ด หรือ User ID..."
                  className="flex-1 px-3 py-2 rounded-lg bg-[#141026] border border-[#352c5c] text-white text-xs outline-none focus:border-violet-400"
                />
                <button
                  onClick={() => setActiveTab('save_current')}
                  className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>บันทึกผืนงานนี้</span>
                </button>
              </div>

              {isLoading ? (
                <div className="py-16 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-400" />
                  <p className="text-xs">กำลังโหลดแดชบอร์ดจาก Cloud Database...</p>
                </div>
              ) : filteredDashboards.length === 0 ? (
                <div className="text-center py-12 border border-[#2d254e] rounded-xl bg-[#141026] p-6">
                  <LayoutDashboard className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-white">ยังไม่มีแดชบอร์ดที่บันทึกไว้ในบัญชีของคุณ</p>
                  <p className="text-[11px] text-slate-400 mt-1 mb-4">
                    กดปุ่มบันทึกผืนงานปัจจุบัน หรือเริ่มสร้างและระบบจะ Auto-save ลงในบัญชีของคุณอัตโนมัติ
                  </p>
                  <button
                    onClick={() => setActiveTab('save_current')}
                    className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกแดชบอร์ดนี้</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Recent Projects Card (Requirement 8) */}
                  {recentDashboard && !searchQuery && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-[#1e1838] border border-violet-500/40 shadow-md">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Recent Project (แดชบอร์ดล่าสุด)</span>
                        </span>
                        <span className="text-[11px] text-slate-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-violet-400" />
                          <span>แก้ไขล่าสุด: {new Date(recentDashboard.updatedDate).toLocaleString('th-TH')}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 mt-2">
                        <div>
                          <h3 className="text-sm font-bold text-white mb-1">{recentDashboard.dashboardName}</h3>
                          <div className="flex items-center gap-3 text-xs text-slate-300">
                            <span>{recentDashboard.dashboardConfig?.widgets?.length || 0} วิชวล</span>
                            <span>•</span>
                            <span>{recentDashboard.dashboardConfig?.salesData?.length || 0} แถวข้อมูล</span>
                            <span>•</span>
                            <span className="capitalize">ธีม {recentDashboard.dashboardConfig?.themeConfig?.preset || 'violet'}</span>
                            {currentUser?.role === 'admin' && (
                              <span className="text-violet-400 text-[10px]">({recentDashboard.userId})</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectDashboard(recentDashboard)}
                          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer shrink-0"
                        >
                          <span>เปิดต่อได้ทันที</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* All Saved Projects Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {filteredDashboards.map((dash) => (
                      <div
                        key={dash.dashboardId}
                        onClick={() => handleSelectDashboard(dash)}
                        className="p-3.5 rounded-xl bg-[#1e1838] hover:bg-[#251f45] border border-[#352b5e] hover:border-violet-400/60 transition cursor-pointer flex flex-col justify-between group shadow-sm"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-xs font-bold text-white group-hover:text-violet-300 transition line-clamp-1">
                              {dash.dashboardName}
                            </h3>
                            <span className="text-[10px] bg-violet-950/80 text-violet-300 border border-violet-800/40 px-1.5 py-0.5 rounded capitalize shrink-0">
                              {dash.dashboardConfig?.themeConfig?.preset || 'violet'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                            <span>{dash.dashboardConfig?.widgets?.length || 0} วิชวล</span>
                            <span>•</span>
                            <span>{dash.dashboardConfig?.salesData?.length || 0} แถว</span>
                            {currentUser?.role === 'admin' && (
                              <span className="text-violet-400 text-[10px]">({dash.userId})</span>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-[#2b224e] flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{new Date(dash.updatedDate).toLocaleDateString('th-TH')}</span>
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleDelete(dash.dashboardId, e)}
                              title="ลบแดชบอร์ด"
                              className="p-1 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'save_current' ? (
            /* Save current dashboard view */
            <div className="space-y-4 max-w-lg mx-auto py-2">
              <div className="p-5 rounded-xl bg-[#20193b] border border-[#342a61] space-y-3.5">
                <div className="flex items-center justify-between text-xs text-slate-300 border-b border-[#2d254e] pb-2">
                  <span className="font-semibold text-white">ข้อมูลที่จะบันทึกถาวร:</span>
                  <span className="text-violet-300 font-medium">
                    {currentWidgets.length} วิชวล | {currentSalesData.length} แถวข้อมูล
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ชื่อแดชบอร์ด <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="เช่น ภาพรวมยอดขาย Q1"
                    className="w-full px-3 py-2 rounded-lg bg-[#141026] border border-[#352c5c] text-white text-xs outline-none focus:border-violet-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    คำอธิบายเพิ่มเติม
                  </label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="บันทึก Layout, Charts, Filters, Widgets, Theme และ Data Mapping..."
                    className="w-full px-3 py-2 rounded-lg bg-[#141026] border border-[#352c5c] text-white text-xs outline-none focus:border-violet-400 resize-none"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-[#141026] text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>บันทึกทั้ง Layout ตำแหน่งการจัดวาง กราฟ และฟิลเตอร์</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>ผูกกับ User ID ของคุณ ({currentUser?.displayName}) อย่างถาวร</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleSaveCurrent}
                    className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>บันทึกลง Cloud Database</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Marketplace / Starter templates */
            <div className="text-center py-8">
              <ShoppingBag className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-white mb-1">คลังเทมเพลตมาตรฐาน</h4>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto mb-4">
                คุณสามารถเลือกใช้เทมเพลตที่มีโครงสร้าง KPI และแผนภูมิสำเร็จรูป แล้วบันทึกเป็นแดชบอร์ดของคุณได้ทันที
              </p>
              <button
                onClick={() => {
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
              >
                ดูในหน้าแดชบอร์ดหลัก
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#2d254e] bg-[#151227] flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-violet-400" />
            <span>เชื่อมต่อกับ Cloud Firestore Database (ถาวร 100% ใช้งานได้ทุกอุปกรณ์)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#272147] hover:bg-[#332a5e] text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
