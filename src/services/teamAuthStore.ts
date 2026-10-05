import { TeamUser, TeamUserRole, TeamUserStatus } from '../types';
import {
  dbGetAllUsers,
  dbRegisterUser,
  dbLoginUser,
  dbResetPassword,
  dbSetCurrentSessionUser,
  dbGetCurrentSessionUser,
  dbUpdateUserRole,
  DBUser,
  seedInitialDatabase,
  DEFAULT_USERS,
} from './cloudDatabase';

const SESSION_STORAGE_KEY = 'bi_studio_current_session_v1';

export { DEFAULT_USERS } from './cloudDatabase';

// Seed initial users on module load
seedInitialDatabase().catch(console.warn);

export function mapDBUserToTeamUser(u: DBUser): TeamUser {
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
    // Explicit logged-out or unauthenticated state
    if (!raw || raw === 'LOGGED_OUT' || raw === 'null') {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.id || parsed.userId)) return parsed;
  } catch (err) {}

  return null;
}

export const getCurrentUser = getCurrentSessionUser;

export async function syncSessionFromServer(): Promise<TeamUser | null> {
  const local = getCurrentSessionUser();
  if (!local) {
    // If not authenticated locally on this browser, remain unauthenticated (visitor/guest)
    return null;
  }

  try {
    // Verify and refresh latest user data from server
    const res = await fetch('/api/users', { headers: { 'Cache-Control': 'no-cache' } });
    if (res.ok) {
      const allUsers: any[] = await res.json();
      const updated = allUsers.find(
        (u: any) =>
          u.userId === local.id ||
          u.id === local.id ||
          (u.email && local.email && u.email.toLowerCase() === local.email.toLowerCase())
      );
      if (updated) {
        const teamUser = mapDBUserToTeamUser(updated);
        try {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(teamUser));
        } catch (e) {}
        return teamUser;
      }
    }
  } catch (e) {}
  return local;
}

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
      // Sync to server active session API so all devices see this user
      fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: user.id,
          user: {
            userId: user.id,
            id: user.id,
            email: user.email,
            name: user.displayName || user.name,
            displayName: user.displayName || user.name,
            role: user.role,
            department: user.department,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
          },
        }),
      }).catch(() => {});
    } else {
      localStorage.setItem(SESSION_STORAGE_KEY, 'LOGGED_OUT');
      dbSetCurrentSessionUser(null);
      fetch('/api/session', { method: 'DELETE' }).catch(() => {});
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

export const DEFAULT_TEAM_USERS: TeamUser[] = [
  {
    id: 'usr-admin-primary',
    name: 'Thirawat (เจ้าของระบบ)',
    displayName: 'Thirawat (เจ้าของระบบ)',
    email: 'aoneza1234@gmail.com',
    role: 'admin',
    status: 'active',
    department: 'ผู้ดูแลระบบและวิเคราะห์ข้อมูล',
    createdAt: '2026-01-01',
    lastLoginAt: 'เพิ่งเข้าสู่ระบบ',
    assignedTemplateIds: ['tpl-1', 'tpl-2', 'tpl-3'],
  },
  {
    id: 'usr-admin-1',
    name: 'Thirawat (ผู้ดูแลระบบ)',
    displayName: 'Thirawat (ผู้ดูแลระบบ)',
    email: 'aoneza953@gmail.com',
    role: 'admin',
    status: 'active',
    department: 'ฝ่ายบริหาร & ไอที',
    createdAt: '2026-01-15',
    lastLoginAt: 'วันนี้ 15:30',
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
  {
    id: 'usr-editor-1',
    name: 'Komsan (ผู้ใช้งานทั่วไป)',
    displayName: 'Komsan (ผู้ใช้งานทั่วไป)',
    email: 'komsan.m@team.internal',
    role: 'editor',
    status: 'active',
    department: 'ฝ่ายกลยุทธ์การตลาด',
    createdAt: '2026-02-10',
    lastLoginAt: 'วันนี้ 10:15',
    assignedTemplateIds: ['tpl-1', 'tpl-3'],
  },
  {
    id: 'usr-editor-2',
    name: 'Nattapong (ทีมงานขาย)',
    displayName: 'Nattapong (ทีมงานขาย)',
    email: 'nattapong.s@team.internal',
    role: 'editor',
    status: 'active',
    department: 'ฝ่ายพัฒนาธุรกิจและงานขาย',
    createdAt: '2026-02-20',
    lastLoginAt: 'เมื่อวาน 16:45',
    assignedTemplateIds: ['tpl-1'],
  },
  {
    id: 'usr-editor-3',
    name: 'วราภรณ์ ขจรศักดิ์',
    displayName: 'วราภรณ์ ขจรศักดิ์',
    email: 'waraporn.k@company.co.th',
    role: 'editor',
    status: 'active',
    department: 'ฝ่ายบัญชีและการเงิน',
    createdAt: '2026-02-25',
    lastLoginAt: '4 วันที่แล้ว',
    assignedTemplateIds: ['tpl-2'],
  },
];

let cachedTeamUsers: TeamUser[] = DEFAULT_TEAM_USERS;

export async function fetchAllTeamUsers(): Promise<TeamUser[]> {
  // 1. Fetch from Central Server API (/api/users) - single source of truth across all devices
  try {
    const res = await fetch('/api/users', { headers: { 'Cache-Control': 'no-cache' } });
    if (res.ok) {
      const serverUsers = await res.json();
      if (Array.isArray(serverUsers) && serverUsers.length > 0) {
        const mapped: TeamUser[] = serverUsers.map((u: any) => ({
          id: u.userId || u.id,
          name: u.name || u.displayName || 'สมาชิก',
          displayName: u.displayName || u.name || 'สมาชิก',
          email: u.email || '',
          role: u.role || 'editor',
          status: u.status || 'active',
          department: u.department || 'ทั่วไป',
          createdAt: u.createdDate ? u.createdDate.split('T')[0] : '2026-01-01',
          lastLoginAt: u.lastLoginAt || 'เพิ่งเข้าสู่ระบบ',
          assignedTemplateIds: u.assignedTemplateIds || ['tpl-1'],
          password: u.password,
        }));

        // Merge with default users so none are lost
        const byId = new Map<string, TeamUser>();
        for (const u of DEFAULT_TEAM_USERS) byId.set(u.id, u);
        for (const u of mapped) byId.set(u.id, u);
        const merged = Array.from(byId.values());

        cachedTeamUsers = merged;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('bi_studio_team_users_v2', JSON.stringify(merged));
            window.dispatchEvent(new CustomEvent('team_users_updated', { detail: merged }));
          } catch {}
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn('Server users fetch notice:', err);
  }

  // 2. Fetch from Cloud Database (Firestore / IDB)
  try {
    const dbUsers = await dbGetAllUsers();
    if (dbUsers && dbUsers.length > 0) {
      const mapped = dbUsers.map(mapDBUserToTeamUser);
      const byId = new Map<string, TeamUser>();
      for (const u of DEFAULT_TEAM_USERS) byId.set(u.id, u);
      for (const u of mapped) byId.set(u.id, u);
      const merged = Array.from(byId.values());
      cachedTeamUsers = merged;
      return merged;
    }
  } catch {}

  return cachedTeamUsers || DEFAULT_TEAM_USERS;
}

// Initial fetch on module load
if (typeof window !== 'undefined') {
  fetchAllTeamUsers().catch(() => {});
}

export function getTeamUsers(): TeamUser[] {
  if (typeof window === 'undefined') return DEFAULT_TEAM_USERS;
  try {
    const raw = localStorage.getItem('bi_studio_team_users_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure all default users are present in merged list
        const byId = new Map<string, TeamUser>();
        for (const u of DEFAULT_TEAM_USERS) byId.set(u.id, u);
        for (const u of parsed) byId.set(u.id, u);
        cachedTeamUsers = Array.from(byId.values());
        return cachedTeamUsers;
      }
    }
  } catch (e) {}
  return cachedTeamUsers.length > 0 ? cachedTeamUsers : DEFAULT_TEAM_USERS;
}

export function saveTeamUsers(users: TeamUser[]): void {
  cachedTeamUsers = users;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('bi_studio_team_users_v2', JSON.stringify(users));
      window.dispatchEvent(new CustomEvent('team_users_updated', { detail: users }));
    } catch (e) {
      console.warn(e);
    }
  }

  // Atomic single batch update to Central Server API to eliminate race conditions
  fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'batch-save',
      users: users.map((u) => ({
        userId: u.id,
        id: u.id,
        name: u.displayName || u.name,
        displayName: u.displayName || u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        department: u.department,
        password: u.password,
        assignedTemplateIds: u.assignedTemplateIds || ['tpl-1'],
      })),
    }),
  }).catch(() => {});
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
  // 1. Update in-memory user list
  const users = getTeamUsers().map((u) => {
    if (u.id === userId) {
      return { ...u, role: newRole };
    }
    return u;
  });
  cachedTeamUsers = users;

  // 2. Persist to localStorage immediately
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('bi_studio_team_users_v2', JSON.stringify(users));
      window.dispatchEvent(new CustomEvent('team_users_updated', { detail: users }));
    } catch (e) {}
  }

  // 3. If updated user is the currently active session user, update session immediately!
  const currentSession = getCurrentSessionUser();
  if (
    currentSession &&
    (currentSession.id === userId ||
      (currentSession.email &&
        users.find((u) => u.id === userId)?.email?.toLowerCase() === currentSession.email.toLowerCase()))
  ) {
    const updatedSession = { ...currentSession, role: newRole };
    setCurrentSessionUser(updatedSession);
  }

  // 4. Update IDB and Firestore so future syncs retain this new role
  dbUpdateUserRole(userId, newRole).catch(() => {});

  // 5. Send atomic update-role request to server API
  fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update-role',
      userId,
      role: newRole,
    }),
  }).catch(() => {});

  // 6. Also batch save full state
  saveTeamUsers(users);

  return users;
}

export function deleteTeamUser(userId: string): TeamUser[] {
  const users = getTeamUsers().filter((u) => u.id !== userId);
  cachedTeamUsers = users;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('bi_studio_team_users_v2', JSON.stringify(users));
      window.dispatchEvent(new CustomEvent('team_users_updated', { detail: users }));
    } catch {}
  }

  // Delete from Server API
  fetch(`/api/users?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  }).catch(() => {});

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
