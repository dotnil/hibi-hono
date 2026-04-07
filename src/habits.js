import postgres from 'postgres'

const db = postgres(process.env.DATABASE_URL)

export const saveHabit = async habit => {
  const [createdHabit] = await db`
    INSERT INTO habits (title, status)
    VALUES (${habit.title}, ${habit.status})
    RETURNING *
  `
  return createdHabit
}

export const remove = id => {

}

export const list = () => {

}
