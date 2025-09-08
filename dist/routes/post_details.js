import { getDB } from '../db/sqlite.js';
import { z } from 'zod';
export default async function routes(f) {
    const idParam = z.object({ id: z.coerce.number().int().nonnegative() });
    f.get('/posts/:id/comments', async (req, reply) => {
        const db = getDB();
        const res = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='comments' LIMIT 1").get();
        if (!res)
            return reply.send({ rows: [] });
        const p = idParam.safeParse(req.params);
        if (!p.success) {
            reply.code(400).send({ error: 'Invalid id' });
            return;
        }
        const id = p.data.id;
        const rows = db.prepare("SELECT id, IFNULL(author,'' ) AS author, IFNULL(created_at,'') AS created_at, IFNULL(text,'') AS text, sentiment FROM comments WHERE post_id = ? ORDER BY id ASC LIMIT 200").all(id);
        reply.send({ rows });
    });
    f.get('/posts/:id/transcript', async (req, reply) => {
        const db = getDB();
        const p = idParam.safeParse(req.params);
        if (!p.success) {
            reply.code(400).send({ error: 'Invalid id' });
            return;
        }
        const id = p.data.id;
        const row = db.prepare("SELECT video_transcript FROM enriched_content WHERE post_id = ? LIMIT 1").get(id);
        reply.send({ transcript: row?.video_transcript ?? null });
    });
}
