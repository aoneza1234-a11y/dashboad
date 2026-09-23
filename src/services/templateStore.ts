import { DashboardTemplate, VisualWidget } from '../types';
import { INITIAL_WIDGETS } from '../data/sampleData';
import { assignTemplatesToUsers } from './teamAuthStore';

const TEMPLATES_STORAGE_KEY = 'bi_studio_dashboard_templates_v1';

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

export function getDashboardTemplates(): DashboardTemplate[] {
  if (typeof window === 'undefined') return INITIAL_TEMPLATES;
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(INITIAL_TEMPLATES));
      return INITIAL_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TEMPLATES;
  } catch (err) {
    console.error('Failed to load dashboard templates', err);
    return INITIAL_TEMPLATES;
  }
}

export function saveDashboardTemplates(templates: DashboardTemplate[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error('Failed to save dashboard templates', err);
  }
}

export function createDashboardTemplate(
  title: string,
  description: string,
  category: string,
  widgets: VisualWidget[],
  assignedToUserIds: string[],
  createdBy: string = 'ผู้ดูแลระบบ'
): DashboardTemplate {
  const templates = getDashboardTemplates();
  const newTemplate: DashboardTemplate = {
    id: `tpl-${Date.now()}`,
    title: title.trim() || 'แดชบอร์ดแม่แบบใหม่',
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

  // Distribute to users
  if (assignedToUserIds.length > 0) {
    assignTemplatesToUsers(newTemplate.id, assignedToUserIds);
  }

  return newTemplate;
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
