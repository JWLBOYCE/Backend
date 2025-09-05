import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Database = require('better-sqlite3');
let cached = null;
export function getDB() {
    if (cached)
        return cached;
    const path = process.env.DATABASE_PATH || '/opt/aab/data/main.db';
    cached = new Database(path, { readonly: true, fileMustExist: true });
    try {
        cached.pragma('journal_mode = WAL');
        cached.pragma('synchronous = NORMAL');
    }
    catch { }
    return cached;
}
export function detectSchema(db) {
    const hasTable = (name) => !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").get(name);
    const cols = db.prepare('PRAGMA table_info(posts)').all();
    const hasCol = (c) => cols.some((r) => String(r.name).toLowerCase() === c.toLowerCase());
    return {
        hasEnriched: hasTable('enriched_content'),
        hasSentimentLabel: hasCol('sentiment_label'),
        hasSentimentScore: hasCol('sentiment'),
        hasLatLon: hasCol('latitude') && hasCol('longitude'),
        hasCommentMetrics: hasCol('comment_count') && hasCol('comment_sentiment'),
        hasCommentsTable: hasTable('comments'),
    };
}
