import type { VercelRequest, VercelResponse } from '@vercel/node';
import { syncHevyWorkouts, getSyncStatus } from '../src/server/hevySync.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
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

      const result = await syncHevyWorkouts({
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
