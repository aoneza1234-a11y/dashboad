import {
  VisualWidget,
  SalesRecord,
  ThemeConfig,
  SheetConnectionConfig,
  DashboardVersion,
  FilterState,
  TeamUser,
} from '../types';
import { INITIAL_SALES_RECORDS, INITIAL_WIDGETS } from '../data/sampleData';
import {
  dbSaveDashboard,
  dbGetDashboards,
  dbGetLatestDashboard,
  dbDeleteDashboard,
  DBDashboard,
  DBUser,
} from './cloudDatabase';
import { fetchSheetRowsWithConfig } from './googleSheets';
import {
  saveDashboardToServerFile,
  loadDashboardFromServerFile,
} from './fileStorageService';

export interface UserDashboardData {
  dashboardId?: string;
  widgets: VisualWidget[];
  salesData: SalesRecord[];
  dashboardTitle: string;
  themeConfig: ThemeConfig;
  filterState?: FilterState;
  connectionConfig?: SheetConnectionConfig;
  versions?: DashboardVersion[];
  lastSavedAt: string;
  spacingMode?: string;
  activeNav?: string;
}

const STORAGE_PREFIX = 'user_dashboard_';
const SALES_PREFIX = 'user_sales_data_';

export function getUserDashboardKey(userId?: string | null): string {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    return `${STORAGE_PREFIX}default_user`;
  }
  const safeId = encodeURIComponent(userId.trim().toLowerCase() || 'default_user');
  return `${STORAGE_PREFIX}${safeId}`;
}

export function getUserSalesDataKey(userId?: string | null): string {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    return `${SALES_PREFIX}default_user`;
  }
  const safeId = encodeURIComponent(userId.trim().toLowerCase() || 'default_user');
  return `${SALES_PREFIX}${safeId}`;
}

// Synchronous fast-read for instant boot (<5ms)
export function loadUserDashboard(userId?: string | null): UserDashboardData | null {
  if (typeof window === 'undefined') return null;
  if (!userId || typeof userId !== 'string' || !userId.trim()) return null;
  const cleanId = userId.trim();

  try {
    const key = getUserDashboardKey(cleanId);
    let raw = localStorage.getItem(key);
    if (!raw) {
      raw = localStorage.getItem(`user_dashboard_${cleanId}`);
    }
    if (!raw) {
      raw = localStorage.getItem(`user_dashboard_${cleanId.toLowerCase()}`);
    }

    // Retrieve user-specific isolated sales data
    const salesKey = getUserSalesDataKey(cleanId);
    let rawSales = localStorage.getItem(salesKey);
    if (!rawSales) {
      rawSales = localStorage.getItem(`user_sales_data_${cleanId}`);
    }
    if (!rawSales) {
      rawSales = localStorage.getItem(`user_sales_data_${cleanId.toLowerCase()}`);
    }

    let parsed: any = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch (e) {}
    }

    let sales: SalesRecord[] = [];
    if (rawSales) {
      try {
        const parsedSales = JSON.parse(rawSales);
        if (Array.isArray(parsedSales) && parsedSales.length > 0) {
          sales = parsedSales;
        }
      } catch (e) {}
    }

    if (parsed && (!sales || sales.length === 0) && Array.isArray(parsed.salesData) && parsed.salesData.length > 0) {
      sales = parsed.salesData;
    }

    if (!Array.isArray(sales) || sales.length === 0) {
      sales = INITIAL_SALES_RECORDS;
    }

    if (parsed && Array.isArray(parsed.widgets) && parsed.widgets.length > 0) {
      return {
        ...parsed,
        salesData: sales,
      };
    }

    return null;
  } catch (e) {
    console.error('Failed to load user dashboard from fast cache', e);
    return null;
  }
}

// Create initial starter dashboard specifically for a user
export function getStarterUserDashboard(user?: TeamUser | null): UserDashboardData {
  const userName = user?.displayName || user?.name || 'ผู้ใช้งาน';
  const userId = user?.id || 'usr-starter';
  return {
    dashboardId: `dash-${userId}-initial`,
    widgets: INITIAL_WIDGETS,
    salesData: INITIAL_SALES_RECORDS,
    dashboardTitle: `แดชบอร์ดของ ${userName}`,
    themeConfig: {
      preset: 'violet',
      primaryColor: '#7c3aed',
      fontFamily: 'Prompt',
      borderRadius: 'rounded-lg',
      shadowStyle: 'shadow-sm',
    },
    spacingMode: 'ปกติ',
    lastSavedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
  };
}

// Live real-time sync with Google Sheets (ดึงข้อมูลแบบเรียลไทม์เมื่อเปิดหรือเมื่อชีทอัปเดต)
export async function syncUserDashboardLiveData(
  connectionConfig?: SheetConnectionConfig,
  accessToken?: string | null
): Promise<{ success: boolean; records?: SalesRecord[]; headers?: string[]; error?: string }> {
  if (!connectionConfig || !connectionConfig.spreadsheetId) {
    return { success: false, error: 'ยังไม่มีการเชื่อมต่อ Google Sheets' };
  }

  try {
    const res = await fetchSheetRowsWithConfig(
      connectionConfig.spreadsheetId,
      connectionConfig.sheetName,
      connectionConfig.headerRow || 1,
      connectionConfig.dataStartRow || 2,
      connectionConfig.dataEndRow || undefined,
      accessToken
    );

    if (res.records && res.records.length > 0) {
      return {
        success: true,
        records: res.records,
        headers: res.headers,
      };
    }
    return { success: false, error: 'ไม่พบข้อมูลแถวใน Google Sheets' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'ไม่สามารถดึงข้อมูลสดจากชีตได้' };
  }
}

// Helper to pull fresh live data and update local storage under user's isolated key
export async function refreshUserLiveData(
  userId: string,
  connectionConfig?: SheetConnectionConfig,
  accessToken?: string | null
): Promise<{ success: boolean; records?: SalesRecord[]; headers?: string[]; error?: string }> {
  const result = await syncUserDashboardLiveData(connectionConfig, accessToken);
  if (result.success && result.records && result.records.length > 0) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(getUserSalesDataKey(userId), JSON.stringify(result.records));
      } catch (e) {}
    }
  }
  return result;
}

// Asynchronous Cloud Database & Server File loader with single source of truth across all devices
export async function loadUserDashboardFromCloud(userId?: string | null): Promise<UserDashboardData | null> {
  if (!userId || typeof userId !== 'string' || !userId.trim()) return null;
  const cleanId = userId.trim();

  // 1. Query Server File Storage API first (Authoritative source across all computers and browsers!)
  try {
    const serverFile = await loadDashboardFromServerFile(cleanId);
    if (serverFile && serverFile.widgets && Array.isArray(serverFile.widgets) && serverFile.widgets.length > 0) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(getUserDashboardKey(cleanId), JSON.stringify(serverFile));
          if (serverFile.salesData && serverFile.salesData.length > 0) {
            localStorage.setItem(getUserSalesDataKey(cleanId), JSON.stringify(serverFile.salesData));
          }
        } catch (e) {}
      }
      return serverFile;
    }
  } catch (err) {
    console.warn('Server file loader notice', err);
  }

  // 2. Query Cloud Database (Firestore / IndexedDB)
  try {
    const latest = await dbGetLatestDashboard(cleanId);
    if (latest && latest.dashboardConfig && latest.dashboardConfig.widgets && latest.dashboardConfig.widgets.length > 0) {
      const data: UserDashboardData = {
        dashboardId: latest.dashboardId,
        widgets: latest.dashboardConfig.widgets || INITIAL_WIDGETS,
        salesData: latest.dashboardConfig.salesData || INITIAL_SALES_RECORDS,
        dashboardTitle: latest.dashboardName || 'ภาพรวมยอดขาย',
        themeConfig: latest.dashboardConfig.themeConfig || {
          preset: 'violet',
          primaryColor: '#7c3aed',
          fontFamily: 'Prompt',
          borderRadius: 'rounded-lg',
          shadowStyle: 'shadow-sm',
        },
        filterState: latest.dashboardConfig.filterState,
        connectionConfig: latest.dashboardConfig.connectionConfig,
        spacingMode: latest.dashboardConfig.spacingMode,
        lastSavedAt: new Date(latest.updatedDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(getUserDashboardKey(userId), JSON.stringify(data));
          localStorage.setItem(getUserSalesDataKey(userId), JSON.stringify(data.salesData));
        } catch (e) {}
      }
      return data;
    }
  } catch (err) {
    console.warn('Load user dashboard from cloud warning:', err);
  }

  // 3. Fallback to local cache if network/server unavailable
  const localCached = loadUserDashboard(userId);
  if (localCached && localCached.widgets && localCached.widgets.length > 0) {
    return localCached;
  }

  return null;
}

// Load customized dashboard specifically for public viewers by sharer's userId and/or dashboardId
export async function loadDashboardByShareParams(userId?: string | null, dashId?: string | null): Promise<UserDashboardData | null> {
  if (!userId && !dashId) return null;

  // 1. Query shared dashboard hub (/api/shared-dashboards)
  try {
    const params = new URLSearchParams();
    if (userId) params.set('user', userId);
    if (dashId) params.set('dash', dashId);

    const res = await fetch(`/api/shared-dashboards?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.widgets && Array.isArray(data.widgets) && data.widgets.length > 0) {
        return {
          dashboardId: data.dashboardId || dashId || undefined,
          widgets: data.widgets,
          salesData: Array.isArray(data.salesData) && data.salesData.length > 0 ? data.salesData : INITIAL_SALES_RECORDS,
          dashboardTitle: data.dashboardTitle || data.dashboardName || 'แดชบอร์ดที่แชร์',
          themeConfig: data.themeConfig || {
            preset: 'violet',
            primaryColor: '#7c3aed',
            fontFamily: 'Prompt',
            borderRadius: 'rounded-lg',
            shadowStyle: 'shadow-sm',
          },
          filterState: data.filterState,
          connectionConfig: data.connectionConfig,
          spacingMode: data.spacingMode || 'ปกติ',
          lastSavedAt: data.lastSavedAt || '',
        };
      }
    }
  } catch (err) {
    console.warn('Load shared dashboard API warning', err);
  }

  // 2. Query /api/user-dashboard?userId=...
  if (userId) {
    try {
      const userRes = await fetch(`/api/user-dashboard?userId=${encodeURIComponent(userId)}`);
      if (userRes.ok) {
        const data = await userRes.json();
        if (data && data.widgets && Array.isArray(data.widgets) && data.widgets.length > 0) {
          return {
            dashboardId: data.dashboardId || dashId || undefined,
            widgets: data.widgets,
            salesData: Array.isArray(data.salesData) && data.salesData.length > 0 ? data.salesData : INITIAL_SALES_RECORDS,
            dashboardTitle: data.dashboardTitle || 'แดชบอร์ดที่แชร์',
            themeConfig: data.themeConfig || {
              preset: 'violet',
              primaryColor: '#7c3aed',
              fontFamily: 'Prompt',
              borderRadius: 'rounded-lg',
              shadowStyle: 'shadow-sm',
            },
            filterState: data.filterState,
            connectionConfig: data.connectionConfig,
            spacingMode: data.spacingMode || 'ปกติ',
            lastSavedAt: data.lastSavedAt || '',
          };
        }
      }
    } catch {}
  }

  // 3. Fallback to local cache if viewer is on same device
  if (userId) {
    const local = loadUserDashboard(userId);
    if (local && local.widgets && local.widgets.length > 0) {
      return local;
    }
  }

  return null;
}

// Save Project: Layout, Charts, Filters, Widgets, Theme, Data Mapping (Per-User Isolation)
// Saves this active dashboard as user's latest work ("ผลงานล่าสุด"), overwriting latest active draft when saved again.
// Saved templates and presets remain untouched and safe!
export async function saveUserDashboardAsync(
  userId?: string | null,
  data?: Omit<UserDashboardData, 'lastSavedAt'> | null,
  dashboardId?: string
): Promise<{ success: boolean; lastSavedAt: string; fileName?: string; error?: string }> {
  if (!userId || typeof userId !== 'string' || !userId.trim() || !data) {
    return { success: false, lastSavedAt: '', error: 'Missing userId or data' };
  }
  const cleanId = userId.trim();
  const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dId = dashboardId || data.dashboardId || `dash-${cleanId}-${(data.dashboardTitle || 'dash').replace(/\s+/g, '_')}`;

  const payload: UserDashboardData = {
    ...data,
    dashboardId: dId,
    lastSavedAt: timeStr,
  };

  // 1. Fast cache update strictly under this user's isolated keys
  if (typeof window !== 'undefined') {
    try {
      const key = getUserDashboardKey(cleanId);
      const str = JSON.stringify(payload);
      localStorage.setItem(key, str);
      localStorage.setItem(`user_dashboard_${cleanId}`, str);
      localStorage.setItem(`user_dashboard_${cleanId.toLowerCase()}`, str);

      const salesStr = JSON.stringify(data.salesData);
      localStorage.setItem(getUserSalesDataKey(cleanId), salesStr);
      localStorage.setItem(`user_sales_data_${cleanId}`, salesStr);
      localStorage.setItem(`user_sales_data_${cleanId.toLowerCase()}`, salesStr);
    } catch (e) {
      console.warn('Fast cache error', e);
    }
  }

  let serverRes: { success: boolean; fileName?: string; error?: string } = { success: false };

  // 2. Persist to Server File System API (Authoritative source across all machines and browsers)
  try {
    serverRes = await saveDashboardToServerFile(cleanId, payload);
  } catch (err: any) {
    console.warn('Server file save notice:', err);
  }

  // 3. Sync to shared dashboard hub so viewers on any machine can load this exact customized dashboard
  try {
    fetch('/api/shared-dashboards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        userId,
        dashboardId: dId,
        salesData: data.salesData || [],
      }),
    }).catch(() => {});
  } catch (e) {}

  // 4. Persist to Cloud Database (Lean template & graph settings with non-blocking sync)
  const dbPayload: DBDashboard = {
    dashboardId: dId,
    userId,
    dashboardName: data.dashboardTitle,
    dashboardConfig: {
      widgets: data.widgets,
      salesData: (data.salesData || []).slice(0, 500),
      themeConfig: data.themeConfig,
      filterState: data.filterState || null,
      connectionConfig: data.connectionConfig || null,
      spacingMode: data.spacingMode || 'normal',
      activeNav: data.activeNav || 'overview',
    },
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
  };

  try {
    await dbSaveDashboard(dbPayload);
  } catch (err) {
    console.warn('Save to cloud database warning:', err);
  }

  // 5. Dispatch global save event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('user_dashboard_saved', {
        detail: { userId, time: timeStr, dashboardId: dId, title: data.dashboardTitle },
      })
    );
  }

  return {
    success: true,
    lastSavedAt: timeStr,
    fileName: serverRes.fileName,
  };
}

export function saveUserDashboard(
  userId: string,
  data: Omit<UserDashboardData, 'lastSavedAt'>,
  dashboardId?: string
): string {
  const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  saveUserDashboardAsync(userId, data, dashboardId).catch((err) => {
    console.warn('Background save error:', err);
  });
  return timeStr;
}

export function getInitialDashboardData(): UserDashboardData {
  return {
    widgets: INITIAL_WIDGETS,
    salesData: INITIAL_SALES_RECORDS,
    dashboardTitle: 'ภาพรวมยอดขาย',
    themeConfig: {
      preset: 'violet',
      primaryColor: '#7c3aed',
      fontFamily: 'Prompt',
      borderRadius: 'rounded-lg',
      shadowStyle: 'shadow-sm',
    },
    lastSavedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
  };
}

// Fetch all saved projects for this user or all users (if admin)
export async function fetchUserProjects(user: TeamUser): Promise<DBDashboard[]> {
  const dbUser: DBUser = {
    userId: user.id,
    email: user.email,
    name: user.displayName,
    role: user.role,
    createdDate: user.createdAt,
  };
  return await dbGetDashboards(dbUser);
}

// Delete project
export async function removeUserProject(dashboardId: string): Promise<void> {
  await dbDeleteDashboard(dashboardId);
}

export function clearUserDashboardSession(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('user_session_cleared'));
  }
}
