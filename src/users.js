import postgres from 'postgres'

const db = postgres(process.env.DATABASE_URL)

export const create = async user => {
  const [createdUser] = await db`
    INSERT INTO users (email, password_hash)
    VALUES (${user.email}, ${user.password_hash})
    RETURNING id, email
  `

  return createdUser
}

export const findByEmail = async email => {
  const [user] = await db`
    SELECT id, email, password_hash
    FROM users
    WHERE email = ${email}
  `

  return user
}

export const findById = async (userId) => {
  const [user] = await db`
    SELECT id, email
    FROM users
    WHERE id = ${userId}
  `

  return user
}
