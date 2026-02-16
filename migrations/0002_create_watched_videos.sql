CREATE TABLE IF NOT EXISTS watched_videos (
  video_id TEXT PRIMARY KEY,
  watched_at TEXT DEFAULT (datetime('now'))
);
