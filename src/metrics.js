import { db } from './db'

export const getMetricsByUserAndWeek = async (userId, startDate, endDate) => {
  return await db`
    SELECT *
    FROM metrics
    WHERE user_id = ${userId}
      AND date >= ${startDate}
      AND date < ${endDate}
    ORDER BY date ASC
  `
}

export const createMetric = async ({
  userId,
  habitId,
  date,
  value,
}) => {
  const [metric] = await db`
    INSERT INTO metrics (
      user_id,
      habit_id,
      date,
      value
    )
    VALUES (
      ${userId},
      ${habitId},
      ${date},
      ${value}
    )
    ON CONFLICT (user_id, habit_id, date)
    DO UPDATE SET value = EXCLUDED.value
    RETURNING *
  `

  return metric
}
