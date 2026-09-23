import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

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
    plugins: [react(), tailwindcss(), sheetsApiPlugin()],
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
