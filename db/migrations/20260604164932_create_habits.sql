-- migrate:up
CREATE TABLE IF NOT EXISTS habits (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    name TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);

-- migrate:down
DROP TABLE IF EXISTS habits;
