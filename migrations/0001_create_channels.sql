CREATE TABLE IF NOT EXISTS channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  handle TEXT,
  thumbnail_url TEXT,
  added_at TEXT DEFAULT (datetime('now'))
);
