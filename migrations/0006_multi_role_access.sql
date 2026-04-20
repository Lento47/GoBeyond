CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO user_roles (user_id, role, created_at)
SELECT id, role, CURRENT_TIMESTAMP
FROM users;

ALTER TABLE sessions ADD COLUMN active_role TEXT CHECK (active_role IN ('admin', 'teacher', 'student'));

UPDATE sessions
SET active_role = (
  SELECT role
  FROM users
  WHERE users.id = sessions.user_id
)
WHERE active_role IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_roles_role_user
  ON user_roles(role, user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_active_role
  ON sessions(active_role);
