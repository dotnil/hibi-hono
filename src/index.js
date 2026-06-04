import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { create as createHabit, list, update, remove} from './habits'
import { createUser, authenticateUser } from './users'
import { setCookie } from 'hono/cookie'
import { SignJWT } from 'jose'
import { getCookie } from 'hono/cookie'
import { jwtVerify } from 'jose'

if (!process.env.JWT_SECRET) { throw new Error('JWT_SECRET is required') }
const secret = new TextEncoder().encode(process.env.JWT_SECRET)

const app = new Hono()

app.use('*', cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))

// habits

app.get('/habits', async (context) => {
  const userId = await getUserIdFromContext(context)

  if (!userId) { return context.json({ error: 'Unauthorized' }, 401) }

  const habits = await list(userId)

  return context.json(habits)
})

app.post('/habits', async (context) => {
  const habitPayload = await context.req.json()

  const userId = await getUserIdFromContext(context)

  if (!userId) { return context.json({ error: 'Unauthorized' }, 401) }

  const backendHabit = await createHabit({
    name: habitPayload.name,
    status: habitPayload.status,
    userId: userId,
  })

  return context.json(backendHabit, 201)
})

app.patch('/habits/:id', async (context) => {
  const id = context.req.param('id')
  const { name } = await context.req.json()
  const updatedHabit = await update(id, { name })

  return context.json(updatedHabit)
})

app.delete('/habits/:id', async (context) => {
  const id = context.req.param('id')
  const deletedHabit = await remove(id)

  return context.json(deletedHabit)
})

// users

app.post('/users', async context => {
  const credentials = await context.req.json()

  const user = await createUser(credentials)

  return context.json(user, 201)
})

app.post('/sessions', async context => {
  const credentials = await context.req.json()

  const user = await authenticateUser(credentials)

  if (!user) { return context.json({ error: 'Invalid credentials' }, 401) }

  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)

  setCookie(context, 'jwt', token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: false,
    path: '/',
  })

  return context.json({ ok: true })
})

app.get('/sessions/current', async (context) => {
  const userId = await getUserIdFromContext(context)

  if (!userId) { return context.json({ error: 'Unauthorized' }, 401) }

  const user = await findById(userId)

  if (!user) { return context.json({ error: 'User not found' }, 404) }

  return context.json(user)
})

const getUserIdFromContext = async (context) => {
  const token = getCookie(context, 'jwt')

  if (!token) { return null }

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload.userId
  } catch (error) {
    return null
  }
}

serve({
  fetch: app.fetch,
  port: 3003
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
