import Fastify from 'fastify';
import cors from '@fastify/cors';
import * as dotenv from 'dotenv';

dotenv.config();

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

// Routes
import posts from './routes/posts.js';
import misc from './routes/misc.js';
import details from './routes/post_details.js';
await app.register(posts);
await app.register(misc);
await app.register(details);

app.get('/healthz', async () => ({ ok: true }));

const port = Number(process.env.PORT || 8080);
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`Server listening on :${port}`);
});
