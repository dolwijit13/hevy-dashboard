import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { syncHevyWorkouts, getSyncStatus } from './src/server/hevySync.ts';

function setupApiMiddlewares(server: any) {
  server.middlewares.use((req: any, res: any, next: any) => {
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
        const status = getSyncStatus();
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
          const result = await syncHevyWorkouts({
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

  return {
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'import.meta.env.VITE_SUPABASE_PROJECT_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabaseAnonKey),
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
