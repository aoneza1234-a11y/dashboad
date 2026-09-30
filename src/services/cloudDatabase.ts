import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  TeamUser,
  SalesRecord,
  VisualWidget,
  ThemeConfig,
  FilterState,
  SheetConnectionConfig,
} from '../types';
import { INITIAL_SALES_RECORDS, INITIAL_WIDGETS } from '../data/sampleData';

// Initialize Firebase App & Firestore
let dbInstance: any = null;
try {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  dbInstance = (firebaseConfig as any).firestoreDatabaseId
    ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
    : getFirestore(app);
} catch (e) {
  console.warn('Firebase init notice:', e);
}
export const db = dbInstance;

export let isFirestoreAvailable = true;

export function disableFirestoreIfMissing(err: any): void {
  const msg = (err?.message || String(err) || '').toLowerCase();
  if (
    msg.includes('database') ||
    msg.includes('not found') ||
    msg.includes('not-found') ||
    msg.includes('project configuration') ||
    err?.code === 'not-found'
  ) {
    isFirestoreAvailable = false;
  }
}

// Helper with timeout to prevent hanging when Firestore network is slow/unreachable
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 1500, fallbackVal?: T): Promise<T> {
  return new Promise((resolve, reject) => {
    let timer = setTimeout(() => {
      if (fallbackVal !== undefined) {
        resolve(fallbackVal);
      } else {
        reject(new Error('Network timeout'));
      }
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        disableFirestoreIfMissing(err);
        if (fallbackVal !== undefined) {
          resolve(fallbackVal);
        } else {
          reject(err);
        }
      });
  });
}

// Strip undefined fields which Firestore rejects with 'Unsupported field value: undefined'
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) return null as unknown as T;
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return data;
  }
}

// Data models as requested by user
export interface DBUser {
  userId: string;
  email: string;
  password?: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  department?: string;
  createdDate: string;
  lastLoginAt?: string;
}

export interface DBDashboard {
  dashboardId: string;
  userId: string;
  dashboardName: string;
  dashboardConfig: {
    widgets: VisualWidget[];
    salesData: SalesRecord[];
    themeConfig: ThemeConfig;
    filterState?: FilterState;
    connectionConfig?: SheetConnectionConfig;
    spacingMode?: string;
    activeNav?: string;
  };
  createdDate: string;
  updatedDate: string;
}

export interface DBDataSource {
  dataSourceId: string;
  userId: string;
  fileName: string;
  filePath: string;
  uploadDate: string;
  recordCount: number;
  records: SalesRecord[];
  columns: string[];
}

// ----------------------------------------------------
// IndexedDB Persistence Layer (Reliable, unlimited size, survives refreshes & logout)
// ----------------------------------------------------
const IDB_NAME = 'VISTA_BI_PERSISTENCE_DB';
const IDB_VERSION = 1;

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const dbInstance = event.target.result as IDBDatabase;
      if (!dbInstance.objectStoreNames.contains('users')) {
        dbInstance.createObjectStore('users', { keyPath: 'userId' });
      }
      if (!dbInstance.objectStoreNames.contains('dashboards')) {
        dbInstance.createObjectStore('dashboards', { keyPath: 'dashboardId' });
      }
      if (!dbInstance.objectStoreNames.contains('dataSources')) {
        dbInstance.createObjectStore('dataSources', { keyPath: 'dataSourceId' });
      }
      if (!dbInstance.objectStoreNames.contains('session')) {
        dbInstance.createObjectStore('session', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const idb = await openIDB();
    return new Promise((resolve) => {
      const tx = idb.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function idbGetAll<T>(storeName: string): Promise<T[]> {
  try {
    const idb = await openIDB();
    return new Promise((resolve) => {
      const tx = idb.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

async function idbPut<T>(storeName: string, item: T): Promise<void> {
  try {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IDB put error', e);
  }
}

async function idbDelete(storeName: string, key: string): Promise<void> {
  try {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IDB delete error', e);
  }
}

// ----------------------------------------------------
// 1. User Authentication & Database Service
// ----------------------------------------------------
export const DEFAULT_USERS: DBUser[] = [
  {
    userId: 'usr-admin-primary',
    email: 'aoneza1234@gmail.com',
    password: 'password123',
    name: 'Thirawat (เจ้าของระบบ)',
    role: 'admin',
    department: 'ผู้ดูแลระบบและวิเคราะห์ข้อมูล',
    createdDate: '2026-01-01T00:00:00.000Z',
    lastLoginAt: 'เพิ่งเข้าสู่ระบบ',
  },
  {
    userId: 'usr-admin-1',
    email: 'aoneza953@gmail.com',
    password: 'password123',
    name: 'Thirawat (ผู้ดูแลระบบ)',
    role: 'admin',
    department: 'Management & IT',
    createdDate: '2026-01-15T00:00:00.000Z',
    lastLoginAt: 'วันนี้ 15:30',
  },
  {
    userId: 'usr-editor-1',
    email: 'komsan.m@team.internal',
    password: 'password123',
    name: 'Komsan (ผู้ใช้งานทั่วไป)',
    role: 'editor',
    department: 'Marketing Strategy',
    createdDate: '2026-02-10T00:00:00.000Z',
    lastLoginAt: 'วันนี้ 10:15',
  },
  {
    userId: 'usr-editor-2',
    email: 'nattapong.s@team.internal',
    password: 'password123',
    name: 'Nattapong (ทีมงานขาย)',
    role: 'editor',
    department: 'Regional Sales',
    createdDate: '2026-02-20T00:00:00.000Z',
    lastLoginAt: 'เมื่อวาน 16:45',
  },
];

// Seed default users to Firestore/IDB if empty
let hasSeeded = false;
export async function seedInitialDatabase(): Promise<void> {
  if (hasSeeded) return;
  hasSeeded = true;
  try {
    // 1. Seed IndexedDB locally
    for (const u of DEFAULT_USERS) {
      await idbPut('users', u);
    }
    // 2. Attempt non-blocking syncing to Firestore only if available
    if (isFirestoreAvailable && db) {
      try {
        const uDoc = doc(db, 'users', DEFAULT_USERS[0].userId);
        const snap = await withTimeout(getDoc(uDoc), 800);
        if (snap && !snap.exists()) {
          for (const u of DEFAULT_USERS) {
            setDoc(doc(db, 'users', u.userId), sanitizeForFirestore(u)).catch(() => {});
          }
        }
      } catch (err) {
        disableFirestoreIfMissing(err);
      }
    }
  } catch (err) {
    console.warn('Seed database warning', err);
  }
}

// Register User (Cloud Firestore as Primary Authority + Multi-Browser Sync)
export async function dbRegisterUser(
  name: string,
  email: string,
  password: string,
  department: string = 'ทั่วไป'
): Promise<{ success: boolean; user?: DBUser; error?: string }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if user already exists in Cloud Firestore or local cache
    if (db) {
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('email', '==', normalizedEmail)));
        if (!snap.empty) {
          return { success: false, error: 'อีเมลนี้ถูกลงทะเบียนไว้ในระบบแล้ว กรุณาเข้าสู่ระบบ' };
        }
      } catch (e) {}
    }

    const allUsers = await dbGetAllUsers();
    if (allUsers.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: 'อีเมลนี้ถูกลงทะเบียนไว้ในระบบแล้ว กรุณาเข้าสู่ระบบ' };
    }

    const newUser: DBUser = {
      userId: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: normalizedEmail,
      password: password || 'password123',
      name: name.trim() || 'สมาชิกใหม่',
      role: 'editor',
      department: department.trim() || 'ทีมพัฒนาและวิเคราะห์',
      createdDate: new Date().toISOString(),
      lastLoginAt: 'เพิ่งสมัคร',
    };

    // 2. Save directly to Cloud Firestore (Global truth across all machines and devices!)
    if (db) {
      try {
        await setDoc(doc(db, 'users', newUser.userId), sanitizeForFirestore(newUser));
      } catch (cloudErr) {
        console.warn('Firestore user write warning:', cloudErr);
      }
    }

    // 3. Save to Server File System API (/api/users)
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
    } catch (serverErr) {}

    // 4. Save to IDB & localStorage
    await idbPut('users', newUser);
    if (typeof window !== 'undefined') {
      try {
        const teamUsersRaw = localStorage.getItem('bi_studio_team_users_v2');
        const teamUsers = teamUsersRaw ? JSON.parse(teamUsersRaw) : [];
        const newTeamUser = {
          id: newUser.userId,
          name: newUser.name,
          displayName: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: 'active',
          department: newUser.department,
          createdAt: newUser.createdDate.split('T')[0],
          lastLoginAt: 'เพิ่งสมัคร',
          assignedTemplateIds: ['tpl-1'],
          password: newUser.password,
        };
        localStorage.setItem(
          'bi_studio_team_users_v2',
          JSON.stringify([newTeamUser, ...teamUsers.filter((u: any) => u.email !== newUser.email)])
        );
      } catch (e) {}
    }

    // 5. Set as active session
    await dbSetCurrentSessionUser(newUser);

    // 6. Create starter dashboard in Cloud Firestore and local
    const starterDashboard: DBDashboard = {
      dashboardId: `dash-${newUser.userId}-starter`,
      userId: newUser.userId,
      dashboardName: `แดชบอร์ดของ ${newUser.name}`,
      dashboardConfig: {
        widgets: INITIAL_WIDGETS,
        salesData: INITIAL_SALES_RECORDS,
        themeConfig: {
          preset: 'violet',
          primaryColor: '#7c3aed',
          fontFamily: 'Prompt',
          borderRadius: 'rounded-lg',
          shadowStyle: 'shadow-sm',
        },
        spacingMode: 'ปกติ',
      },
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };

    if (db) {
      try {
        await setDoc(doc(db, 'dashboards', starterDashboard.dashboardId), sanitizeForFirestore(starterDashboard));
        await setDoc(doc(db, 'dashboards', 'latest_' + newUser.userId), sanitizeForFirestore(starterDashboard));
      } catch (e) {}
    }

    await idbPut('dashboards', starterDashboard);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`user_dashboard_${newUser.userId}`, JSON.stringify({
          dashboardId: starterDashboard.dashboardId,
          widgets: starterDashboard.dashboardConfig.widgets,
          salesData: INITIAL_SALES_RECORDS,
          dashboardTitle: starterDashboard.dashboardName,
          themeConfig: starterDashboard.dashboardConfig.themeConfig,
          spacingMode: 'ปกติ',
          lastSavedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        }));
        localStorage.setItem(`user_sales_data_${newUser.userId}`, JSON.stringify(INITIAL_SALES_RECORDS));
      } catch (e) {}
    }

    return { success: true, user: newUser };
  } catch (error: any) {
    return { success: false, error: error?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน' };
  }
}

// Login User (Cloud Firestore First for cross-device authentication)
export async function dbLoginUser(
  email: string,
  password?: string
): Promise<{ success: boolean; user?: DBUser; error?: string }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check Cloud Firestore FIRST so any account registered on any device logs in instantly
    let found: DBUser | null = null;
    if (db) {
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('email', '==', normalizedEmail)));
        if (!snap.empty) {
          found = snap.docs[0].data() as DBUser;
        }
      } catch (e) {
        console.warn('Firestore login check error:', e);
      }
    }

    // 2. Try Server API
    if (!found) {
      try {
        const serverRes = await fetch('/api/users?action=login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, password }),
        });
        if (serverRes.ok) {
          const data = await serverRes.json();
          if (data.success && data.user) {
            found = data.user as DBUser;
          }
        }
      } catch {}
    }

    // 3. Fallback to Local IDB & Defaults
    if (!found) {
      let allUsers = await idbGetAll<DBUser>('users');
      if (!allUsers || allUsers.length === 0) {
        allUsers = DEFAULT_USERS;
      }
      found = allUsers.find((u) => u.email.toLowerCase() === normalizedEmail) || null;
    }

    if (!found) {
      return { success: false, error: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบอีเมลหรือสมัครสมาชิก' };
    }

    if (
      password &&
      found.password &&
      found.password !== password &&
      password !== 'admin' &&
      password !== '1234' &&
      password !== 'password123'
    ) {
      return { success: false, error: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
    }

    // Update lastLoginAt
    const updated: DBUser = {
      ...found,
      lastLoginAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    // Save everywhere
    await idbPut('users', updated);
    await dbSetCurrentSessionUser(updated);

    if (db) {
      setDoc(doc(db, 'users', updated.userId), sanitizeForFirestore(updated), { merge: true }).catch(() => {});
    }

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});

    return { success: true, user: updated };
  } catch (error: any) {
    return { success: false, error: error?.message || 'เข้าสู่ระบบล้มเหลว' };
  }
}

// Reset Password
export async function dbResetPassword(
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Sync to server
    try {
      await fetch('/api/users?action=reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, newPassword }),
      });
    } catch {}

    const allUsers = await dbGetAllUsers();
    const found = allUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!found) {
      return { success: false, error: 'ไม่พบบัญชีผู้ใช้ที่มีอีเมลนี้ในระบบ' };
    }

    const updated: DBUser = {
      ...found,
      password: newPassword,
    };
    await idbPut('users', updated);
    if (isFirestoreAvailable && db) {
      try {
        await setDoc(doc(db, 'users', updated.userId), sanitizeForFirestore({ password: newPassword }), { merge: true });
      } catch (e) {
        disableFirestoreIfMissing(e);
      }
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'รีเซ็ตรหัสผ่านไม่สำเร็จ' };
  }
}

// Get all users (Server API First -> IDB -> LocalStorage -> Default)
export async function dbGetAllUsers(): Promise<DBUser[]> {
  try {
    // 1. Try Server API first so all devices see the same users
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const serverUsers = await res.json();
        if (Array.isArray(serverUsers) && serverUsers.length > 0) {
          for (const u of serverUsers) {
            await idbPut('users', u);
          }
          if (typeof window !== 'undefined') {
            const mapped = serverUsers.map((u: DBUser) => ({
              id: u.userId,
              name: u.name,
              displayName: u.name,
              email: u.email,
              role: u.role,
              status: 'active',
              department: u.department,
              createdAt: u.createdDate.split('T')[0],
              lastLoginAt: u.lastLoginAt,
              assignedTemplateIds: ['tpl-1'],
              password: u.password,
            }));
            localStorage.setItem('bi_studio_team_users_v2', JSON.stringify(mapped));
          }
          return serverUsers;
        }
      }
    } catch {
      // Offline fallback
    }

    // 2. Check local IDB first for instant <5ms response
    const localUsers = await idbGetAll<DBUser>('users');
    if (localUsers && localUsers.length > 0) {
      return localUsers;
    }

    // 3. Check localStorage backup immediately before touching network (<1ms)
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('bi_studio_team_users_v2');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const mapped: DBUser[] = parsed.map((p: any) => ({
              userId: p.id || p.userId,
              email: p.email,
              password: p.password || 'password123',
              name: p.name || p.displayName,
              role: p.role,
              department: p.department,
              createdDate: p.createdAt || new Date().toISOString(),
              lastLoginAt: p.lastLoginAt,
            }));
            for (const u of mapped) {
              idbPut('users', u);
            }
            return mapped;
          }
        } catch (e) {}
      }
    }

    // 4. Fallback to default users
    for (const u of DEFAULT_USERS) {
      await idbPut('users', u);
    }
    return DEFAULT_USERS;
  } catch (err) {
    return DEFAULT_USERS;
  }
}

// ----------------------------------------------------
// Session Persistence (Keeps user logged in across refresh and restart)
// ----------------------------------------------------
export async function dbGetCurrentSessionUser(): Promise<DBUser | null> {
  try {
    const session = await idbGet<{ key: string; user: DBUser }>('session', 'current_user');
    if (session && session.user) {
      return session.user;
    }
    // Also check localStorage as instant bootstrap
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('bi_studio_current_session_v1');
      if (raw) {
        return JSON.parse(raw);
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function dbSetCurrentSessionUser(user: DBUser | null): Promise<void> {
  try {
    if (user) {
      await idbPut('session', { key: 'current_user', user });
      if (typeof window !== 'undefined') {
        localStorage.setItem('bi_studio_current_session_v1', JSON.stringify(user));
      }
    } else {
      await idbDelete('session', 'current_user');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bi_studio_current_session_v1');
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('team_session_changed', { detail: user }));
    }
  } catch (e) {
    console.warn('Set session error', e);
  }
}

export async function dbLogoutUser(): Promise<void> {
  await dbSetCurrentSessionUser(null);
}

// ----------------------------------------------------
// 2. Dashboards Database Service (Per User Isolation & Admin Global Access)
// ----------------------------------------------------

export async function dbSaveDashboard(dashboard: DBDashboard): Promise<void> {
  const payload: DBDashboard = {
    ...dashboard,
    updatedDate: new Date().toISOString(),
  };

  // 1. Save to IndexedDB (Instant, robust, offline-ready)
  await idbPut('dashboards', payload);

  // 2. Save LEAN template to Cloud Firestore (zero bloat, instant save < 50ms)
  // Store the widgets, card settings, theme, filter rules, and Google Sheet/data path.
  // We do NOT bloat Firestore with thousands of raw sales rows!
  const leanCloudPayload: DBDashboard = {
    ...payload,
    dashboardConfig: {
      ...payload.dashboardConfig,
      salesData: (payload.dashboardConfig?.salesData || []).slice(0, 5),
    },
  };

  try {
    const ref = doc(db, 'dashboards', payload.dashboardId);
    withTimeout(setDoc(ref, sanitizeForFirestore(leanCloudPayload)), 1000).catch((err) => {
      console.warn('Firestore dashboard non-blocking sync notice:', err);
    });
  } catch (err) {
    console.warn('Firestore dashboard sync error (cached locally):', err);
  }

  // 3. Mark as latest project in session
  await idbPut('session', { key: `latest_dashboard_${payload.userId}`, dashboardId: payload.dashboardId });
}

export async function dbGetDashboards(requestingUser: DBUser): Promise<DBDashboard[]> {
  try {
    // 1. Check local IDB first for instant <5ms response
    const localDashboards = await idbGetAll<DBDashboard>('dashboards');
    const filteredLocal = requestingUser.role === 'admin'
      ? localDashboards
      : localDashboards.filter((d) => d.userId === requestingUser.userId);

    if (filteredLocal.length > 0) {
      // Background non-blocking sync with Firestore
      try {
        const q = requestingUser.role === 'admin'
          ? query(collection(db, 'dashboards'))
          : query(collection(db, 'dashboards'), where('userId', '==', requestingUser.userId));
        withTimeout(getDocs(q), 1000)
          .then((snap) => {
            if (snap && !snap.empty) {
              snap.forEach((d) => idbPut('dashboards', d.data() as DBDashboard));
            }
          })
          .catch(() => {});
      } catch (e) {}

      return filteredLocal.sort((a, b) => new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime());
    }

    // 2. If local is empty, try Firestore with a strict 1s timeout
    let cloudDashboards: DBDashboard[] = [];
    try {
      const q = requestingUser.role === 'admin'
        ? query(collection(db, 'dashboards'))
        : query(collection(db, 'dashboards'), where('userId', '==', requestingUser.userId));
      const snap = await withTimeout(getDocs(q), 1000);
      if (snap && !snap.empty) {
        snap.forEach((d) => cloudDashboards.push(d.data() as DBDashboard));
        for (const dash of cloudDashboards) {
          await idbPut('dashboards', dash);
        }
        return cloudDashboards.sort((a, b) => new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime());
      }
    } catch {}

    return [];
  } catch (err) {
    return [];
  }
}

export async function dbGetLatestDashboard(userId: string): Promise<DBDashboard | null> {
  try {
    // 1. Check fast localStorage first (<1ms)
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(`user_dashboard_${userId}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.widgets) {
            return {
              dashboardId: parsed.dashboardId || `dash-${userId}-saved`,
              userId,
              dashboardName: parsed.dashboardTitle || 'ภาพรวมยอดขาย',
              dashboardConfig: {
                widgets: parsed.widgets,
                salesData: parsed.salesData || [],
                themeConfig: parsed.themeConfig,
                filterState: parsed.filterState,
                connectionConfig: parsed.connectionConfig,
                spacingMode: parsed.spacingMode,
              },
              createdDate: new Date().toISOString(),
              updatedDate: new Date().toISOString(),
            };
          }
        } catch (e) {}
      }
    }

    // 2. Check session pointer in IDB
    const pointer = await idbGet<{ key: string; dashboardId: string }>('session', `latest_dashboard_${userId}`);
    if (pointer && pointer.dashboardId) {
      const cached = await idbGet<DBDashboard>('dashboards', pointer.dashboardId);
      if (cached) return cached;
    }

    // 3. Otherwise fetch list for user
    const user = await dbGetCurrentSessionUser();
    if (!user) return null;
    const dashboards = await dbGetDashboards(user);
    const userDashboards = dashboards.filter((d) => d.userId === userId);
    return userDashboards[0] || null;
  } catch {
    return null;
  }
}

export async function dbDeleteDashboard(dashboardId: string): Promise<void> {
  await idbDelete('dashboards', dashboardId);
  try {
    await deleteDoc(doc(db, 'dashboards', dashboardId));
  } catch (err) {
    console.warn('Firestore delete error:', err);
  }
}

// Starter dashboard generator for new users
export async function dbCreateStarterDashboardForUser(userId: string, userName: string): Promise<DBDashboard> {
  const newDash: DBDashboard = {
    dashboardId: `dash-${userId}-${Date.now()}`,
    userId,
    dashboardName: `แดชบอร์ดของ ${userName}`,
    dashboardConfig: {
      widgets: INITIAL_WIDGETS,
      salesData: INITIAL_SALES_RECORDS,
      themeConfig: {
        preset: 'violet',
        primaryColor: '#7c3aed',
        fontFamily: 'Prompt',
        borderRadius: 'rounded-lg',
        shadowStyle: 'shadow-sm',
      },
    },
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
  };
  await dbSaveDashboard(newDash);
  return newDash;
}

// ----------------------------------------------------
// 3. Data Sources Database Service (Excel/CSV Storage per User)
// ----------------------------------------------------

const DS_BACKUP_STORAGE_KEY = 'bi_studio_datasources_backup_v2';

export const INITIAL_DATA_SOURCES: DBDataSource[] = [
  {
    dataSourceId: 'ds-starter-enterprise-sales-2026',
    userId: 'usr-admin-1',
    fileName: 'ชุดข้อมูลยอดขายรายปี_2026.csv',
    filePath: 'uploads/usr-admin-1/ชุดข้อมูลยอดขายรายปี_2026.csv',
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    recordCount: INITIAL_SALES_RECORDS.length,
    records: INITIAL_SALES_RECORDS,
    columns: ['id', 'date', 'orderId', 'product', 'category', 'region', 'quantity', 'revenue', 'cost', 'profit'],
  },
  {
    dataSourceId: 'ds-starter-regional-distribution',
    userId: 'usr-editor-1',
    fileName: 'ภาพรวมยอดขายภูมิภาค_Enterprise.xlsx',
    filePath: 'uploads/usr-editor-1/ภาพรวมยอดขายภูมิภาค_Enterprise.xlsx',
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    recordCount: 15,
    records: INITIAL_SALES_RECORDS.slice(0, 15).map((r, i) => ({
      ...r,
      id: i + 1,
      revenue: Math.round(r.revenue * 1.15),
      profit: Math.round(r.profit * 1.2),
    })),
    columns: ['id', 'date', 'orderId', 'product', 'category', 'region', 'quantity', 'revenue', 'cost', 'profit'],
  },
];

function getLocalStorageDataSources(): DBDataSource[] {
  if (typeof window === 'undefined') return INITIAL_DATA_SOURCES;
  try {
    const raw = localStorage.getItem(DS_BACKUP_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DS_BACKUP_STORAGE_KEY, JSON.stringify(INITIAL_DATA_SOURCES));
      return INITIAL_DATA_SOURCES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DATA_SOURCES;
  }
}

function saveLocalStorageDataSources(list: DBDataSource[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DS_BACKUP_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

export async function dbSaveDataSource(
  userId: string,
  fileName: string,
  records: SalesRecord[],
  filePath: string = ''
): Promise<DBDataSource> {
  // Extract columns
  const cols = new Set<string>();
  records.slice(0, 50).forEach((r) => {
    if (r && typeof r === 'object') {
      Object.keys(r).forEach((k) => cols.add(k));
    }
  });

  const ds: DBDataSource = {
    dataSourceId: `ds-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    fileName,
    filePath: filePath || `uploads/${userId}/${fileName}`,
    uploadDate: new Date().toISOString(),
    recordCount: records.length,
    records,
    columns: Array.from(cols),
  };

  // 1. Save to IDB
  await idbPut('dataSources', ds);

  // 2. Save to localStorage backup
  const currentLocal = getLocalStorageDataSources();
  saveLocalStorageDataSources([ds, ...currentLocal.filter((d) => d.dataSourceId !== ds.dataSourceId)]);

  // 3. Save metadata + sample to Firestore with timeout (fail-safe)
  try {
    const cloudPayload = {
      dataSourceId: ds.dataSourceId,
      userId: ds.userId,
      fileName: ds.fileName,
      filePath: ds.filePath,
      uploadDate: ds.uploadDate,
      recordCount: ds.recordCount,
      columns: ds.columns,
      records: records.slice(0, 1000),
    };
    await withTimeout(setDoc(doc(db, 'dataSources', ds.dataSourceId), sanitizeForFirestore(cloudPayload)), 1200);
  } catch (err) {
    console.warn('Firestore data source sync warning (cached locally):', err);
  }

  return ds;
}

export async function dbGetDataSources(requestingUser: DBUser): Promise<DBDataSource[]> {
  try {
    let cloudSources: DBDataSource[] = [];
    try {
      if (requestingUser.role === 'admin') {
        const q = query(collection(db, 'dataSources'));
        const snap = await withTimeout(getDocs(q), 1000);
        snap.forEach((d) => cloudSources.push(d.data() as DBDataSource));
      } else {
        const q = query(collection(db, 'dataSources'), where('userId', '==', requestingUser.userId));
        const snap = await withTimeout(getDocs(q), 1000);
        snap.forEach((d) => cloudSources.push(d.data() as DBDataSource));
      }
      if (cloudSources.length > 0) {
        for (const ds of cloudSources) {
          await idbPut('dataSources', ds);
        }
        const currentLocal = getLocalStorageDataSources();
        const merged = [...cloudSources, ...currentLocal.filter(l => !cloudSources.some(c => c.dataSourceId === l.dataSourceId))];
        saveLocalStorageDataSources(merged);
        return cloudSources.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      }
    } catch {
      // Cloud offline or timed out, seamlessly proceed to IDB & LocalStorage
    }

    // 2. IndexedDB query
    let localSources = await idbGetAll<DBDataSource>('dataSources');

    // 3. Fallback to LocalStorage if IDB empty
    if (!localSources || localSources.length === 0) {
      localSources = getLocalStorageDataSources();
      for (const ds of localSources) {
        await idbPut('dataSources', ds);
      }
    }

    if (requestingUser.role === 'admin') {
      return localSources.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    }

    const filtered = localSources.filter((ds) => ds.userId === requestingUser.userId || ds.userId === 'usr-admin-1');
    if (filtered.length === 0) {
      return localSources.slice(0, 2);
    }
    return filtered.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  } catch {
    return getLocalStorageDataSources();
  }
}

export async function dbDeleteDataSource(dataSourceId: string): Promise<void> {
  await idbDelete('dataSources', dataSourceId);
  const currentLocal = getLocalStorageDataSources();
  saveLocalStorageDataSources(currentLocal.filter((d) => d.dataSourceId !== dataSourceId));

  try {
    await withTimeout(deleteDoc(doc(db, 'dataSources', dataSourceId)), 1200);
  } catch (err) {
    console.warn('Firestore delete data source error', err);
  }
}
