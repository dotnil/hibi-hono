import postgres from 'postgres'

const db = postgres(process.env.DATABASE_URL)

export const create = async habit => {
  const [createdHabit] = await db`
    INSERT INTO habits (name, status)
    VALUES (${habit.name}, ${habit.status})
    RETURNING *
  `
  return createdHabit
}

export const list = async () => {
  return await db`
    SELECT * FROM habits
    ORDER BY id ASC
  `
}

export const update = async (id, { name }) => {
  const [updated] = await db`
    UPDATE habits
    SET name = ${name}
    WHERE id = ${id}
    RETURNING *
  `
  return updated
}

export const remove = async id => {
  const [deleted] = await db`
    DELETE FROM habits
    WHERE id = ${id}
    RETURNING *
  `
  return deleted
}
