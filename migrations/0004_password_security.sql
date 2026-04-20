ALTER TABLE users ADD COLUMN password_changed_at TEXT;

UPDATE users
SET password_changed_at = COALESCE(password_changed_at, created_at, CURRENT_TIMESTAMP)
WHERE password_changed_at IS NULL;
