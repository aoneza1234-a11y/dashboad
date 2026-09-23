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
  viewerConfig: ViewerShareConfig;
  cmsSettings: AdminCMSSettings;
  securitySettings: AdminSecuritySettings;
}

const STORAGE_KEY = 'bi_studio_site_status_v2';

const DEFAULT_STATUS: SiteStatus = {
  platformName: 'Studio BI Analytics',
  platformSubtitle: 'ระบบบริหารและวิเคราะห์แดชบอร์ดอัจฉริยะ',
  isOnline: true,
  maintenanceTitle: 'เว็บไซต์ปิดปรับปรุงชั่วคราว',
  maintenanceMessage: 'ขณะนี้ผู้ดูแลระบบกำลังอัปเดตข้อมูลและปรับปรุงแดชบอร์ด ระบบจะเปิดให้บริการตามปกติเร็วๆ นี้ กรุณากลับมาใหม่อีกครั้งในภายหลัง',
  contactEmail: 'admin@studio-bi.com',
  updatedAt: new Date().toISOString(),
  updatedBy: 'ผู้ดูแลระบบ (Owner)',
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
    bannerMessage: '🎉 อัปเดตใหม่: รองรับการเชื่อมต่อ Google Sheets แบบเรียลไทม์ และส่งออก PDF คมชัดสูง',
    bannerType: 'info',
    systemNews: [
      {
        id: 'news-1',
        title: 'เพิ่มระบบ Drag & Drop Canvas อิสระ 100%',
        date: '2026-09-20',
        content: 'สมาชิกสามารถปรับแต่งตำแหน่งและขนาดของวิดเจ็ตได้อย่างอิสระบนผืนผ้าใบ',
        tag: 'อัปเดต',
      },
      {
        id: 'news-2',
        title: 'ยกระดับความปลอดภัยด้วยระบบแชร์ลิงก์กำหนดรหัสผ่าน',
        date: '2026-09-18',
        content: 'สร้างลิงก์สำหรับผู้ชมพร้อมตั้งรหัสผ่านและวันหมดอายุได้แล้ววันนี้',
        tag: 'ความปลอดภัย',
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

export function getSiteStatus(): SiteStatus {
  if (typeof window === 'undefined') return DEFAULT_STATUS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATUS));
      return DEFAULT_STATUS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATUS,
      ...parsed,
      viewerConfig: { ...DEFAULT_STATUS.viewerConfig, ...(parsed.viewerConfig || {}) },
      cmsSettings: { ...DEFAULT_STATUS.cmsSettings, ...(parsed.cmsSettings || {}) },
      securitySettings: { ...DEFAULT_STATUS.securitySettings, ...(parsed.securitySettings || {}) },
    };
  } catch (err) {
    console.error('Error loading site status:', err);
    return DEFAULT_STATUS;
  }
}

export function saveSiteStatus(status: Partial<SiteStatus>): SiteStatus {
  const current = getSiteStatus();
  const updated: SiteStatus = {
    ...current,
    ...status,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('site_status_changed'));
    } catch (err) {
      console.error('Error saving site status:', err);
    }
  }
  return updated;
}

export function toggleSiteOnline(isOnline?: boolean): SiteStatus {
  const current = getSiteStatus();
  const newOnline = isOnline !== undefined ? isOnline : !current.isOnline;
  return saveSiteStatus({ isOnline: newOnline });
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
