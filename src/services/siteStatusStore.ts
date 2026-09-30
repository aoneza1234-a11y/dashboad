import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirestoreAvailable } from './cloudDatabase';

export interface ViewerShareConfig {
  passwordEnabled: boolean;
  password?: string;
  expiryEnabled: boolean;
  expiryDate?: string;
  allowDownload: boolean;
  maxViewsLimit?: number;
  totalViewsCount: number;
}

export interface AdminCMSSettings {
  bannerEnabled: boolean;
  bannerMessage: string;
  bannerType: 'info' | 'warning' | 'success';
  systemNews: { id: string; title: string; date: string; content: string; tag: string }[];
  seoTitle: string;
  seoDescription: string;
}

export interface AdminSecuritySettings {
  mfaRequired: boolean;
  ipWhitelist: string[];
  sessionTimeoutMinutes: number;
}

export interface SiteStatus {
  platformName: string;
  platformSubtitle?: string;
  isOnline: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  contactEmail?: string;
  updatedAt: string;
  updatedBy: string;
  defaultLandingPortal?: 'studio' | 'viewer';
  adminPasscode?: string;
  viewerConfig: ViewerShareConfig;
  cmsSettings: AdminCMSSettings;
  securitySettings: AdminSecuritySettings;
}

const STORAGE_KEY = 'bi_studio_site_status_v2';
const ADMIN_SESSION_KEY = 'bi_studio_admin_auth_v1';
const BROADCAST_CHANNEL_NAME = 'bi_studio_global_site_status_channel';

const DEFAULT_STATUS: SiteStatus = {
  platformName: 'Studio BI Analytics',
  platformSubtitle: 'ระบบบริหารและวิเคราะห์แดชบอร์ดอัจฉริยะ',
  isOnline: true,
  maintenanceTitle: 'เว็บไซต์ปิดปรับปรุงชั่วคราว',
  maintenanceMessage: 'ขณะนี้ผู้ดูแลระบบกำลังอัปเดตข้อมูลและปรับปรุงแดชบอร์ด ระบบจะเปิดให้บริการตามปกติเร็วๆ นี้ กรุณากลับมาใหม่อีกครั้งในภายหลัง',
  contactEmail: 'admin@studio-bi.com',
  updatedAt: new Date().toISOString(),
  updatedBy: 'ผู้ดูแลระบบ (Owner)',
  defaultLandingPortal: 'studio',
  adminPasscode: 'admin1234',
  viewerConfig: {
    passwordEnabled: false,
    password: '',
    expiryEnabled: false,
    expiryDate: '',
    allowDownload: true,
    maxViewsLimit: 1000,
    totalViewsCount: 142,
  },
  cmsSettings: {
    bannerEnabled: false,
    bannerMessage: '🎉 อัปเดตใหม่: เชื่อมต่อข้อมูลและแชร์แดชบอร์ดแบบเรียลไทม์',
    bannerType: 'info',
    systemNews: [
      {
        id: 'news-1',
        title: 'ระบบเชื่อมต่อแดชบอร์ดออนไลน์แบบรวมศูนย์',
        date: '2026-09-30',
        content: 'ข้อมูลและสถานะการปิด-เปิดเว็บเชื่อมต่อถึงกันแบบเรียลไทม์ทุกบราวเซอร์',
        tag: 'อัปเดต',
      },
    ],
    seoTitle: 'Enterprise BI Studio - แพลตฟอร์มสร้างและวิเคราะห์แดชบอร์ดอัจฉริยะ',
    seoDescription: 'สร้างแดชบอร์ด กรองข้อมูลเชิงลึก และแชร์รายงานให้กับผู้ชมได้แบบเรียลไทม์',
  },
  securitySettings: {
    mfaRequired: false,
    ipWhitelist: ['127.0.0.1', '192.168.1.0/24'],
    sessionTimeoutMinutes: 60,
  },
};

// In-memory cache for fast synchronous access
let cachedStatus: SiteStatus = DEFAULT_STATUS;
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      if (event.data && typeof event.data === 'object' && 'isOnline' in event.data) {
        cachedStatus = event.data;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(event.data));
        } catch {}
        window.dispatchEvent(new CustomEvent('site_status_changed', { detail: event.data }));
      }
    };
  } catch (e) {
    console.warn('BroadcastChannel not initialized', e);
  }
}

export function getSiteStatus(): SiteStatus {
  if (typeof window === 'undefined') return DEFAULT_STATUS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      cachedStatus = {
        ...DEFAULT_STATUS,
        ...parsed,
        viewerConfig: { ...DEFAULT_STATUS.viewerConfig, ...(parsed.viewerConfig || {}) },
        cmsSettings: { ...DEFAULT_STATUS.cmsSettings, ...(parsed.cmsSettings || {}) },
        securitySettings: { ...DEFAULT_STATUS.securitySettings, ...(parsed.securitySettings || {}) },
      };
      return cachedStatus;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATUS));
    return DEFAULT_STATUS;
  } catch (err) {
    console.error('Error loading site status:', err);
    return cachedStatus || DEFAULT_STATUS;
  }
}

// Fetch latest site status from the shared Server API (/api/site-status)
export async function fetchSiteStatusFromServer(): Promise<SiteStatus> {
  try {
    const res = await fetch('/api/site-status', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (res.ok) {
      const data: SiteStatus = await res.json();
      if (data && typeof data.isOnline === 'boolean') {
        const merged: SiteStatus = {
          ...DEFAULT_STATUS,
          ...data,
          viewerConfig: { ...DEFAULT_STATUS.viewerConfig, ...(data.viewerConfig || {}) },
          cmsSettings: { ...DEFAULT_STATUS.cmsSettings, ...(data.cmsSettings || {}) },
          securitySettings: { ...DEFAULT_STATUS.securitySettings, ...(data.securitySettings || {}) },
        };
        const prevStatus = getSiteStatus();
        const changed = prevStatus.isOnline !== merged.isOnline || prevStatus.updatedAt !== merged.updatedAt;

        cachedStatus = merged;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch {}
          if (changed) {
            window.dispatchEvent(new CustomEvent('site_status_changed', { detail: merged }));
          }
        }
        return merged;
      }
    }
  } catch (e) {
    // Non-blocking fallback
  }

  // Also check Firestore if available
  if (isFirestoreAvailable && db) {
    try {
      const snap = await getDoc(doc(db, 'system', 'site_status'));
      if (snap.exists()) {
        const cloudData = snap.data() as SiteStatus;
        if (cloudData && typeof cloudData.isOnline === 'boolean') {
          cachedStatus = {
            ...DEFAULT_STATUS,
            ...cloudData,
          };
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedStatus));
            } catch {}
            window.dispatchEvent(new CustomEvent('site_status_changed', { detail: cachedStatus }));
          }
          return cachedStatus;
        }
      }
    } catch {}
  }

  return getSiteStatus();
}

// Save site status: Persists to Server API, Cloud Firestore, LocalStorage, and broadcasts across all tabs/windows
export function saveSiteStatus(status: Partial<SiteStatus>): SiteStatus {
  const current = getSiteStatus();
  const updated: SiteStatus = {
    ...current,
    ...status,
    updatedAt: new Date().toISOString(),
  };
  cachedStatus = updated;

  // 1. Update localStorage immediately (<1ms)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('site_status_changed', { detail: updated }));
    } catch (err) {
      console.error('Error saving site status locally:', err);
    }

    // 2. Broadcast to other tabs/windows on the machine
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(updated);
      } catch (e) {}
    }
  }

  // 3. Persist to shared Server API (/api/site-status) - instantly synchronizes across all users & browsers!
  fetch('/api/site-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  }).catch((err) => {
    console.warn('Sync site status to server warning:', err);
  });

  // 4. Non-blocking Firestore sync
  if (isFirestoreAvailable && db) {
    setDoc(doc(db, 'system', 'site_status'), JSON.parse(JSON.stringify(updated)), { merge: true }).catch(() => {});
  }

  return updated;
}

export function toggleSiteOnline(isOnline?: boolean): SiteStatus {
  const current = getSiteStatus();
  const newOnline = isOnline !== undefined ? isOnline : !current.isOnline;
  return saveSiteStatus({
    isOnline: newOnline,
    updatedAt: new Date().toISOString(),
    updatedBy: 'ผู้ดูแลระบบ (Owner)',
  });
}

// Active real-time subscription for all browsers
// Starts polling every 2.5s and listens to Firestore + BroadcastChannel
export function startSiteStatusSync(onUpdate: (status: SiteStatus) => void): () => void {
  // Initial immediate fetch
  fetchSiteStatusFromServer().then(onUpdate).catch(() => {});

  // Poll server API every 2.5 seconds to detect site shutdown from ANY other browser
  const intervalId = setInterval(() => {
    fetchSiteStatusFromServer().then(onUpdate).catch(() => {});
  }, 2500);

  // Real-time Firestore snapshot listener if available
  let unsubscribeFirestore: (() => void) | null = null;
  if (isFirestoreAvailable && db) {
    try {
      unsubscribeFirestore = onSnapshot(doc(db, 'system', 'site_status'), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as SiteStatus;
          if (data && typeof data.isOnline === 'boolean') {
            cachedStatus = { ...DEFAULT_STATUS, ...data };
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedStatus));
              } catch {}
              window.dispatchEvent(new CustomEvent('site_status_changed', { detail: cachedStatus }));
            }
            onUpdate(cachedStatus);
          }
        }
      }, () => {});
    } catch {}
  }

  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<SiteStatus>;
    if (customEvent.detail) {
      onUpdate(customEvent.detail);
    } else {
      onUpdate(getSiteStatus());
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('site_status_changed', handleCustomEvent);
  }

  return () => {
    clearInterval(intervalId);
    if (unsubscribeFirestore) {
      try { unsubscribeFirestore(); } catch {}
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('site_status_changed', handleCustomEvent);
    }
  };
}

export function incrementViewerCount(): void {
  const current = getSiteStatus();
  saveSiteStatus({
    viewerConfig: {
      ...current.viewerConfig,
      totalViewsCount: (current.viewerConfig?.totalViewsCount || 0) + 1,
    },
  });
}

export function verifyAdminPasscode(inputPasscode: string): boolean {
  const current = getSiteStatus();
  const validPass = current.adminPasscode || 'admin1234';
  return inputPasscode.trim() === validPass.trim();
}

export function isAdminAuthenticatedSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAdminAuthenticatedSession(authenticated: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (authenticated) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    } else {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
    window.dispatchEvent(new Event('admin_auth_changed'));
  } catch (err) {
    console.error('Failed to set admin auth session', err);
  }
}

export function logoutAdminSession(): void {
  setAdminAuthenticatedSession(false);
}
