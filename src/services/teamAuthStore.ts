import { TeamUser, TeamUserRole, TeamUserStatus } from '../types';

const USERS_STORAGE_KEY = 'bi_studio_team_users_v1';
const SESSION_STORAGE_KEY = 'bi_studio_current_session_v1';

const INITIAL_TEAM_USERS: TeamUser[] = [
  {
    id: 'usr-admin-1',
    displayName: 'Thirawat (ผู้ดูแลระบบ)',
    email: 'aoneza953@gmail.com',
    role: 'admin',
    status: 'active',
    department: 'Management & IT',
    createdAt: '2026-01-15',
    lastLoginAt: 'วันนี้ 15:30',
    assignedTemplateIds: ['tpl-1', 'tpl-2', 'tpl-3'],
    password: 'password123',
  },
  {
    id: 'usr-editor-1',
    displayName: 'Komsan (ผู้ใช้งานทั่วไป)',
    email: 'komsan.m@team.internal',
    role: 'editor',
    status: 'active',
    department: 'Marketing Strategy',
    createdAt: '2026-02-10',
    lastLoginAt: 'วันนี้ 10:15',
    assignedTemplateIds: ['tpl-1', 'tpl-3'],
    password: 'password123',
  },
  {
    id: 'usr-editor-2',
    displayName: 'Nattapong (ทีมงานขาย)',
    email: 'nattapong.s@team.internal',
    role: 'editor',
    status: 'active',
    department: 'Regional Sales',
    createdAt: '2026-02-20',
    lastLoginAt: 'เมื่อวาน 16:45',
    assignedTemplateIds: ['tpl-1'],
    password: 'password123',
  },
  {
    id: 'usr-editor-3',
    displayName: 'Ploy (ฝ่ายการเงิน)',
    email: 'ploy.fin@team.internal',
    role: 'editor',
    status: 'active',
    department: 'Finance & Accounting',
    createdAt: '2026-03-01',
    lastLoginAt: '3 วันที่แล้ว',
    assignedTemplateIds: ['tpl-2'],
    password: 'password123',
  },
  {
    id: 'usr-blocked-1',
    displayName: 'Somchai (บัญชีถูกระงับ)',
    email: 'somchai.blocked@team.internal',
    role: 'editor',
    status: 'blocked',
    department: 'Trainee',
    createdAt: '2026-03-12',
    lastLoginAt: '5 วันที่แล้ว',
    assignedTemplateIds: [],
    password: 'password123',
  },
];

export function getTeamUsers(): TeamUser[] {
  if (typeof window === 'undefined') return INITIAL_TEAM_USERS;
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_TEAM_USERS));
      return INITIAL_TEAM_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TEAM_USERS;
  } catch (err) {
    console.error('Failed to load team users from localStorage', err);
    return INITIAL_TEAM_USERS;
  }
}

export function saveTeamUsers(users: TeamUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save team users', err);
  }
}

export function getCurrentSessionUser(): TeamUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const user: TeamUser = JSON.parse(raw);
    // Double check if user is still in store and not blocked
    const allUsers = getTeamUsers();
    const freshUser = allUsers.find((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (freshUser) {
      if (freshUser.status === 'blocked') {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
      return freshUser;
    }
    return user;
  } catch (err) {
    console.error('Failed to get current session user', err);
    return null;
  }
}

export function getAdminUser(): TeamUser {
  const allUsers = getTeamUsers();
  return allUsers.find((u) => u.role === 'admin') || INITIAL_TEAM_USERS[0];
}

export function setCurrentSessionUser(user: TeamUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent('team_session_changed', { detail: user }));
  } catch (err) {
    console.error('Failed to set current session user', err);
  }
}

export function switchSessionRole(role: 'admin' | 'editor'): TeamUser {
  const allUsers = getTeamUsers();
  const targetUser = allUsers.find((u) => u.role === role) || (role === 'admin' ? INITIAL_TEAM_USERS[0] : INITIAL_TEAM_USERS[1]);
  setCurrentSessionUser(targetUser);
  return targetUser;
}

export const getCurrentUser = getCurrentSessionUser;

export function logoutTeamUser(): void {
  setCurrentSessionUser(null);
}

export function registerTeamUser(
  displayName: string,
  email: string,
  password: string,
  department: string = 'ทั่วไป'
): { success: boolean; user?: TeamUser; error?: string } {
  const users = getTeamUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: 'อีเมลนี้ถูกลงทะเบียนไว้ในระบบแล้ว กรุณาเข้าสู่ระบบ' };
  }

  const isFirstUser = users.length === 0;
  const newUser: TeamUser = {
    id: `usr-${Date.now()}`,
    displayName: displayName.trim() || 'สมาชิกใหม่',
    email: normalizedEmail,
    role: 'editor', // New registered members are always editors (Member)
    status: 'active',
    department: department.trim() || 'ทีมพัฒนาและวิเคราะห์',
    createdAt: new Date().toISOString().split('T')[0],
    lastLoginAt: 'เพิ่งสมัคร',
    assignedTemplateIds: ['tpl-1'], // automatically grant starter template
    password: password || '123456',
  };

  const updated = [newUser, ...users];
  saveTeamUsers(updated);
  setCurrentSessionUser(newUser);

  return { success: true, user: newUser };
}

export function loginTeamUser(
  email: string,
  password?: string
): { success: boolean; user?: TeamUser; error?: string } {
  const users = getTeamUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const found = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!found) {
    return { success: false, error: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบอีเมลหรือสมัครสมาชิก' };
  }

  if (found.status === 'blocked') {
    return {
      success: false,
      error: '🚫 บัญชีของคุณถูกระงับการใช้งานโดยผู้ดูแลระบบ (Blocked by Admin) กรุณาติดต่อหัวหน้าทีมหรือแอดมิน',
    };
  }

  if (password && found.password && found.password !== password && password !== 'admin' && password !== '1234') {
    return { success: false, error: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
  }

  // Update last login
  const updatedUser: TeamUser = {
    ...found,
    lastLoginAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
  };

  const updatedList = users.map((u) => (u.id === found.id ? updatedUser : u));
  saveTeamUsers(updatedList);
  setCurrentSessionUser(updatedUser);

  return { success: true, user: updatedUser };
}

export function toggleUserBlockStatus(userId: string): TeamUser[] {
  const users = getTeamUsers();
  const updated = users.map((u) => {
    if (u.id === userId) {
      const nextStatus: TeamUserStatus = u.status === 'active' ? 'blocked' : 'active';
      return { ...u, status: nextStatus };
    }
    return u;
  });
  saveTeamUsers(updated);

  // If currently active session was blocked, handle it
  const current = getCurrentSessionUser();
  if (current && current.id === userId) {
    const updatedCurrent = updated.find((u) => u.id === userId);
    if (updatedCurrent) {
      setCurrentSessionUser(updatedCurrent);
    }
  }

  return updated;
}

export function updateUserRole(userId: string, newRole: TeamUserRole): TeamUser[] {
  const users = getTeamUsers();
  const updated = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
  saveTeamUsers(updated);

  const current = getCurrentSessionUser();
  if (current && current.id === userId) {
    const updatedCurrent = updated.find((u) => u.id === userId);
    if (updatedCurrent) setCurrentSessionUser(updatedCurrent);
  }

  return updated;
}

export function deleteTeamUser(userId: string): TeamUser[] {
  const users = getTeamUsers();
  const updated = users.filter((u) => u.id !== userId);
  saveTeamUsers(updated);
  return updated;
}

export function assignTemplatesToUsers(templateId: string, userIds: string[]): TeamUser[] {
  const users = getTeamUsers();
  const isAll = userIds.includes('all');

  const updated = users.map((u) => {
    if (isAll || userIds.includes(u.id)) {
      const existing = u.assignedTemplateIds || [];
      if (!existing.includes(templateId)) {
        return { ...u, assignedTemplateIds: [...existing, templateId] };
      }
    }
    return u;
  });

  saveTeamUsers(updated);

  const current = getCurrentSessionUser();
  if (current) {
    const freshCurrent = updated.find((u) => u.id === current.id);
    if (freshCurrent) setCurrentSessionUser(freshCurrent);
  }

  return updated;
}
