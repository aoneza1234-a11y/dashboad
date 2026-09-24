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

export function getUserDashboardKey(userId: string): string {
  const safeId = encodeURIComponent(userId.trim().toLowerCase() || 'default_user');
  return `${STORAGE_PREFIX}${safeId}`;
}

// Synchronous fast-read for instant boot
export function loadUserDashboard(userId: string): UserDashboardData | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = getUserDashboardKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.widgets) && Array.isArray(parsed.salesData)) {
      return parsed;
    }
    return null;
  } catch (e) {
    console.error('Failed to load user dashboard from fast cache', e);
    return null;
  }
}

// Asynchronous Cloud Database loader
export async function loadUserDashboardFromCloud(userId: string): Promise<UserDashboardData | null> {
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
      // Keep fast cache in sync
      if (typeof window !== 'undefined') {
        localStorage.setItem(getUserDashboardKey(userId), JSON.stringify(data));
      }
      return data;
    }
  } catch (err) {
    console.warn('Load user dashboard from cloud warning:', err);
  }
  return loadUserDashboard(userId);
}

// Save Project: Layout, Charts, Filters, Widgets, Theme, Data Mapping
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

  // 1. Fast cache update
  if (typeof window !== 'undefined') {
    try {
      const key = getUserDashboardKey(userId);
      localStorage.setItem(key, JSON.stringify(payload));
      localStorage.setItem('bi_studio_dashboard_title_v2', data.dashboardTitle);
      localStorage.setItem('bi_studio_sales_data_v2', JSON.stringify(data.salesData));
    } catch (e) {
      console.warn('Fast cache error', e);
    }
  }

  // 2. Persist to Cloud Database (Firestore + IndexedDB)
  const dbPayload: DBDashboard = {
    dashboardId: dId,
    userId,
    dashboardName: data.dashboardTitle,
    dashboardConfig: {
      widgets: data.widgets,
      salesData: data.salesData,
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
