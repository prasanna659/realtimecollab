-- Workspaces -----------------------------------------------------------
CREATE TABLE workspaces (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(120) NOT NULL,
    owner_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workspace_members (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role          VARCHAR(20) NOT NULL DEFAULT 'MEMBER', -- OWNER | MEMBER
    joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_user ON workspace_members (user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members (workspace_id);

-- Projects ---------------------------------------------------------------
CREATE TABLE projects (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    name          VARCHAR(120) NOT NULL,
    description   TEXT,
    color         VARCHAR(20) NOT NULL DEFAULT '#4C7EA8',
    status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | ARCHIVED
    created_by    UUID REFERENCES users (id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_workspace ON projects (workspace_id);

-- Tasks --------------------------------------------------------------------
CREATE TABLE tasks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id    UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    title         VARCHAR(200) NOT NULL,
    description   TEXT,
    status        VARCHAR(20) NOT NULL DEFAULT 'TODO', -- TODO | IN_PROGRESS | REVIEW | DONE
    priority      VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW | MEDIUM | HIGH | URGENT
    position      INTEGER NOT NULL DEFAULT 0,
    due_date      DATE,
    assignee_id   UUID REFERENCES users (id) ON DELETE SET NULL,
    created_by    UUID REFERENCES users (id),
    updated_by    UUID REFERENCES users (id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_project ON tasks (project_id);
CREATE INDEX idx_tasks_assignee ON tasks (assignee_id);
CREATE INDEX idx_tasks_status ON tasks (status);

-- Comments -------------------------------------------------------------------
CREATE TABLE comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES users (id),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_task ON comments (task_id);
