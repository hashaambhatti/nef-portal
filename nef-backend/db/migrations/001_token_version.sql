-- Run ONCE on a database created from the previous schema.sql (before the
-- security fixes). New databases created with `npm run db:setup` already
-- have these changes.
ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0;
ALTER TABLE students ADD INDEX idx_students_school_name (school_name(100));
