import postgres from 'postgres'

const db = postgres(process.env.DATABASE_URL)

export const saveHabit = async habit => {
  const [createdHabit] = await db`
    INSERT INTO habits (name, status)
    VALUES (${habit.name}, ${habit.status})
    RETURNING *
  `
  return createdHabit
}

export const list = async () => {
  return await db`SELECT * FROM habits`
}

export const remove = async id => {
  const [deleted] = await db`
    DELETE FROM habits
    WHERE id = ${id}
    RETURNING *
  `
  return deleted
}
