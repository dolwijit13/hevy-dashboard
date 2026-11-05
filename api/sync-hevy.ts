import type { VercelRequest, VercelResponse } from '@vercel/node';
import { syncHevyWorkouts, getSyncStatus } from '../src/server/hevySync';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS if needed
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
    try {
      const status = getSyncStatus();
      return res.status(200).json(status);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const result = await syncHevyWorkouts({
        overrideApiKey: body.apiKey,
      });
      return res.status(result.success ? 200 : 400).json(result);
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message,
        error: 'SERVER_ERROR',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

