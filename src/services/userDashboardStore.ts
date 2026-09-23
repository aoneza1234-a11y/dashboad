import { VisualWidget, SalesRecord, ThemeConfig, SheetConnectionConfig, DashboardVersion } from '../types';
import { INITIAL_SALES_RECORDS, INITIAL_WIDGETS } from '../data/sampleData';

export interface UserDashboardData {
  widgets: VisualWidget[];
  salesData: SalesRecord[];
  dashboardTitle: string;
  themeConfig: ThemeConfig;
  connectionConfig?: SheetConnectionConfig;
  versions?: DashboardVersion[];
  lastSavedAt: string;
}

const STORAGE_PREFIX = 'user_dashboard_';

export function getUserDashboardKey(userId: string): string {
  const safeId = encodeURIComponent(userId.trim().toLowerCase() || 'default_user');
  return `${STORAGE_PREFIX}${safeId}`;
}

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
    console.error('Failed to load user dashboard from storage', e);
    return null;
  }
}

export function saveUserDashboard(userId: string, data: Omit<UserDashboardData, 'lastSavedAt'>): string {
  if (typeof window === 'undefined') return '';
  try {
    const key = getUserDashboardKey(userId);
    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const payload: UserDashboardData = {
      ...data,
      lastSavedAt: timeStr,
    };
    localStorage.setItem(key, JSON.stringify(payload));
    
    // Dispatch custom event for cross-component awareness
    window.dispatchEvent(new CustomEvent('user_dashboard_saved', { detail: { userId, time: timeStr } }));
    return timeStr;
  } catch (e) {
    console.error('Failed to save user dashboard to storage', e);
    return '';
  }
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
