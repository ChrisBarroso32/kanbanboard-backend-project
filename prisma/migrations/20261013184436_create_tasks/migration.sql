-- Drop the old Board/Column/Task model (Kanban is now status-based)
DROP TABLE "Task";
DROP TABLE "Column";
DROP TABLE "Board";

CREATE TYPE task_status AS ENUM ('BACKLOG', 'IN_PROGRESS', 'REVIEW', 'DONE');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'BACKLOG',
    priority task_priority NOT NULL DEFAULT 'MEDIUM',
    order_index INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices indispensables para que el Kanban vuele:
CREATE INDEX idx_tasks_status_order ON tasks(status, order_index);
CREATE INDEX idx_tasks_priority ON tasks(priority);
