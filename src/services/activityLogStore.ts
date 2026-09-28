export interface ActivityLogItem {
  id: string;
  type: 'login' | 'dashboard_save' | 'template_adoption' | 'datasource_upload' | 'role_change' | 'site_status';
  title: string;
  detail: string;
  userEmail: string;
  userName: string;
  userRole?: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}

const STORAGE_KEY = 'bi_studio_activity_logs_v1';

const INITIAL_LOGS: ActivityLogItem[] = [
  {
    id: 'log-1',
    type: 'login',
    title: 'ผู้ใช้เข้าสู่ระบบสำเร็จ',
    detail: 'เข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบ (Admin) จากเซสชัน',
    userEmail: 'aoneza953@gmail.com',
    userName: 'Thirawat (ผู้ดูแลระบบ)',
    userRole: 'admin',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    status: 'success',
  },
  {
    id: 'log-2',
    type: 'dashboard_save',
    title: 'บันทึกแดชบอร์ด',
    detail: 'บันทึกการจัดวางวิดเจ็ต 12 รายการ และซิงค์ชุดข้อมูลภาพรวมยอดขาย',
    userEmail: 'komsan.m@team.internal',
    userName: 'Komsan (ผู้ใช้งานทั่วไป)',
    userRole: 'editor',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    status: 'info',
  },
  {
    id: 'log-3',
    type: 'template_adoption',
    title: 'นำเข้าเทมเพลตทีม',
    detail: 'นำเข้าเทมเพลต "ภาพรวมยอดขายผู้บริหารและภูมิภาค" ลงสู่พื้นที่ทำงาน',
    userEmail: 'nattapong.s@team.internal',
    userName: 'Nattapong (ทีมงานขาย)',
    userRole: 'editor',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'success',
  },
  {
    id: 'log-4',
    type: 'datasource_upload',
    title: 'อัปโหลดชุดข้อมูลใหม่',
    detail: 'อัปโหลดและจัดเก็บไฟล์ "sales_q3_enterprise.csv" จำนวน 100 แถว',
    userEmail: 'aoneza953@gmail.com',
    userName: 'Thirawat (ผู้ดูแลระบบ)',
    userRole: 'admin',
    timestamp: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    status: 'success',
  },
  {
    id: 'log-5',
    type: 'site_status',
    title: 'อัปเดตสถานะเว็บไซต์',
    detail: 'เปิดให้บริการเว็บไซต์สำหรับผู้ใช้งานตามปกติ (Online Mode)',
    userEmail: 'system',
    userName: 'System Router',
    userRole: 'admin',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'info',
  },
];

export function getActivityLogs(): ActivityLogItem[] {
  if (typeof window === 'undefined') return INITIAL_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_LOGS;
  }
}

export function logActivity(item: Omit<ActivityLogItem, 'id' | 'timestamp'>): ActivityLogItem {
  const current = getActivityLogs();
  const newItem: ActivityLogItem = {
    ...item,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  const updated = [newItem, ...current.slice(0, 199)]; // Keep latest 200 logs
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('activity_log_added', { detail: newItem }));
    } catch (err) {
      console.warn('Failed to save activity log:', err);
    }
  }
  return newItem;
}

export function clearActivityLogs(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('activity_log_added'));
  }
}
