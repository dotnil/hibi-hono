import { db } from './db'

export const createHabit = async habit => {
  const [createdHabit] = await db`
    INSERT INTO habits (name, active, user_id)
    VALUES (${habit.name}, ${habit.active}, ${habit.userId})
    RETURNING *
  `
  return createdHabit
}

export const listByUserId = async (userId) => {
  return await db`
    SELECT * FROM habits
    WHERE user_id = ${userId}
    ORDER BY id ASC
  `
}

export const updateHabit = async (id, userId, { name }) => {
  const [updated] = await db`
    UPDATE habits
    SET name = ${name}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `
  return updated
}

export const removeHabit = async (id, userId) => {
  const [deleted] = await db`
    DELETE FROM habits
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `
  return deleted
}
