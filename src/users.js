import postgres from 'postgres'
import bcrypt from 'bcrypt'

const db = postgres(process.env.DATABASE_URL)

export const create = async user => {
  const [createdUser] = await db`
    INSERT INTO users (email, password_hash)
    VALUES (${user.email}, ${user.password_hash})
    RETURNING *
  `

  return createdUser
}

export const findByEmail = async email => {
  const [user] = await db`
    SELECT *
    FROM users
    WHERE email = ${email}
  `

  return user
}

export const createUser = async ({ email, password }) => {
  const password_hash = await bcrypt.hash(password, 10)

  return create({ email, password_hash })
}

export const authenticateUser = async ({ email, password }) => {
  const user = await findByEmail(email)

  if (!user) {
    return null
  }

  const isValid = await bcrypt.compare(password, user.password_hash)

  if (!isValid) {
    return null
  }

  return user
}
