import { getDB, detectSchema } from '../db/sqlite.js';
export default async function routes(f) {
    f.get('/posts', async (req, reply) => {
        const db = getDB();
        const q = (req.query || {});
        const where = [];
        const params = [];
        const b = (v, d) => v === undefined ? d : (v === '1' || String(v).toLowerCase() === 'true');
        const clsU = b(q.clsU, true), clsP = b(q.clsP, true), clsR = b(q.clsR, true), clsI = b(q.clsI, true), flagged = b(q.flagged, false);
        if (!(clsU && clsP && clsR && clsI) || flagged) {
            const classClauses = [];
            if (clsU)
                classClauses.push("(classification IS NULL OR LOWER(classification)='unclassified')");
            if (clsP) {
                const reasons = [].concat(q.reason || []).filter(Boolean);
                if (!reasons.length)
                    classClauses.push("(LOWER(classification) LIKE 'partly_relevant%' OR LOWER(classification) LIKE 'partly relevant%')");
                else {
                    const ors = [];
                    for (const r of reasons) {
                        const base = String(r).toLowerCase();
                        ors.push(`LOWER(classification) = 'partly_relevant - ${base}'`);
                        ors.push(`LOWER(classification) = 'partly relevant - ${base}'`);
                    }
                    classClauses.push('(' + ors.join(' OR ') + ')');
                }
            }
            if (clsR)
                classClauses.push("LOWER(classification) LIKE 'relevant%'");
            if (clsI)
                classClauses.push("LOWER(classification) LIKE 'irrelevant%'");
            if (classClauses.length)
                where.push('(' + classClauses.join(' OR ') + ')');
            if (flagged)
                where.push('IFNULL(p.flagged,0) = 1');
        }
        const srcR = b(q.srcR, true), srcY = b(q.srcY, true);
        if (!(srcR && srcY)) {
            const s = [];
            if (srcR)
                s.push("LOWER(source)='reddit'");
            if (srcY)
                s.push("LOWER(source)='youtube'");
            if (s.length)
                where.push('(' + s.join(' OR ') + ')');
        }
        const cat = (q.category || 'All').toLowerCase();
        if (cat !== 'all') {
            if (cat === 'social')
                where.push("LOWER(source) IN ('reddit','youtube','twitter','tiktok','facebook','instagram')");
            else if (cat === 'news')
                where.push("LOWER(source) IN ('news','guardian','nytimes','bbc','cnn','reuters','ap','bloomberg','forbes','washington_post','wsj','theverge','techcrunch')");
            else if (cat === 'academic')
                where.push("LOWER(source) IN ('arxiv','doi','acm','springer','nature','elsevier','researchgate')");
        }
        const range = (q.range || 'All').toLowerCase();
        if (range === '7d')
            where.push("datetime(created_at) >= datetime('now','-7 days')");
        if (range === '30d')
            where.push("datetime(created_at) >= datetime('now','-30 days')");
        if (range === '90d')
            where.push("datetime(created_at) >= datetime('now','-90 days')");
        const sent = (q.sent || 'All').toLowerCase();
        const search = String(q.q || '').trim().toLowerCase();
        if (search) {
            where.push('(LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR LOWER(location_name) LIKE ?)');
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        const orderExpr = (() => { switch (q.sort || 'createdAt') {
            case 'title': return 'title';
            case 'source': return 'source';
            case 'classification': return 'classification';
            default: return 'datetime(created_at)';
        } })();
        const direction = (q.desc === undefined ? true : b(q.desc, true)) ? 'DESC' : 'ASC';
        const det = detectSchema(db);
        let select = "p.id, IFNULL(p.source_id,''), p.source, p.created_at, IFNULL(p.classification,''), IFNULL(p.title,''), IFNULL(p.location_name,''), IFNULL(p.url,''), IFNULL(p.keyword,'')";
        select += det.hasEnriched ? ", ec.content_summary" : ", NULL as content_summary";
        select += det.hasLatLon ? ", p.latitude, p.longitude" : ", NULL as latitude, NULL as longitude";
        select += det.hasSentimentLabel ? ", IFNULL(p.sentiment_label,'') as sentiment_label" : ", NULL as sentiment_label";
        select += det.hasSentimentScore ? ", p.sentiment" : ", NULL as sentiment";
        select += ", IFNULL(p.flagged,0) as flagged, IFNULL(p.notes,'') as notes";
        select += det.hasCommentMetrics ? ", p.comment_count, p.comment_sentiment" : ", NULL as comment_count, NULL as comment_sentiment";
        const fromSQL = det.hasEnriched ? ' FROM posts p LEFT JOIN enriched_content ec ON ec.post_id = p.id' : ' FROM posts p';
        const whereSQL = where.length ? (' WHERE ' + where.join(' AND ')) : '';
        const limit = Math.min(Math.max(Number(q.limit || 2000), 1), 5000);
        const sql = `SELECT ${select}${fromSQL}${whereSQL} ORDER BY ${orderExpr} ${direction}, p.id DESC LIMIT ${limit}`;
        const rows = db.prepare(sql).all(...params).map((r) => ({
            id: r.id, sourceId: r.source_id, source: r.source, createdAt: r.created_at, classification: r.classification,
            title: r.title, location: r.location_name, url: r.url, keyword: r.keyword || null,
            summary: r.content_summary ?? null, latitude: r.latitude ?? null, longitude: r.longitude ?? null,
            sentimentLabel: r.sentiment_label ?? null, sentimentScore: r.sentiment ?? null, flagged: r.flagged,
            notes: r.notes ?? null, commentCount: r.comment_count ?? null, commentSentiment: r.comment_sentiment ?? null,
        }));
        const total = db.prepare('SELECT COUNT(*) AS c FROM posts').get().c;
        reply.send({ rows, total, schema: det });
    });
}
