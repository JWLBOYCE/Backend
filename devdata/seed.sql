PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY,
  source_id TEXT,
  source TEXT,
  created_at TEXT,
  classification TEXT,
  title TEXT,
  location_name TEXT,
  url TEXT,
  keyword TEXT,
  latitude REAL,
  longitude REAL,
  sentiment_label TEXT,
  sentiment REAL,
  flagged INTEGER,
  notes TEXT,
  comment_count INTEGER,
  comment_sentiment TEXT
);
CREATE TABLE IF NOT EXISTS enriched_content (
  post_id INTEGER,
  content_summary TEXT
);
INSERT OR IGNORE INTO posts (
  id, source_id, source, created_at, classification, title, location_name, url, keyword,
  latitude, longitude, sentiment_label, sentiment, flagged, notes, comment_count, comment_sentiment
) VALUES (
  1, 'abc123', 'reddit', datetime('now','-1 day'), 'relevant', 'Sample Title', 'Sample Location', 'http://example.com', 'accessibility',
  0.0, 0.0, 'positive', 0.8, 0, NULL, 5, 'neutral'
);
