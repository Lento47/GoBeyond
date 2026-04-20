CREATE TABLE IF NOT EXISTS user_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  cta_path TEXT,
  metadata_json TEXT,
  email_sent_at TEXT,
  email_failed_at TEXT,
  portal_seen_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_pending
  ON user_notifications(user_id, portal_seen_at, created_at);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_kind_created
  ON user_notifications(user_id, kind, created_at);
