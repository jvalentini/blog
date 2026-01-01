CREATE TABLE IF NOT EXISTS page_views (
  path TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  last_viewed TEXT
);

CREATE INDEX IF NOT EXISTS idx_page_views_count ON page_views(count DESC);
