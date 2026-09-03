-- migrate:up
CREATE TABLE IF NOT EXISTS habits (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    active BOOLEAN NOT NULL DEFAULT TRUE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    goal_period VARCHAR(10) NOT NULL,
    goal_target BIGINT NOT NULL,

    CONSTRAINT habits_goal_period_check
        CHECK (goal_period IN ('day', 'week', 'month')),
    CONSTRAINT habits_goal_target_check
        CHECK (goal_target > 0)
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id
    ON habits(user_id);

-- migrate:down
DROP TABLE IF EXISTS habits;
