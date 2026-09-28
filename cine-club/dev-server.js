// Local preview: `npm run dev` → http://localhost:3000
// Mimics Vercel's static + /api routing. Without Redis env vars it uses memory.
import http from 'node:http';
import { readFile } from 'node:fs/promises';

const routes = {
  '/api/spin': (await import('./api/spin.js')).default,
  '/api/state': (await import('./api/state.js')).default,
  '/api/reset': (await import('./api/reset.js')).default,
};

http
  .createServer(async (req, res) => {
    const path = new URL(req.url, 'http://x').pathname;
    const handler = routes[path];
    if (!handler) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.end(await readFile(new URL('./index.html', import.meta.url)));
    }
    let raw = '';
    for await (const chunk of req) raw += chunk;
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (obj) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
    await handler(req, res);
  })
  .listen(process.env.PORT || 3000, () => console.log(`http://localhost:${process.env.PORT || 3000}`));
