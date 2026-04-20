ALTER TABLE enrollments ADD COLUMN completion_status TEXT NOT NULL DEFAULT 'in_progress';
ALTER TABLE enrollments ADD COLUMN completed_at TEXT;

CREATE INDEX IF NOT EXISTS idx_enrollments_completion_status
  ON enrollments(completion_status);
