import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createServer, getServerPort } from '@devvit/web/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { api } from './routes/api';
import { menu } from './routes/menu';
import { triggers } from './routes/triggers';
import { scheduler } from './routes/scheduler';
import { appRouter } from './trpc';

const app = new Hono();
const internal = new Hono();

internal.route('/menu', menu);
internal.route('/triggers', triggers);
internal.route('/scheduler', scheduler);

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// tRPC endpoint — mounted under /api so Devvit proxies it to the server
app.all('/api/trpc/*', async (c) => {
  try {
    return await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: c.req.raw,
      router: appRouter,
      createContext: () => ({}),
    });
  } catch (err) {
    console.error('tRPC handler error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// REST fallback endpoints (kept for scheduler/internal routes + backward compat)
app.route('/api', api);
app.route('/internal', internal);

serve({
  fetch: app.fetch,
  createServer,
  port: getServerPort(),
});
