import { db } from './db.js'

type HabitInput = {
  name: string
  active: boolean
  color: string
  goalPeriod: 'day' | 'week' | 'month'
  goalTarget: number
  userId: number
}

type HabitUpdate = {
  name: string
  color: string
  goalPeriod: 'day' | 'week' | 'month'
  goalTarget: number
}

export const createHabit = async (habit: HabitInput) => {
  const [createdHabit] = await db`
    INSERT INTO habits (
      name,
      active,
      color,
      goal_period,
      goal_target,
      user_id
    )
    VALUES (
      ${habit.name},
      ${habit.active},
      ${habit.color},
      ${habit.goalPeriod},
      ${habit.goalTarget},
      ${habit.userId}
    )
    RETURNING *
  `

  return createdHabit
}

export const listByUserId = async (userId: number) => {
  return await db`
    SELECT *
    FROM habits
    WHERE user_id = ${userId}
    ORDER BY id ASC
  `
}

export const updateHabit = async (
  id: string,
  userId: number,
  { name, color, goalPeriod, goalTarget }: HabitUpdate
) => {
  const [updated] = await db`
    UPDATE habits
    SET
      name = ${name},
      color = ${color},
      goal_period = ${goalPeriod},
      goal_target = ${goalTarget}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `

  return updated
}

export const removeHabit = async (id: string, userId: number) => {
  const [deleted] = await db`
    DELETE FROM habits
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `

  return deleted
}
