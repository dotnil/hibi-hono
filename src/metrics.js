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
