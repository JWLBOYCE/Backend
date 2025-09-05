import { getDB } from '../db/sqlite.js';
import { detectSchema } from '../db/sqlite.js';
export default async function routes(f) {
    f.get('/schema', async (_req, reply) => { const db = getDB(); reply.send(detectSchema(db)); });
    f.get('/analytics', async (_req, reply) => {
        const db = getDB();
        const total = db.prepare('SELECT COUNT(*) AS c FROM posts').get().c;
        const last7 = db.prepare("SELECT COUNT(*) AS c FROM posts WHERE datetime(created_at) >= datetime('now','-7 days')").get().c;
        const last30 = db.prepare("SELECT COUNT(*) AS c FROM posts WHERE datetime(created_at) >= datetime('now','-30 days')").get().c;
        const bySource = db.prepare("SELECT LOWER(source) as s, COUNT(*) as c FROM posts GROUP BY LOWER(source) ORDER BY c DESC").all();
        const byLocation = db.prepare("SELECT location_name as l, COUNT(*) as c FROM posts WHERE IFNULL(location_name,'') <> '' GROUP BY location_name ORDER BY c DESC LIMIT 10").all();
        const keywords = db.prepare("SELECT LOWER(keyword) as k, COUNT(*) as c FROM posts WHERE IFNULL(keyword,'') <> '' GROUP BY LOWER(keyword) ORDER BY c DESC LIMIT 10").all();
        reply.send({ total, last7, last30, bySource, byLocation, keywords });
    });
    f.get('/facets', async (_req, reply) => {
        const db = getDB();
        const rows = db.prepare("SELECT LOWER(classification) AS c, COUNT(*) AS cnt FROM posts WHERE LOWER(classification) LIKE 'partly%' GROUP BY LOWER(classification)").all();
        const result = {};
        for (const r of rows) {
            const cls = String(r.c || '');
            let base = cls;
            const parts = cls.split(' - ');
            if (parts.length > 1)
                base = parts[1];
            result[base] = (result[base] || 0) + r.cnt;
        }
        reply.send({ reasons: result });
    });
}
