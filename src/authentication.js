import { SignJWT, jwtVerify } from 'jose'
import { getCookie } from 'hono/cookie'
import bcrypt from 'bcrypt'
import { create, findByEmail } from './users'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required')
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET,
)

export const authenticateUser = async ({ email, password }) => {
  const user = await findByEmail(email)

  if (!user) { return null }

  const isValid = await bcrypt.compare(password, user.password_hash)

  if (!isValid) { return null }

  return user
}

export const createUser = async ({ email, password }) => {
  const password_hash = await bcrypt.hash(password, 10)

  return create({ email, password_hash })
}

export const createToken = async (userId) => {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export const getUserIdFromCookie = async (context) => {
  const token = getCookie(context, 'jwt')

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload.userId
  } catch (error) {
    return null
  }
}
