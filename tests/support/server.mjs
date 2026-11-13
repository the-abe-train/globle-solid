import { createServer } from 'vite';
import { createServer as createHTTPServer } from 'node:http';
import { fixtureFetch, violations } from './gateway.mjs';

// No real fetch survives in this dedicated process. Unknown services fail closed.
globalThis.fetch = fixtureFetch;
const port = Number(process.argv[2]);
if (![4317, 4318].includes(port)) throw new Error('Explicit fixture port required');
const vite = await createServer({
  configFile: 'vite.puzzle-date.config.ts',
  server: { middlewareMode: true, hmr: { port: port + 100 } },
  appType: 'spa',
});
const handlers = new Map();
for (const name of ['answer', 'account', 'dailyStats', 'sponsor', 'subscribe']) {
  handlers.set('/' + name, await vite.ssrLoadModule('/functions/' + name + '.ts'));
}
const env = { CRYPTO_KEY: 'puzzle-date-test-key', NITROPAY_PRIVATE_KEY: 'synthetic-sponsor-key' };
const server = createHTTPServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  if (url.pathname === '/__test__/violations') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(violations));
    return;
  }
  const module = handlers.get(url.pathname);
  if (!module) return vite.middlewares(req, res);
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      ...(body.length ? { body, duplex: 'half' } : {}),
    });
    const handler =
      module.onRequest || module['onRequest' + req.method[0] + req.method.slice(1).toLowerCase()];
    const response = handler ? await handler({ request, env }) : new Response('', { status: 405 });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end(String(error));
  }
});
server.listen(port, '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, async () => {
    server.close();
    await vite.close();
    process.exit(0);
  });
