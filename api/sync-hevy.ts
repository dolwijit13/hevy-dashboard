import type { VercelRequest, VercelResponse } from '@vercel/node';
import { syncHevyAll, getSyncStatus, getSupabaseServerClient } from '../src/server/hevySync.ts';

async function verifyAuth(req: VercelRequest): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  // If Supabase is not configured yet, allow execution (fallback mode)
  if (!supabase) return true;

  // 1. Check custom secret token (e.g. for Cron jobs)
  const syncSecret = req.headers['x-sync-secret'] || req.query?.secret;
  const expectedSecret = process.env.SYNC_SECRET_TOKEN;
  if (expectedSecret && syncSecret === expectedSecret) {
    return true;
  }

  // 2. Check Supabase User Auth Bearer Token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return false;

    // Check against allowed emails whitelist if configured
    const allowedRaw = process.env.ALLOWED_EMAILS || process.env.VITE_ALLOWED_EMAILS || '';
    const allowedList = allowedRaw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (allowedList.length > 0) {
      return Boolean(user.email && allowedList.includes(user.email.toLowerCase()));
    }

    return true;
  } catch (err) {
    console.error('Error verifying auth token in sync-hevy:', err);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-sync-secret'
    );

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Authenticate request
    const isAuthed = await verifyAuth(req);
    if (!isAuthed) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Unauthorized: Valid Supabase session or sync secret required.',
      });
    }

    if (req.method === 'GET') {
      const status = await getSyncStatus();
      return res.status(200).json(status);
    }

    if (req.method === 'POST') {
      let body: any = {};
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      } catch {
        body = {};
      }

      const result = await syncHevyAll({
        overrideApiKey: body.apiKey,
      });
      return res.status(result.success ? 200 : 400).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('API Error in /api/sync-hevy:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error occurred during sync',
      error: 'SERVER_ERROR',
      stack: err.stack,
    });
  }
}
