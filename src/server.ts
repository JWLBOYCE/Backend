import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import * as dotenv from 'dotenv';

// Load base .env first, then overlay .env.local if present to keep dev/prod keys aligned
dotenv.config();
try {
  dotenv.config({ path: '.env.local', override: true });
} catch {}

const app = Fastify({ logger: true });

// Configure CORS with an allowlist instead of reflecting arbitrary origins
const allowedOrigins = String(process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

await app.register(cors, {
  credentials: true,
  origin: (origin, cb) => {
    if (!origin) {
      // Allow non-browser requests
      cb(null, true);
      return;
    }
    const isAllowed = allowedOrigins.includes(origin);
    cb(null, isAllowed);
  },
});

// Add common security headers
await app.register(helmet, {
  // Keep CSP off here to avoid breaking clients; consider enabling with a policy later
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

// Security: rate limiting and optional bearer auth hook helper
import { registerSecurity, requireAuth } from './lib/security.js';
await registerSecurity(app);

// Routes
import posts from './routes/posts.js';
import misc from './routes/misc.js';
import details from './routes/post_details.js';
// Public routes
await app.register(misc);
// Protected routes (if API_TOKEN is set)
const authHook = requireAuth(app);
await app.register(async (f) => {
  f.addHook('onRequest', authHook);
  await f.register(posts);
  await f.register(details);
});

app.get('/healthz', async () => ({ ok: true }));

// Generic error handler to avoid leaking internal details
app.setErrorHandler((err, req, reply) => {
  app.log.error(err);
  const status = (err as any)?.statusCode || 500;
  reply.status(status).send({ statusCode: status, error: status === 500 ? 'Internal Server Error' : 'Error', message: status === 500 ? 'An unexpected error occurred' : (err as any)?.message || 'Error' });
});

const port = Number(process.env.PORT || 8080);
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`Server listening on :${port}`);
});
