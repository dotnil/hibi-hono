-- migrate:up

CREATE TABLE IF NOT EXISTS metrics (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    habit_id BIGINT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value BOOLEAN NOT NULL,

    UNIQUE (user_id, habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_metrics_user_id
ON metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_metrics_habit_id
ON metrics(habit_id);

-- migrate:down

DROP TABLE IF EXISTS metrics;
