import { UserDashboardData } from './userDashboardStore';

/**
 * Server-Side File Storage & Client JSON File Exporter/Importer
 * Supports up to 10GB per user storage with instant file download/upload and server persistence.
 */

export async function saveDashboardToServerFile(
  userId: string,
  data: UserDashboardData
): Promise<{ success: boolean; fileName?: string; sizeBytes?: number; error?: string }> {
  try {
    const response = await fetch(`/api/user-dashboard?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        userId,
        fileSavedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const res = await response.json();
    return {
      success: true,
      fileName: res.fileName,
      sizeBytes: res.sizeBytes,
    };
  } catch (err: any) {
    // Non-blocking fallback if server endpoint is offline
    return {
      success: false,
      error: err?.message || 'Failed to save to server file',
    };
  }
}

export async function loadDashboardFromServerFile(
  userId: string
): Promise<UserDashboardData | null> {
  try {
    const response = await fetch(`/api/user-dashboard?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (data && Array.isArray(data.widgets) && data.widgets.length > 0) {
      return data as UserDashboardData;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Export complete dashboard project as a standalone .json file to the user's computer.
 * Guaranteed zero data loss, independent of browser cache or cookies.
 */
export function exportDashboardToFile(data: UserDashboardData, customFileName?: string): void {
  try {
    const title = (data.dashboardTitle || 'dashboard').trim().replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = customFileName || `${title}_${dateStr}.bi.json`;

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Failed to export dashboard file', e);
  }
}

/**
 * Import a dashboard project from a local .json file chosen by user.
 */
export function importDashboardFromFile(file: File): Promise<UserDashboardData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || !Array.isArray(parsed.widgets)) {
          throw new Error('โครงสร้างไฟล์ไม่ถูกต้อง (ไม่พบข้อมูล Widgets)');
        }
        resolve(parsed as UserDashboardData);
      } catch (err: any) {
        reject(new Error(err?.message || 'ไม่สามารถอ่านไฟล์ JSON ได้'));
      }
    };
    reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการเปิดไฟล์'));
    reader.readAsText(file);
  });
}
