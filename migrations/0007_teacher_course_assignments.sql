CREATE TABLE IF NOT EXISTS teacher_course_assignments (
  teacher_user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (teacher_user_id, course_id),
  FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_teacher_course_assignments_course
  ON teacher_course_assignments(course_id, teacher_user_id);
