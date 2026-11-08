-- This migration is intentionally additive to allow older databases to converge to the
-- simplified schema without rewriting Flyway history. It removes feature tables that are
-- not part of the core task board domain.

DROP TABLE IF EXISTS checklist_items;
DROP TABLE IF EXISTS task_labels;
DROP TABLE IF EXISTS activities;

ALTER TABLE IF EXISTS tasks
    DROP COLUMN IF EXISTS is_deleted,
    DROP COLUMN IF EXISTS deleted_at;

-- The app intentionally does not expose task duplication or trash/restore flows.
-- Their legacy code paths and database state are removed here.
