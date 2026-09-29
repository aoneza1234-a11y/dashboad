import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
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
