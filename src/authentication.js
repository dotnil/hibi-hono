import { SignJWT, jwtVerify } from 'jose'
import { getCookie } from 'hono/cookie'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required')
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET,
)

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
