import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';

export function createRelay({ token, fetcher = fetch } = {}) {
  if (!token || token.length < 32) throw new Error('RELAY_TOKEN must contain at least 32 characters');
  const expected = Buffer.from('Bearer ' + token);
  return http.createServer(async (req, res) => {
    const json = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(data));
    };
    const url = new URL(req.url, 'http://relay');
    if (url.pathname === '/health' && req.method === 'GET') return json(200, { ok: true });
    const supplied = Buffer.from(req.headers.authorization || '');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return json(401, { error: 'Unauthorized' });
    const models = url.pathname === '/v1beta/models' && req.method === 'GET';
    const generate = /^\/v1beta\/models\/gemini-[a-zA-Z0-9._-]+:(streamGenerateContent|generateContent)$/.test(url.pathname) && req.method === 'POST';
    if (!models && !generate) return json(404, { error: 'Unsupported route' });
    if (!req.headers['x-goog-api-key']) return json(400, { error: 'Missing Gemini credential' });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 180000);
    res.on('close', () => { if (!res.writableFinished) controller.abort(); });
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 24 * 1024 * 1024) return json(413, { error: 'Request too large' });
        chunks.push(chunk);
      }
      const upstream = new URL(url.pathname, 'https://generativelanguage.googleapis.com');
      // Only the streaming response format is forwarded; no arbitrary target or query credentials.
      if (url.searchParams.get('alt') === 'sse') upstream.searchParams.set('alt', 'sse');
      const response = await fetcher(upstream, {
        method: req.method,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': req.headers['x-goog-api-key'] },
        ...(generate ? { body: Buffer.concat(chunks) } : {}),
        signal: controller.signal,
        redirect: 'error',
      });
      res.writeHead(response.status, {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      if (response.body) await pipeline(Readable.fromWeb(response.body), res);
      else res.end();
    } catch {
      if (!res.headersSent) json(502, { error: 'Gemini upstream unavailable' });
      else res.destroy();
    } finally { clearTimeout(timer); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createRelay({ token: process.env.RELAY_TOKEN });
  server.listen(Number(process.env.PORT || 8080), '0.0.0.0');
}
