import { DashboardTemplate, VisualWidget } from '../types';
import { INITIAL_WIDGETS } from '../data/sampleData';
import { assignTemplatesToUsers } from './teamAuthStore';
import { db } from './cloudDatabase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const TEMPLATES_STORAGE_KEY = 'bi_studio_dashboard_templates_v2';

const INITIAL_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'tpl-1',
    title: 'ภาพรวมยอดขาย & KPI ผู้บริหาร (Executive Sales)',
    description: 'เทมเพลตมาตรฐานสำหรับผู้บริหาร สรุปยอดขายรวม กำไรขั้นต้น ออเดอร์ และกราฟจำแนกตามหมวดหมู่สินค้า',
    category: 'Sales & Revenue',
    thumbnailIcon: 'BarChart3',
    widgets: INITIAL_WIDGETS,
    sampleDataCount: 100,
    createdBy: 'Thirawat (ผู้ดูแลระบบ)',
    createdAt: '2026-02-01',
    assignedToUserIds: ['all'], // Everyone gets this starter template
  },
  {
    id: 'tpl-2',
    title: 'รายงานการเงินและ P&L รายไตรมาส (Financial Overview)',
    description: 'แดชบอร์ดโครงสร้างงบการเงิน อัตรากำไรขั้นต้น และการเปรียบเทียบต้นทุนสินค้าคงเหลือ',
    category: 'Finance',
    thumbnailIcon: 'TrendingUp',
    widgets: INITIAL_WIDGETS.slice(0, 3).map((w, idx) => ({
      ...w,
      id: `tpl2-${idx}`,
      title: idx === 0 ? 'สรุปกำไรสุทธิรวม' : idx === 1 ? 'สัดส่วนค่าใช้จ่าย' : 'แนวโน้มกระแสเงินสด',
      metric: 'profit',
    })),
    sampleDataCount: 85,
    createdBy: 'Thirawat (ผู้ดูแลระบบ)',
    createdAt: '2026-02-15',
    assignedToUserIds: ['usr-editor-1', 'usr-editor-3'],
  },
  {
    id: 'tpl-3',
    title: 'ผลการดำเนินงานทีมขายและแคมเปญ (Campaign Matrix)',
    description: 'แดชบอร์ดติดตามเป้าหมายรายบุคคล ยอดขายตามช่องทาง และอัตราความสำเร็จของแคมเปญการตลาด',
    category: 'Marketing & Sales',
    thumbnailIcon: 'Users',
    widgets: INITIAL_WIDGETS.slice(1, 4).map((w, idx) => ({
      ...w,
      id: `tpl3-${idx}`,
      title: idx === 0 ? 'ยอดขายตามแคมเปญ' : 'อันดับทีมงานขายยอดเยี่ยม',
    })),
    sampleDataCount: 120,
    createdBy: 'Thirawat (ผู้ดูแลระบบ)',
    createdAt: '2026-03-01',
    assignedToUserIds: ['usr-editor-1', 'usr-editor-2'],
  },
];

let cachedTemplates: DashboardTemplate[] = INITIAL_TEMPLATES;

// Fetch latest templates from Server / Firestore
export async function fetchTemplatesFromServer(): Promise<DashboardTemplate[]> {
  // 1. Server API
  try {
    const res = await fetch('/api/templates', { headers: { 'Cache-Control': 'no-cache' } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cachedTemplates = data;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(data));
            window.dispatchEvent(new CustomEvent('dashboard_templates_changed', { detail: data }));
          } catch {}
        }
        return data;
      }
    }
  } catch {}

  // 2. Firestore fallback
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'system', 'templates'));
      if (snap.exists()) {
        const cloudData = snap.data();
        if (cloudData && Array.isArray(cloudData.items) && cloudData.items.length > 0) {
          cachedTemplates = cloudData.items;
          return cloudData.items;
        }
      }
    } catch {}
  }

  return getDashboardTemplates();
}

// Initial fetch on module load
if (typeof window !== 'undefined') {
  fetchTemplatesFromServer().catch(() => {});
}

export function getDashboardTemplates(): DashboardTemplate[] {
  if (typeof window === 'undefined') return INITIAL_TEMPLATES;
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(INITIAL_TEMPLATES));
      return cachedTemplates || INITIAL_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      cachedTemplates = parsed;
      return parsed;
    }
    return cachedTemplates || INITIAL_TEMPLATES;
  } catch (err) {
    return cachedTemplates || INITIAL_TEMPLATES;
  }
}

export function saveDashboardTemplates(templates: DashboardTemplate[]): void {
  cachedTemplates = templates;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
      window.dispatchEvent(new CustomEvent('dashboard_templates_changed', { detail: templates }));
    } catch (err) {
      console.error('Failed to save dashboard templates', err);
    }
  }

  // 1. Sync to Server File System API
  fetch('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(templates),
  }).catch(() => {});

  // 2. Sync to Cloud Firestore
  if (db) {
    setDoc(doc(db, 'system', 'templates'), { items: templates, updatedAt: new Date().toISOString() }, { merge: true })
      .catch(() => {});
  }
}

export function findExistingTemplateByTitle(title: string): DashboardTemplate | undefined {
  if (!title || typeof title !== 'string') return undefined;
  const clean = title.trim().toLowerCase();
  const templates = getDashboardTemplates();
  return templates.find((t) => (t.title || t.name || '').trim().toLowerCase() === clean);
}

export function saveOrUpdateDashboardTemplate(
  title: string,
  description: string,
  category: string,
  widgets: VisualWidget[],
  assignedToUserIds: string[],
  createdBy: string = 'ผู้ดูแลระบบ',
  forceOverwrite: boolean = false
): { template: DashboardTemplate; isOverwritten: boolean } {
  const templates = getDashboardTemplates();
  const cleanTitle = title.trim() || 'แดชบอร์ดแม่แบบใหม่';
  const existing = findExistingTemplateByTitle(cleanTitle);

  if (existing && forceOverwrite) {
    // Overwrite the existing template with new layout, widgets, and info
    const updatedTemplate: DashboardTemplate = {
      ...existing,
      title: cleanTitle,
      description: description.trim() || existing.description,
      category: category.trim() || existing.category,
      widgets: JSON.parse(JSON.stringify(widgets)),
      sampleDataCount: widgets.length * 15,
      createdAt: new Date().toISOString().split('T')[0],
      assignedToUserIds: Array.from(new Set([...(existing.assignedToUserIds || []), ...assignedToUserIds])),
    };

    const updatedList = templates.map((t) => (t.id === existing.id ? updatedTemplate : t));
    saveDashboardTemplates(updatedList);

    if (assignedToUserIds.length > 0) {
      assignTemplatesToUsers(updatedTemplate.id, assignedToUserIds);
    }

    return { template: updatedTemplate, isOverwritten: true };
  }

  // Create brand new template
  const newTemplate: DashboardTemplate = {
    id: `tpl-${Date.now()}`,
    title: cleanTitle,
    description: description.trim() || 'แม่แบบแดชบอร์ดสร้างจากระบบหลังบ้านเพื่อส่งให้ทีมงานใช้งาน',
    category: category.trim() || 'องค์กรทั่วไป',
    thumbnailIcon: 'LayoutDashboard',
    widgets: JSON.parse(JSON.stringify(widgets)),
    sampleDataCount: widgets.length * 15,
    createdBy,
    createdAt: new Date().toISOString().split('T')[0],
    assignedToUserIds,
  };

  const updated = [newTemplate, ...templates];
  saveDashboardTemplates(updated);

  if (assignedToUserIds.length > 0) {
    assignTemplatesToUsers(newTemplate.id, assignedToUserIds);
  }

  return { template: newTemplate, isOverwritten: false };
}

export function createDashboardTemplate(
  title: string,
  description: string,
  category: string,
  widgets: VisualWidget[],
  assignedToUserIds: string[],
  createdBy: string = 'ผู้ดูแลระบบ',
  forceOverwrite: boolean = false
): DashboardTemplate {
  const result = saveOrUpdateDashboardTemplate(
    title,
    description,
    category,
    widgets,
    assignedToUserIds,
    createdBy,
    forceOverwrite
  );
  return result.template;
}

export function distributeTemplateToUsers(templateId: string, userIds: string[]): DashboardTemplate[] {
  const templates = getDashboardTemplates();
  const updated = templates.map((t) => {
    if (t.id === templateId) {
      const mergedUsers = Array.from(new Set([...t.assignedToUserIds, ...userIds]));
      return { ...t, assignedToUserIds: mergedUsers };
    }
    return t;
  });

  saveDashboardTemplates(updated);
  assignTemplatesToUsers(templateId, userIds);
  return updated;
}

export function deleteDashboardTemplate(templateId: string): DashboardTemplate[] {
  const templates = getDashboardTemplates();
  const updated = templates.filter((t) => t.id !== templateId);
  saveDashboardTemplates(updated);
  return updated;
}

export function getAssignedTemplatesForUser(userId: string): DashboardTemplate[] {
  const allTemplates = getDashboardTemplates();
  return allTemplates.filter(
    (t) => t.assignedToUserIds.includes('all') || t.assignedToUserIds.includes(userId)
  );
}
