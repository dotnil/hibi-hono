import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { create as createHabit, list, update, remove} from './habits'
import { create as createUser, authenticateUser } from './users'
import { setCookie } from 'hono/cookie'
import { SignJWT } from 'jose'

if (!process.env.JWT_SECRET) { throw new Error('JWT_SECRET is required') }
const secret = new TextEncoder().encode(process.env.JWT_SECRET)

const app = new Hono()

app.use('*', cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))

// habits

app.get('/habits', async (context) => {
  console.log('GET /habits called')

  const habits = await list()

  console.log('DB result:', habits)

  return context.json(habits)
})

app.post('/habits', async (context) => {
  const habitPayload = await context.req.json()
  const backendHabit = await createHabit(habitPayload)
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

  if (!user) {
    return context.json({ error: 'Invalid credentials' }, 401)
  }

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

serve({
  fetch: app.fetch,
  port: 3003
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
