import { getDB } from '../db/sqlite.js';
export default async function routes(f) {
    f.get('/posts/:id/comments', async (req, reply) => {
        const db = getDB();
        const res = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='comments' LIMIT 1").get();
        if (!res)
            return reply.send({ rows: [] });
        const id = Number(req.params.id);
        const rows = db.prepare("SELECT id, IFNULL(author,'' ) AS author, IFNULL(created_at,'') AS created_at, IFNULL(text,'') AS text, sentiment FROM comments WHERE post_id = ? ORDER BY id ASC LIMIT 200").all(id);
        reply.send({ rows });
    });
    f.get('/posts/:id/transcript', async (req, reply) => {
        const db = getDB();
        const id = Number(req.params.id);
        const row = db.prepare("SELECT video_transcript FROM enriched_content WHERE post_id = ? LIMIT 1").get(id);
        reply.send({ transcript: row?.video_transcript ?? null });
    });
}
