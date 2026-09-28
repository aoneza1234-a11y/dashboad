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

export function getUserDashboardKey(userId: string): string {
  const safeId = encodeURIComponent(userId.trim().toLowerCase() || 'default_user');
  return `${STORAGE_PREFIX}${safeId}`;
}

export function getUserSalesDataKey(userId: string): string {
  const safeId = encodeURIComponent(userId.trim().toLowerCase() || 'default_user');
  return `${SALES_PREFIX}${safeId}`;
}

// Synchronous fast-read for instant boot (<5ms)
export function loadUserDashboard(userId: string): UserDashboardData | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = getUserDashboardKey(userId);
    let raw = localStorage.getItem(key);
    if (!raw) {
      raw = localStorage.getItem(`user_dashboard_${userId}`);
    }
    if (!raw) {
      raw = localStorage.getItem(`user_dashboard_${userId.trim().toLowerCase()}`);
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Retrieve user-specific isolated sales data
    let sales = parsed.salesData;
    const salesKey = getUserSalesDataKey(userId);
    let rawSales = localStorage.getItem(salesKey);
    if (!rawSales) {
      rawSales = localStorage.getItem(`user_sales_data_${userId}`);
    }
    if (!rawSales) {
      rawSales = localStorage.getItem(`user_sales_data_${userId.trim().toLowerCase()}`);
    }
    if (rawSales) {
      try {
        const parsedSales = JSON.parse(rawSales);
        if (Array.isArray(parsedSales) && parsedSales.length > 0) {
          sales = parsedSales;
        }
      } catch (e) {}
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

// Asynchronous Cloud Database loader with fast local-first fallback
export async function loadUserDashboardFromCloud(userId: string): Promise<UserDashboardData | null> {
  // 1. Return fast local cache immediately if available
  const localCached = loadUserDashboard(userId);
  if (localCached) {
    // Non-blocking background verification from cloud
    dbGetLatestDashboard(userId).then((latest) => {
      if (latest && latest.dashboardConfig && latest.dashboardConfig.widgets) {
        // Keep updated in background
        const cloudData: UserDashboardData = {
          dashboardId: latest.dashboardId,
          widgets: latest.dashboardConfig.widgets || INITIAL_WIDGETS,
          salesData: localCached.salesData || latest.dashboardConfig.salesData || INITIAL_SALES_RECORDS,
          dashboardTitle: latest.dashboardName || localCached.dashboardTitle,
          themeConfig: latest.dashboardConfig.themeConfig || localCached.themeConfig,
          filterState: latest.dashboardConfig.filterState || localCached.filterState,
          connectionConfig: latest.dashboardConfig.connectionConfig || localCached.connectionConfig,
          spacingMode: latest.dashboardConfig.spacingMode || localCached.spacingMode,
          lastSavedAt: new Date(latest.updatedDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        };
        try {
          localStorage.setItem(getUserDashboardKey(userId), JSON.stringify(cloudData));
        } catch (e) {}
      }
    }).catch(() => {});

    return localCached;
  }

  // 2. If not in local cache, query IndexedDB / Cloud
  try {
    const latest = await dbGetLatestDashboard(userId);
    if (latest && latest.dashboardConfig) {
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
        localStorage.setItem(getUserDashboardKey(userId), JSON.stringify(data));
        localStorage.setItem(getUserSalesDataKey(userId), JSON.stringify(data.salesData));
      }
      return data;
    }
  } catch (err) {
    console.warn('Load user dashboard from cloud warning:', err);
  }

  return null;
}

// Save Project: Layout, Charts, Filters, Widgets, Theme, Data Mapping (Per-User Isolation)
export function saveUserDashboard(
  userId: string,
  data: Omit<UserDashboardData, 'lastSavedAt'>,
  dashboardId?: string
): string {
  const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dId = dashboardId || data.dashboardId || `dash-${userId}-${data.dashboardTitle.replace(/\s+/g, '_')}`;

  const payload: UserDashboardData = {
    ...data,
    dashboardId: dId,
    lastSavedAt: timeStr,
  };

  // 1. Fast cache update strictly under this user's isolated keys
  if (typeof window !== 'undefined') {
    try {
      const key = getUserDashboardKey(userId);
      const str = JSON.stringify(payload);
      localStorage.setItem(key, str);
      localStorage.setItem(`user_dashboard_${userId}`, str);
      localStorage.setItem(`user_dashboard_${userId.trim().toLowerCase()}`, str);

      const salesStr = JSON.stringify(data.salesData);
      localStorage.setItem(getUserSalesDataKey(userId), salesStr);
      localStorage.setItem(`user_sales_data_${userId}`, salesStr);
      localStorage.setItem(`user_sales_data_${userId.trim().toLowerCase()}`, salesStr);
    } catch (e) {
      console.warn('Fast cache error', e);
    }
  }

  // 2. Persist to Cloud Database (Lean template & graph settings with non-blocking sync)
  const dbPayload: DBDashboard = {
    dashboardId: dId,
    userId,
    dashboardName: data.dashboardTitle,
    dashboardConfig: {
      widgets: data.widgets,
      salesData: (data.salesData || []).slice(0, 5), // Store minimal lean sample in cloud document to prevent payload bloat
      themeConfig: data.themeConfig,
      filterState: data.filterState,
      connectionConfig: data.connectionConfig,
      spacingMode: data.spacingMode,
      activeNav: data.activeNav,
    },
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
  };

  dbSaveDashboard(dbPayload).catch((err) => {
    console.warn('Save to cloud database warning:', err);
  });

  // 3. Dispatch global save event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('user_dashboard_saved', {
        detail: { userId, time: timeStr, dashboardId: dId, title: data.dashboardTitle },
      })
    );
  }

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
