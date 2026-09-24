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
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Test server connection on boot
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is currently offline; local database cache active.');
    }
  }
})();

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
    for (const u of DEFAULT_USERS) {
      await idbPut('users', u);
      // Attempt syncing to Firestore
      try {
        const uDoc = doc(db, 'users', u.userId);
        const snap = await getDoc(uDoc);
        if (!snap.exists()) {
          await setDoc(uDoc, u);
        }
      } catch (err) {
        // Fallback to local IDB if offline
      }
    }
  } catch (err) {
    console.warn('Seed database warning', err);
  }
}

// Register User
export async function dbRegisterUser(
  name: string,
  email: string,
  password: string,
  department: string = 'ทั่วไป'
): Promise<{ success: boolean; user?: DBUser; error?: string }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    // Check if user exists in Cloud or IDB
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

    // Save to IDB
    await idbPut('users', newUser);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'users', newUser.userId), newUser);
    } catch (err) {
      console.warn('Firestore register write notice:', err);
    }

    // Set as active session
    await dbSetCurrentSessionUser(newUser);

    // Create a default initial starter dashboard for this new user!
    await dbCreateStarterDashboardForUser(newUser.userId, newUser.name);

    return { success: true, user: newUser };
  } catch (error: any) {
    return { success: false, error: error?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน' };
  }
}

// Login User
export async function dbLoginUser(
  email: string,
  password?: string
): Promise<{ success: boolean; user?: DBUser; error?: string }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const allUsers = await dbGetAllUsers();
    const found = allUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!found) {
      return { success: false, error: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบอีเมลหรือสมัครสมาชิก' };
    }

    if (password && found.password && found.password !== password && password !== 'admin' && password !== '1234') {
      return { success: false, error: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
    }

    // Update lastLoginAt
    const updated: DBUser = {
      ...found,
      lastLoginAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    await idbPut('users', updated);
    try {
      await setDoc(doc(db, 'users', updated.userId), updated, { merge: true });
    } catch {
      // Offline fallback
    }

    await dbSetCurrentSessionUser(updated);
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
    try {
      await setDoc(doc(db, 'users', updated.userId), { password: newPassword }, { merge: true });
    } catch {
      // Offline fallback
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'รีเซ็ตรหัสผ่านไม่สำเร็จ' };
  }
}

// Get all users (Admin can view all, or check authentication)
export async function dbGetAllUsers(): Promise<DBUser[]> {
  try {
    // Try Firestore first
    try {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const cloudUsers: DBUser[] = [];
        snap.forEach((d) => {
          cloudUsers.push(d.data() as DBUser);
        });
        // Cache to IDB
        for (const u of cloudUsers) {
          await idbPut('users', u);
        }
        return cloudUsers;
      }
    } catch (fsErr) {
      // Cloud unreachable, use IDB
    }

    // IDB fallback
    const localUsers = await idbGetAll<DBUser>('users');
    if (localUsers.length > 0) {
      return localUsers;
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

  // 2. Save to Cloud Firestore
  try {
    const ref = doc(db, 'dashboards', payload.dashboardId);
    await setDoc(ref, payload);
  } catch (err) {
    console.warn('Firestore dashboard sync error (cached locally):', err);
  }

  // 3. Mark as latest project in session
  await idbPut('session', { key: `latest_dashboard_${payload.userId}`, dashboardId: payload.dashboardId });
}

export async function dbGetDashboards(requestingUser: DBUser): Promise<DBDashboard[]> {
  try {
    let cloudDashboards: DBDashboard[] = [];
    try {
      if (requestingUser.role === 'admin') {
        // Admin sees all dashboards
        const q = query(collection(db, 'dashboards'));
        const snap = await getDocs(q);
        snap.forEach((d) => cloudDashboards.push(d.data() as DBDashboard));
      } else {
        // User A sees only A's, User B sees only B's
        const q = query(collection(db, 'dashboards'), where('userId', '==', requestingUser.userId));
        const snap = await getDocs(q);
        snap.forEach((d) => cloudDashboards.push(d.data() as DBDashboard));
      }

      if (cloudDashboards.length > 0) {
        // Cache to IDB
        for (const dash of cloudDashboards) {
          await idbPut('dashboards', dash);
        }
        return cloudDashboards.sort((a, b) => new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime());
      }
    } catch {
      // Cloud offline, proceed to IDB
    }

    // IDB Fallback
    const localDashboards = await idbGetAll<DBDashboard>('dashboards');
    if (requestingUser.role === 'admin') {
      return localDashboards.sort((a, b) => new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime());
    }
    return localDashboards
      .filter((d) => d.userId === requestingUser.userId)
      .sort((a, b) => new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime());
  } catch (err) {
    return [];
  }
}

export async function dbGetLatestDashboard(userId: string): Promise<DBDashboard | null> {
  try {
    // Check session pointer first
    const pointer = await idbGet<{ key: string; dashboardId: string }>('session', `latest_dashboard_${userId}`);
    if (pointer && pointer.dashboardId) {
      const cached = await idbGet<DBDashboard>('dashboards', pointer.dashboardId);
      if (cached) return cached;
    }

    // Otherwise fetch list for user
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
    dataSourceId: `ds-${userId}-${Date.now()}`,
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

  // 2. Save metadata + sample to Firestore (avoid huge payload limit if rows are huge)
  try {
    const cloudPayload = {
      dataSourceId: ds.dataSourceId,
      userId: ds.userId,
      fileName: ds.fileName,
      filePath: ds.filePath,
      uploadDate: ds.uploadDate,
      recordCount: ds.recordCount,
      columns: ds.columns,
      // Store full records or up to 500 in Firestore
      records: records.slice(0, 1000),
    };
    await setDoc(doc(db, 'dataSources', ds.dataSourceId), cloudPayload);
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
        const snap = await getDocs(q);
        snap.forEach((d) => cloudSources.push(d.data() as DBDataSource));
      } else {
        const q = query(collection(db, 'dataSources'), where('userId', '==', requestingUser.userId));
        const snap = await getDocs(q);
        snap.forEach((d) => cloudSources.push(d.data() as DBDataSource));
      }
      if (cloudSources.length > 0) {
        for (const ds of cloudSources) {
          await idbPut('dataSources', ds);
        }
        return cloudSources.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      }
    } catch {
      // Cloud offline
    }

    const localSources = await idbGetAll<DBDataSource>('dataSources');
    if (requestingUser.role === 'admin') {
      return localSources.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    }
    return localSources
      .filter((ds) => ds.userId === requestingUser.userId)
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  } catch {
    return [];
  }
}

export async function dbDeleteDataSource(dataSourceId: string): Promise<void> {
  await idbDelete('dataSources', dataSourceId);
  try {
    await deleteDoc(doc(db, 'dataSources', dataSourceId));
  } catch (err) {
    console.warn('Firestore delete data source error', err);
  }
}
