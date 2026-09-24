import { TeamUser, TeamUserRole, TeamUserStatus } from '../types';
import {
  dbGetAllUsers,
  dbRegisterUser,
  dbLoginUser,
  dbResetPassword,
  dbSetCurrentSessionUser,
  dbGetCurrentSessionUser,
  DBUser,
  seedInitialDatabase,
} from './cloudDatabase';

const SESSION_STORAGE_KEY = 'bi_studio_current_session_v1';

// Seed initial users on module load
seedInitialDatabase().catch(console.warn);

function mapDBUserToTeamUser(u: DBUser): TeamUser {
  return {
    id: u.userId,
    email: u.email,
    displayName: u.name,
    name: u.name,
    role: u.role,
    status: 'active',
    department: u.department || 'ทีมทั่วไป',
    createdAt: u.createdDate.split('T')[0] || '2026-01-01',
    lastLoginAt: u.lastLoginAt || 'เพิ่งสมัคร',
    assignedTemplateIds: ['tpl-1'],
    password: u.password,
  };
}

export function getCurrentSessionUser(): TeamUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export const getCurrentUser = getCurrentSessionUser;

export function setCurrentSessionUser(user: TeamUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      // Also sync to Cloud DB session
      dbSetCurrentSessionUser({
        userId: user.id,
        email: user.email,
        name: user.displayName,
        role: user.role,
        department: user.department,
        createdDate: user.createdAt,
      });
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      dbSetCurrentSessionUser(null);
    }
    window.dispatchEvent(new CustomEvent('team_session_changed', { detail: user }));
  } catch (err) {
    console.error('Failed to set current session user', err);
  }
}

export function logoutTeamUser(): void {
  setCurrentSessionUser(null);
}

export async function registerTeamUserAsync(
  displayName: string,
  email: string,
  password: string,
  department: string = 'ทั่วไป'
): Promise<{ success: boolean; user?: TeamUser; error?: string }> {
  const res = await dbRegisterUser(displayName, email, password, department);
  if (!res.success || !res.user) {
    return { success: false, error: res.error };
  }
  const teamUser = mapDBUserToTeamUser(res.user);
  setCurrentSessionUser(teamUser);
  return { success: true, user: teamUser };
}

export async function loginTeamUserAsync(
  email: string,
  password?: string
): Promise<{ success: boolean; user?: TeamUser; error?: string }> {
  const res = await dbLoginUser(email, password);
  if (!res.success || !res.user) {
    return { success: false, error: res.error };
  }
  const teamUser = mapDBUserToTeamUser(res.user);
  setCurrentSessionUser(teamUser);
  return { success: true, user: teamUser };
}

export async function resetPasswordAsync(
  email: string,
  newPass: string
): Promise<{ success: boolean; error?: string }> {
  return await dbResetPassword(email, newPass);
}

// Synchronous wrappers for components that use sync signatures
export function registerTeamUser(
  displayName: string,
  email: string,
  password: string,
  department: string = 'ทั่วไป'
): { success: boolean; user?: TeamUser; error?: string } {
  // Trigger async in background
  registerTeamUserAsync(displayName, email, password, department).catch(console.error);

  const newUser: TeamUser = {
    id: `usr-${Date.now()}`,
    displayName: displayName.trim() || 'สมาชิกใหม่',
    name: displayName.trim() || 'สมาชิกใหม่',
    email: email.trim().toLowerCase(),
    role: 'editor',
    status: 'active',
    department: department.trim() || 'ทีมพัฒนาและวิเคราะห์',
    createdAt: new Date().toISOString().split('T')[0],
    lastLoginAt: 'เพิ่งสมัคร',
    assignedTemplateIds: ['tpl-1'],
    password: password || '123456',
  };
  setCurrentSessionUser(newUser);
  return { success: true, user: newUser };
}

export function loginTeamUser(
  email: string,
  password?: string
): { success: boolean; user?: TeamUser; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();

  // Try immediate match from known users
  const adminEmail = 'aoneza953@gmail.com';
  if (normalizedEmail === adminEmail) {
    const adminUser: TeamUser = {
      id: 'usr-admin-1',
      displayName: 'Thirawat (ผู้ดูแลระบบ)',
      name: 'Thirawat (ผู้ดูแลระบบ)',
      email: adminEmail,
      role: 'admin',
      status: 'active',
      department: 'Management & IT',
      createdAt: '2026-01-15',
      lastLoginAt: 'ตอนนี้',
      assignedTemplateIds: ['tpl-1', 'tpl-2', 'tpl-3'],
      password: 'password123',
    };
    setCurrentSessionUser(adminUser);
    loginTeamUserAsync(email, password).catch(console.error);
    return { success: true, user: adminUser };
  }

  // Create or retrieve session user
  const generalUser: TeamUser = {
    id: `usr-${encodeURIComponent(normalizedEmail)}`,
    displayName: normalizedEmail.split('@')[0],
    name: normalizedEmail.split('@')[0],
    email: normalizedEmail,
    role: 'editor',
    status: 'active',
    department: 'ผู้ใช้งาน',
    createdAt: new Date().toISOString().split('T')[0],
    lastLoginAt: 'ตอนนี้',
    assignedTemplateIds: ['tpl-1'],
    password: password || '123456',
  };

  setCurrentSessionUser(generalUser);
  loginTeamUserAsync(email, password).catch(console.error);
  return { success: true, user: generalUser };
}

export async function fetchAllTeamUsers(): Promise<TeamUser[]> {
  const dbUsers = await dbGetAllUsers();
  return dbUsers.map(mapDBUserToTeamUser);
}

export function getTeamUsers(): TeamUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('bi_studio_team_users_v2');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    {
      id: 'usr-admin-1',
      name: 'Thirawat (ผู้ดูแลระบบ)',
      displayName: 'Thirawat (ผู้ดูแลระบบ)',
      email: 'aoneza953@gmail.com',
      role: 'admin',
      status: 'active',
      department: 'ฝ่ายบริหาร & ไอที',
      createdAt: '2026-01-15',
      lastLoginAt: 'วันนี้ 08:30',
      assignedTemplateIds: ['tpl-1', 'tpl-2', 'tpl-3', 'tpl-4'],
    },
    {
      id: 'usr-sales-1',
      name: 'ศิริพร ใจมั่น',
      displayName: 'ศิริพร ใจมั่น',
      email: 'siriporn.j@company.co.th',
      role: 'editor',
      status: 'active',
      department: 'ฝ่ายขายและการตลาด',
      createdAt: '2026-02-01',
      lastLoginAt: 'เมื่อวานนี้',
      assignedTemplateIds: ['tpl-1', 'tpl-2'],
    },
    {
      id: 'usr-sales-2',
      name: 'กิตติศักดิ์ พัฒนา',
      displayName: 'กิตติศักดิ์ พัฒนา',
      email: 'kittisak.p@company.co.th',
      role: 'viewer',
      status: 'active',
      department: 'ทีมปฏิบัติการสาขา',
      createdAt: '2026-02-10',
      lastLoginAt: '3 วันที่แล้ว',
      assignedTemplateIds: ['tpl-1'],
    },
  ];
}

export function saveTeamUsers(users: TeamUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('bi_studio_team_users_v2', JSON.stringify(users));
  } catch (e) {
    console.warn(e);
  }
}

export function toggleUserBlockStatus(userId: string): TeamUser[] {
  const users = getTeamUsers().map((u) => {
    if (u.id === userId) {
      const nextStatus = u.status === 'blocked' ? 'active' : 'blocked';
      return { ...u, status: nextStatus as TeamUserStatus };
    }
    return u;
  });
  saveTeamUsers(users);
  return users;
}

export function updateUserRole(userId: string, newRole: TeamUserRole): TeamUser[] {
  const users = getTeamUsers().map((u) => {
    if (u.id === userId) {
      return { ...u, role: newRole };
    }
    return u;
  });
  saveTeamUsers(users);
  return users;
}

export function deleteTeamUser(userId: string): TeamUser[] {
  const users = getTeamUsers().filter((u) => u.id !== userId);
  saveTeamUsers(users);
  return users;
}

export function assignTemplatesToUsers(templateId: string, userIds: string[]): void {
  const users = getTeamUsers().map((u) => {
    if (userIds.includes('all') || userIds.includes(u.id)) {
      const assigned = new Set(u.assignedTemplateIds || []);
      assigned.add(templateId);
      return { ...u, assignedTemplateIds: Array.from(assigned) };
    }
    return u;
  });
  saveTeamUsers(users);
}

export function switchSessionRole(newRole: TeamUserRole): TeamUser | null {
  const current = getCurrentSessionUser();
  if (!current) return null;
  const updated: TeamUser = { ...current, role: newRole };
  setCurrentSessionUser(updated);
  return updated;
}
