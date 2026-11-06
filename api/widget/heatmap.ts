import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getWidgetData, renderHeatmapSvg } from '../../src/server/widgetRenderer.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, x-widget-token');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Optional Token Verification if WIDGET_SECRET_TOKEN or SYNC_SECRET_TOKEN is set
    const expectedToken = process.env.WIDGET_SECRET_TOKEN || process.env.SYNC_SECRET_TOKEN;
    if (expectedToken) {
      const providedToken = req.query?.token || req.headers['x-widget-token'];
      if (providedToken !== expectedToken) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Invalid or missing widget token',
        });
      }
    }

    // Parse options from query
    const weeksParam = req.query?.weeks;
    const weeks = weeksParam ? parseInt(String(weeksParam), 10) || 18 : 18;
    const mode = req.query?.mode === 'routine' ? 'routine' : 'volume';
    const theme = req.query?.theme === 'amoled' ? 'amoled' : 'dark';
    const transparent = req.query?.transparent === 'true' || req.query?.transparent === '1';
    const format = req.query?.format === 'json' ? 'json' : req.query?.format === 'png' ? 'png' : 'svg';

    if (format === 'png') {
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
      const proto = req.headers['x-forwarded-proto'] || 'https';
      const currentUrl = req.url || '/api/widget/heatmap';
      const base = `${proto}://${host}`;
      const urlObj = new URL(currentUrl, base);
      urlObj.searchParams.delete('format');
      const directSvgUrl = urlObj.toString();
      const pngProxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(directSvgUrl)}&output=png`;
      return res.redirect(307, pngProxyUrl);
    }

    const widgetData = await getWidgetData(weeks);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json(widgetData);
    }

    const svg = renderHeatmapSvg(widgetData, {
      weeks,
      mode,
      theme,
      transparent,
    });

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(svg);
  } catch (err: any) {
    console.error('Error generating widget in /api/widget/heatmap:', err);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: err.message || 'Failed to render heatmap widget',
    });
  }
}
