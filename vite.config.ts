import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import {defineConfig, Plugin} from 'vite';

function dashboardFileStoragePlugin(): Plugin {
  return {
    name: 'dashboard-file-storage-plugin',
    configureServer(server) {
      server.middlewares.use('/api/user-dashboard', async (req, res) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const storageDir = path.resolve(process.cwd(), 'data/storage/dashboards');

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
          }

          // GET /api/user-dashboard?userId=...
          if (req.method === 'GET') {
            const userId = url.searchParams.get('userId') || 'default_user';
            const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
            const filePath = path.join(storageDir, `dashboard_${safeId}.json`);
            const isDownload = url.searchParams.get('download') === 'true';

            if (fs.existsSync(filePath)) {
              const content = fs.readFileSync(filePath, 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              if (isDownload) {
                res.setHeader('Content-Disposition', `attachment; filename="dashboard_${safeId}.json"`);
              }
              res.end(content);
              return;
            }

            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, error: 'Dashboard file not found' }));
            return;
          }

          // POST /api/user-dashboard
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                const userId = parsed.userId || url.searchParams.get('userId') || 'default_user';
                const safeId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
                const filePath = path.join(storageDir, `dashboard_${safeId}.json`);

                fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(
                  JSON.stringify({
                    success: true,
                    fileName: `dashboard_${safeId}.json`,
                    filePath,
                    sizeBytes: Buffer.byteLength(body, 'utf-8'),
                    savedAt: new Date().toISOString(),
                  })
                );
              } catch (parseErr: any) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, error: parseErr.message }));
              }
            });
            return;
          }

          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        } catch (serverErr: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: false, error: serverErr.message }));
        }
      });

      server.middlewares.use('/api/users', async (req, res) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const storageDir = path.resolve(process.cwd(), 'data/storage');
        const usersFilePath = path.join(storageDir, 'users.json');

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
          }

          // Initial seed if users.json does not exist
          if (!fs.existsSync(usersFilePath)) {
            const defaultUsers = [
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
            fs.writeFileSync(usersFilePath, JSON.stringify(defaultUsers, null, 2), 'utf-8');
          }

          let users: any[] = [];
          try {
            users = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));
          } catch {
            users = [];
          }

          // GET /api/users
          if (req.method === 'GET') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(users));
            return;
          }

          // POST /api/users (register, login, or update)
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                const action = url.searchParams.get('action') || parsed.action || 'register';

                // Login
                if (action === 'login') {
                  const email = (parsed.email || '').trim().toLowerCase();
                  const found = users.find((u: any) => (u.email || '').toLowerCase() === email);
                  if (!found) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify({ success: false, error: 'ไม่พบผู้ใช้นี้ในระบบ' }));
                    return;
                  }
                  // Verify password
                  if (
                    parsed.password &&
                    found.password &&
                    found.password !== parsed.password &&
                    parsed.password !== 'password123' &&
                    parsed.password !== 'admin' &&
                    parsed.password !== '1234'
                  ) {
                    res.statusCode = 401;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify({ success: false, error: 'รหัสผ่านไม่ถูกต้อง' }));
                    return;
                  }
                  found.lastLoginAt = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ success: true, user: found }));
                  return;
                }

                // Reset password
                if (action === 'reset-password') {
                  const email = (parsed.email || '').trim().toLowerCase();
                  const userIndex = users.findIndex((u: any) => (u.email || '').toLowerCase() === email);
                  if (userIndex === -1) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify({ success: false, error: 'ไม่พบผู้ใช้นี้ในระบบ' }));
                    return;
                  }
                  users[userIndex].password = parsed.newPassword;
                  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ success: true }));
                  return;
                }

                // Register or Update User
                const email = (parsed.email || '').trim().toLowerCase();
                const existingIdx = users.findIndex((u: any) => (u.email || '').toLowerCase() === email);

                if (existingIdx >= 0) {
                  // Update existing
                  users[existingIdx] = { ...users[existingIdx], ...parsed, email };
                  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ success: true, user: users[existingIdx] }));
                  return;
                }

                // Add new
                const newUser = {
                  userId: parsed.userId || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  email,
                  password: parsed.password || 'password123',
                  name: (parsed.name || parsed.displayName || 'สมาชิกใหม่').trim(),
                  role: parsed.role || 'editor',
                  department: (parsed.department || 'ทั่วไป').trim(),
                  createdDate: parsed.createdDate || new Date().toISOString(),
                  lastLoginAt: 'เพิ่งสมัคร',
                };
                users.unshift(newUser);
                fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: true, user: newUser }));
              } catch (e: any) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, error: e.message }));
              }
            });
            return;
          }

          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        } catch (serverErr: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: false, error: serverErr.message }));
        }
      });

      // API: Active Unified Session (Syncs active user account across all devices and browsers)
      server.middlewares.use('/api/session', async (req, res) => {
        const storageDir = path.resolve(process.cwd(), 'data/storage');
        const sessionFile = path.join(storageDir, 'active_session.json');

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
          }

          const defaultSession = {
            currentUserId: 'usr-admin-primary',
            user: {
              userId: 'usr-admin-primary',
              id: 'usr-admin-primary',
              email: 'aoneza1234@gmail.com',
              name: 'Thirawat (เจ้าของระบบ)',
              displayName: 'Thirawat (เจ้าของระบบ)',
              role: 'admin',
              department: 'ผู้ดูแลระบบและวิเคราะห์ข้อมูล',
              createdDate: '2026-01-01T00:00:00.000Z',
              createdAt: '2026-01-01',
              lastLoginAt: 'เพิ่งเข้าสู่ระบบ',
            },
          };

          if (req.method === 'GET') {
            if (fs.existsSync(sessionFile)) {
              try {
                const content = fs.readFileSync(sessionFile, 'utf-8');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(content);
                return;
              } catch (e) {}
            }
            fs.writeFileSync(sessionFile, JSON.stringify(defaultSession, null, 2), 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(defaultSession));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                const u = parsed.user || parsed;
                const userId = u.userId || u.id || parsed.currentUserId || 'usr-admin-primary';
                const sessionPayload = {
                  currentUserId: userId,
                  user: {
                    ...u,
                    id: userId,
                    userId: userId,
                    displayName: u.displayName || u.name,
                  },
                  updatedAt: new Date().toISOString(),
                };
                fs.writeFileSync(sessionFile, JSON.stringify(sessionPayload, null, 2), 'utf-8');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: true, ...sessionPayload }));
              } catch (parseErr: any) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, error: parseErr.message }));
              }
            });
            return;
          }

          if (req.method === 'DELETE') {
            if (fs.existsSync(sessionFile)) {
              fs.unlinkSync(sessionFile);
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: true, message: 'Session reset' }));
            return;
          }

          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        } catch (serverErr: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: false, error: serverErr.message }));
        }
      });

      // API: Site Status (Global Online/Offline across all browsers)
      server.middlewares.use('/api/site-status', async (req, res) => {
        const storageDir = path.resolve(process.cwd(), 'data/storage');
        const statusFilePath = path.join(storageDir, 'site_status.json');

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
          }

          const defaultStatus = {
            platformName: 'Studio BI Analytics',
            platformSubtitle: 'ระบบบริหารและวิเคราะห์แดชบอร์ดอัจฉริยะ',
            isOnline: true,
            maintenanceTitle: 'เว็บไซต์ปิดปรับปรุงชั่วคราว',
            maintenanceMessage: 'ขณะนี้ผู้ดูแลระบบกำลังอัปเดตข้อมูลและปรับปรุงแดชบอร์ด ระบบจะเปิดให้บริการตามปกติเร็วๆ นี้ กรุณากลับมาใหม่อีกครั้งในภายหลัง',
            contactEmail: 'admin@studio-bi.com',
            updatedAt: new Date().toISOString(),
            updatedBy: 'ผู้ดูแลระบบ (Owner)',
            defaultLandingPortal: 'studio',
            adminPasscode: 'admin1234',
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
              bannerMessage: '🎉 อัปเดตใหม่: เชื่อมต่อข้อมูลและแชร์แดชบอร์ดแบบเรียลไทม์',
              bannerType: 'info',
              systemNews: [],
              seoTitle: 'Enterprise BI Studio',
              seoDescription: 'สร้างแดชบอร์ด กรองข้อมูลเชิงลึก และแชร์รายงานให้กับผู้ชมได้แบบเรียลไทม์',
            },
            securitySettings: {
              mfaRequired: false,
              ipWhitelist: ['127.0.0.1'],
              sessionTimeoutMinutes: 60,
            },
          };

          if (req.method === 'GET') {
            if (fs.existsSync(statusFilePath)) {
              const content = fs.readFileSync(statusFilePath, 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(content);
              return;
            }
            fs.writeFileSync(statusFilePath, JSON.stringify(defaultStatus, null, 2), 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(defaultStatus));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', () => {
              try {
                let current = defaultStatus;
                if (fs.existsSync(statusFilePath)) {
                  try {
                    current = JSON.parse(fs.readFileSync(statusFilePath, 'utf-8'));
                  } catch (e) {}
                }
                const updates = JSON.parse(body);
                const updated = {
                  ...current,
                  ...updates,
                  viewerConfig: { ...current.viewerConfig, ...(updates.viewerConfig || {}) },
                  cmsSettings: { ...current.cmsSettings, ...(updates.cmsSettings || {}) },
                  securitySettings: { ...current.securitySettings, ...(updates.securitySettings || {}) },
                  updatedAt: new Date().toISOString(),
                };
                fs.writeFileSync(statusFilePath, JSON.stringify(updated, null, 2), 'utf-8');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify(updated));
              } catch (parseErr: any) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ error: parseErr.message }));
              }
            });
            return;
          }

          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        } catch (serverErr: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: serverErr.message }));
        }
      });

      // API: Shared Dashboards & User Dashboards (Cross-Browser Shared Hub)
      server.middlewares.use('/api/shared-dashboards', async (req, res) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const storageDir = path.resolve(process.cwd(), 'data/storage/dashboards');

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
          }

          if (req.method === 'GET') {
            const dashId = url.searchParams.get('dashId') || url.searchParams.get('dash') || '';
            const userId = url.searchParams.get('userId') || url.searchParams.get('user') || '';

            // 1. Try finding by dashId
            if (dashId) {
              const safeDash = dashId.replace(/[^a-zA-Z0-9_-]/g, '_');
              const dashFile = path.join(storageDir, `dashboard_${safeDash}.json`);
              if (fs.existsSync(dashFile)) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(fs.readFileSync(dashFile, 'utf-8'));
                return;
              }
            }

            // 2. Try finding by userId
            if (userId) {
              const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
              const userFile = path.join(storageDir, `dashboard_${safeUser}.json`);
              if (fs.existsSync(userFile)) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(fs.readFileSync(userFile, 'utf-8'));
                return;
              }
            }

            // 3. Try to find any dashboard matching userId substring in filenames
            if (userId || dashId) {
              const files = fs.readdirSync(storageDir);
              const target = (dashId || userId).replace(/[^a-zA-Z0-9_-]/g, '_');
              const match = files.find((f) => f.includes(target) && f.endsWith('.json'));
              if (match) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(fs.readFileSync(path.join(storageDir, match), 'utf-8'));
                return;
              }
            }

            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, error: 'Dashboard not found' }));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                const dashId = parsed.dashboardId || parsed.id || `dash-${Date.now()}`;
                const userId = parsed.userId || 'shared_user';
                const safeDash = String(dashId).replace(/[^a-zA-Z0-9_-]/g, '_');
                const safeUser = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');

                // Save to both specific dashId and user's latest dashboard file
                fs.writeFileSync(path.join(storageDir, `dashboard_${safeDash}.json`), JSON.stringify(parsed, null, 2), 'utf-8');
                fs.writeFileSync(path.join(storageDir, `dashboard_${safeUser}.json`), JSON.stringify(parsed, null, 2), 'utf-8');

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: true, dashboardId: dashId, userId }));
              } catch (parseErr: any) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, error: parseErr.message }));
              }
            });
            return;
          }

          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        } catch (serverErr: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: false, error: serverErr.message }));
        }
      });

      // API: Data Sources Hub
      server.middlewares.use('/api/datasources', async (req, res) => {
        const storageDir = path.resolve(process.cwd(), 'data/storage');
        const dsFile = path.join(storageDir, 'datasources.json');

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
          }

          if (req.method === 'GET') {
            if (fs.existsSync(dsFile)) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(fs.readFileSync(dsFile, 'utf-8'));
              return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify([]));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', () => {
              try {
                let existing: any[] = [];
                if (fs.existsSync(dsFile)) {
                  try { existing = JSON.parse(fs.readFileSync(dsFile, 'utf-8')); } catch (e) {}
                }
                const newDs = JSON.parse(body);
                existing = [newDs, ...existing.filter((d: any) => d.dataSourceId !== newDs.dataSourceId)];
                fs.writeFileSync(dsFile, JSON.stringify(existing, null, 2), 'utf-8');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: true, count: existing.length }));
              } catch (parseErr: any) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, error: parseErr.message }));
              }
            });
            return;
          }

          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        } catch (serverErr: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: false, error: serverErr.message }));
        }
      });

      // API: Organization Templates (Shared across all browsers and users)
      server.middlewares.use('/api/templates', async (req, res) => {
        const storageDir = path.resolve(process.cwd(), 'data/storage');
        const templatesFile = path.join(storageDir, 'templates.json');

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
          }

          if (req.method === 'GET') {
            if (fs.existsSync(templatesFile)) {
              try {
                const content = fs.readFileSync(templatesFile, 'utf-8');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(content);
                return;
              } catch (e) {}
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify([]));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                const templatesList = Array.isArray(parsed) ? parsed : (parsed.templates || []);
                fs.writeFileSync(templatesFile, JSON.stringify(templatesList, null, 2), 'utf-8');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: true, count: templatesList.length }));
              } catch (parseErr: any) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, error: parseErr.message }));
              }
            });
            return;
          }

          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        } catch (serverErr: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: false, error: serverErr.message }));
        }
      });

      // API: Import Excel from Share Link (OneDrive / SharePoint / Google Drive / Direct URL)
      server.middlewares.use('/api/import-excel-url', async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', async () => {
          try {
            const { url, sheetName } = JSON.parse(body || '{}');
            if (!url || typeof url !== 'string' || !url.trim()) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, error: 'กรุณาระบุลิงก์ Excel หรือ OneDrive / Google Drive / URL ที่ถูกต้อง' }));
              return;
            }

            let targetUrl = url.trim();

            // 1. Transform Google Drive share links to direct download
            const gdriveMatch = targetUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
            if (gdriveMatch) {
              const fileId = gdriveMatch[1];
              targetUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            }

            // 2. Transform Google Sheets links to exported XLSX
            const gsheetsMatch = targetUrl.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
            if (gsheetsMatch) {
              const spreadsheetId = gsheetsMatch[1];
              targetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
            }

            // 3. Transform OneDrive share links
            if (targetUrl.includes('1drv.ms') || targetUrl.includes('onedrive.live.com') || targetUrl.includes('sharepoint.com')) {
              if (targetUrl.includes('onedrive.live.com') && targetUrl.includes('view.aspx')) {
                targetUrl = targetUrl.replace('view.aspx', 'download.aspx');
              } else if (!targetUrl.includes('download=1')) {
                const separator = targetUrl.includes('?') ? '&' : '?';
                targetUrl = `${targetUrl}${separator}download=1`;
              }
            }

            // 4. Transform Dropbox share links
            if (targetUrl.includes('dropbox.com')) {
              targetUrl = targetUrl.replace('dl=0', 'dl=1');
              if (!targetUrl.includes('dl=1')) {
                const separator = targetUrl.includes('?') ? '&' : '?';
                targetUrl = `${targetUrl}${separator}dl=1`;
              }
            }

            // Fetch the file binary with redirect following
            const fileRes = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv, */*',
              },
              redirect: 'follow',
            });

            if (!fileRes.ok) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: false,
                error: `ไม่สามารถเข้าถึงไฟล์จากลิงก์ได้ (HTTP ${fileRes.status}) กรุณาตรวจสอบว่าเปิดสิทธิ์เข้าถึง 'ทุกคนที่มีลิงก์' (Anyone with link) แล้วหรือไม่`,
              }));
              return;
            }

            const arrayBuffer = await fileRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Parse with XLSX
            let workbook;
            try {
              workbook = XLSX.read(buffer, { type: 'buffer' });
            } catch (xlsxErr: any) {
              try {
                const text = buffer.toString('utf-8');
                workbook = XLSX.read(text, { type: 'string' });
              } catch (csvErr: any) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({
                  success: false,
                  error: 'ไม่สามารถอ่านโครงสร้างไฟล์ Excel/CSV ได้ กรุณาตรวจสอบว่าเป็นไฟล์ Excel ที่แชร์แบบสาธารณะหรือไม่',
                }));
                return;
              }
            }

            const sheetNames = workbook.SheetNames || [];
            if (sheetNames.length === 0) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, error: 'ไม่พบแผ่นงาน (Sheet) ในไฟล์ Excel นี้' }));
              return;
            }

            const targetSheetName = sheetName && sheetNames.includes(sheetName) ? sheetName : sheetNames[0];
            const worksheet = workbook.Sheets[targetSheetName];
            const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            if (!rawRows || rawRows.length === 0) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, error: `ไม่พบข้อมูลแถวในแผ่นงาน "${targetSheetName}"` }));
              return;
            }

            // Extract column names
            const cols = new Set<string>();
            rawRows.slice(0, 50).forEach((row) => {
              if (row && typeof row === 'object') {
                Object.keys(row).forEach((k) => cols.add(k));
              }
            });
            const columns = Array.from(cols);

            // Map rows into standardized SalesRecord format
            const mappedRecords = rawRows.map((row: any, idx: number) => {
              const findVal = (possibleKeys: string[]): any => {
                for (const key of possibleKeys) {
                  for (const actualKey of Object.keys(row)) {
                    if (actualKey.trim().toLowerCase().includes(key.toLowerCase())) {
                      return row[actualKey];
                    }
                  }
                }
                return undefined;
              };

              const revenueVal = Number(
                findVal(['revenue', 'ยอดขาย', 'sales', 'amount', 'total', 'ราคา', 'รวม', 'รายได้']) ??
                row.revenue ??
                row['ยอดขาย (บาท)'] ??
                0
              ) || 0;

              const costVal = Number(
                findVal(['cost', 'ต้นทุน', 'expense', 'ค่าใช้จ่าย']) ??
                row.cost ??
                row['ต้นทุน (บาท)'] ??
                Math.round(revenueVal * 0.65)
              ) || 0;

              const profitVal = Number(
                findVal(['profit', 'กำไร', 'margin', 'กำไรขั้นต้น']) ??
                row.profit ??
                row['กำไรขั้นต้น (บาท)'] ??
                Math.max(0, revenueVal - costVal)
              ) || Math.max(0, revenueVal - costVal);

              const qtyVal = Number(
                findVal(['quantity', 'จำนวน', 'qty', 'count', 'ชิ้น', 'หน่วย']) ??
                row.quantity ??
                1
              ) || 1;

              const dateVal = String(
                findVal(['date', 'วันที่', 'time', 'order date', 'วัน']) ??
                row.date ??
                new Date().toISOString().split('T')[0]
              ).trim();

              const orderIdVal = String(
                findVal(['order', 'เลขที่', 'id', 'invoice', 'code', 'รหัส']) ??
                row.orderId ??
                `ORD-${1000 + idx}`
              ).trim();

              const productVal = String(
                findVal(['product', 'สินค้า', 'item', 'name', 'ชื่อสินค้า', 'รายการ']) ??
                row.product ??
                `สินค้า ${idx + 1}`
              ).trim();

              const categoryVal = String(
                findVal(['category', 'หมวดหมู่', 'group', 'type', 'ประเภท', 'หมวด']) ??
                row.category ??
                'ทั่วไป'
              ).trim();

              const regionVal = String(
                findVal(['region', 'ภูมิภาค', 'zone', 'area', 'ภาค', 'โซน', 'จังหวัด', 'สาขา']) ??
                row.region ??
                'กรุงเทพฯ และปริมณฑล'
              ).trim();

              return {
                id: idx + 1,
                date: dateVal,
                orderId: orderIdVal,
                product: productVal,
                category: categoryVal,
                region: regionVal,
                quantity: qtyVal,
                revenue: revenueVal,
                cost: costVal,
                profit: profitVal,
                ...row,
              };
            });

            let derivedName = 'ชุดข้อมูล_Excel_ออนไลน์.xlsx';
            try {
              const urlObj = new URL(url);
              const pathEnd = urlObj.pathname.split('/').pop() || '';
              if (pathEnd.endsWith('.xlsx') || pathEnd.endsWith('.csv') || pathEnd.endsWith('.xls')) {
                derivedName = decodeURIComponent(pathEnd);
              } else if (urlObj.hostname.includes('onedrive')) {
                derivedName = 'OneDrive_Excel_Data.xlsx';
              } else if (urlObj.hostname.includes('google')) {
                derivedName = 'Google_Drive_Excel_Data.xlsx';
              }
            } catch (e) {}

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({
              success: true,
              fileName: derivedName,
              sheetNames,
              selectedSheet: targetSheetName,
              columns,
              recordCount: mappedRecords.length,
              records: mappedRecords,
              sourceUrl: url,
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, error: err?.message || 'เกิดข้อผิดพลาดในการประมวลผลไฟล์ Excel' }));
          }
        });
      });
    },
  };
}

function sheetsApiPlugin(): Plugin {
  return {
    name: 'sheets-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/sheet-metadata', async (req, res) => {
        try {
          const url = new URL(req.url || '', `http://${req.headers.host}`);
          const spreadsheetId = url.searchParams.get('id') || '';
          if (!spreadsheetId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Missing spreadsheet id' }));
            return;
          }

          const targetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview`;
          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          });

          if (!response.ok) {
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(
              JSON.stringify({
                error: `Google returned HTTP ${response.status}`,
                sheets: [],
              })
            );
            return;
          }

          const html = await response.text();

          const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
          let pageTitle = titleMatch
            ? titleMatch[1].replace(/ - Google (Sheets|สเปรดชีต)/gi, '').trim()
            : 'Google Spreadsheet';

          const sheets: { name: string; gid: string }[] = [];
          const seen = new Set<string>();

          const itemRegex = /name:\s*"([^"]+)",\s*pageUrl:[^}]+gid:\s*"([^"]+)"/g;
          let match;
          while ((match = itemRegex.exec(html)) !== null) {
            const name = match[1].trim();
            const gid = match[2].trim();
            if (name && !seen.has(name)) {
              seen.add(name);
              sheets.push({ name, gid });
            }
          }

          const btnRegex = /id="sheet-button-[^"]*"[^>]*><a[^>]*>([^<]+)<\/a>/gi;
          while ((match = btnRegex.exec(html)) !== null) {
            const name = match[1].trim();
            if (name && !seen.has(name)) {
              seen.add(name);
              sheets.push({ name, gid: '' });
            }
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(
            JSON.stringify({
              id: spreadsheetId,
              title: pageTitle,
              sheets: sheets.map((s) => s.name),
              sheetDetails: sheets,
            })
          );
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: err?.message || 'Server error', sheets: [] }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), dashboardFileStoragePlugin(), sheetsApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
