-- ============================================================================
--  001_init — базовая схема планировщика задач MAX
-- ============================================================================

-- Автообновление updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- users: id = MAX user ID (bigint, натуральный ключ)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT PRIMARY KEY,
  first_name    TEXT        NOT NULL DEFAULT '',
  last_name     TEXT,
  username      TEXT,
  role          TEXT        NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- tasks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description  TEXT        CHECK (description IS NULL OR char_length(description) <= 4000),
  assignee_id  BIGINT      NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_by   BIGINT      NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status       TEXT        NOT NULL DEFAULT 'NOT_STARTED'
                 CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'DONE')),
  priority     TEXT        NOT NULL DEFAULT 'NORMAL'
                 CHECK (priority IN ('NORMAL', 'IMPORTANT', 'URGENT')),
  deadline     TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_created  ON tasks(created_at);

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- comments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id         BIGSERIAL PRIMARY KEY,
  task_id    BIGINT      NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  text       TEXT        NOT NULL CHECK (char_length(text) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id, created_at);

-- ----------------------------------------------------------------------------
-- task_history
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_history (
  id         BIGSERIAL PRIMARY KEY,
  task_id    BIGINT      NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    BIGINT      REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT        NOT NULL
               CHECK (event_type IN ('CREATED','STARTED','COMPLETED','STATUS_CHANGED','COMMENT_ADDED')),
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_history_task ON task_history(task_id, created_at);
