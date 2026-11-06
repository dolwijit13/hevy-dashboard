import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { syncHevyAll, getSyncStatus } from './src/server/hevySync.ts';
import { getWidgetData, renderHeatmapSvg } from './src/server/widgetRenderer.ts';

function setupApiMiddlewares(server: any) {
  server.middlewares.use(async (req: any, res: any, next: any) => {
    // 1. Raw CSV serving with no-cache headers
    if (req.url && req.url.startsWith('/raw/')) {
      const relativePath = req.url.replace('/raw/', '').split('?')[0];
      const filePath = path.resolve(import.meta.dirname, 'raw', relativePath);
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    }

    // 2. Hevy Sync status endpoint
    if (req.url && req.url.startsWith('/api/sync-hevy/status') && req.method === 'GET') {
      try {
        const status = await getSyncStatus();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(status));
        return;
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
    }

    // 3. Hevy Sync execution endpoint
    if (req.url && req.url.startsWith('/api/sync-hevy') && req.method === 'POST') {
      let bodyStr = '';
      req.on('data', (chunk: any) => {
        bodyStr += chunk;
      });
      req.on('end', async () => {
        try {
          let body: any = {};
          if (bodyStr) {
            try {
              body = JSON.parse(bodyStr);
            } catch {
              // ignore invalid json body
            }
          }
          const result = await syncHevyAll({
            overrideApiKey: body.apiKey,
          });
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = result.success ? 200 : 400;
          res.end(JSON.stringify(result));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, message: err.message, error: 'SERVER_ERROR' }));
        }
      });
      return;
    }

    // 4. Heatmap Widget endpoint for local dev
    if (req.url && req.url.startsWith('/api/widget/heatmap') && req.method === 'GET') {
      try {
        const urlObj = new URL(req.url, 'http://localhost:5173');
        const weeksParam = urlObj.searchParams.get('weeks');
        const weeks = weeksParam ? parseInt(weeksParam, 10) || 18 : 18;
        const mode = urlObj.searchParams.get('mode') === 'routine' ? 'routine' : 'volume';
        const theme = urlObj.searchParams.get('theme') === 'amoled' ? 'amoled' : 'dark';
        const transparent = urlObj.searchParams.get('transparent') === 'true';
        const format = urlObj.searchParams.get('format') === 'json' ? 'json' : 'svg';

        const data = await getWidgetData(weeks);

        if (format === 'json') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return;
        }

        if (format === 'png') {
          const directSvgUrl = `http://localhost:5173/api/widget/heatmap?weeks=${weeks}&mode=${mode}&theme=${theme}&transparent=${transparent}`;
          const pngProxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(directSvgUrl)}&output=png`;
          res.statusCode = 307;
          res.setHeader('Location', pngProxyUrl);
          res.end();
          return;
        }

        const svg = renderHeatmapSvg(data, { weeks, mode, theme, transparent });
        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
        res.end(svg);
        return;
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
    }

    next();
  });
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const supabaseUrl =
    env.VITE_SUPABASE_URL ||
    env.VITE_SUPABASE_PROJECT_URL ||
    env.SUPABASE_PROJECT_URL ||
    '';

  const supabaseAnonKey =
    env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    '';

  const allowedEmails =
    env.VITE_ALLOWED_EMAILS ||
    env.ALLOWED_EMAILS ||
    '';

  return {
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'import.meta.env.VITE_SUPABASE_PROJECT_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabaseAnonKey),
      'import.meta.env.VITE_ALLOWED_EMAILS': JSON.stringify(allowedEmails),
    },
    plugins: [
      tailwindcss(),
      react(),
      {
        name: 'hevy-sync-and-raw-csv',
        configureServer(server) {
          setupApiMiddlewares(server);
        },
        configurePreviewServer(server) {
          setupApiMiddlewares(server);
        },
        closeBundle() {
          // Copy raw directory to dist/raw for production preview/serving if exists
          const srcDir = path.resolve(import.meta.dirname, 'raw');
          const destDir = path.resolve(import.meta.dirname, 'dist', 'raw');
          if (fs.existsSync(srcDir)) {
            fs.mkdirSync(destDir, { recursive: true });
            fs.readdirSync(srcDir).forEach((file) => {
              fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
            });
          }
        },
      },
    ],
    server: {
      port: 5173,
      open: false,
    },
  };
});
