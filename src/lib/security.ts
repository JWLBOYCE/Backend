import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { z } from 'zod';

export async function registerSecurity(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
    ban: 0,
    allowList: (process.env.RATE_LIMIT_ALLOWLIST || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    keyGenerator: (req) => (req.headers['x-forwarded-for'] as string) || req.ip,
  });
}

export function requireAuth(app: FastifyInstance) {
  const secret = process.env.API_TOKEN || '';
  const headerSchema = z.object({ authorization: z.string().optional() });
  return async function authHook(req: FastifyRequest, reply: FastifyReply) {
    if (!secret) return; // if not configured, allow all (development)
    const headers = headerSchema.safeParse(req.headers);
    const token = headers.success ? headers.data.authorization : undefined;
    const ok = !!token && token === `Bearer ${secret}`;
    if (!ok) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  };
}

export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return async function (req: FastifyRequest, reply: FastifyReply) {
    const r = schema.safeParse((req as any).query || {});
    if (!r.success) {
      reply.code(400).send({ error: 'Invalid query', details: r.error.flatten() });
    } else {
      (req as any).query = r.data;
    }
  };
}


