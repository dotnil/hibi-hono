import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { createHabit, listByUserId, updateHabit, removeHabit } from './habits'
import { findById } from './users'

import { setCookie } from 'hono/cookie'
import { registerUser, authenticateUser, createToken, getUserIdFromCookie } from './authentication'

const app = new Hono()

app.onError((err, context) => {
  console.error(err)
  return context.json({ error: 'Internal Server Error' }, 500)
})

app.use('*', cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))

// habits

app.get('/habits', async (context) => {
  const userId = await getUserIdFromCookie(context)
  if (!userId) { return context.json({ error: 'Unauthorized' }, 401) }

  const habits = await listByUserId(userId)

  return context.json(habits)
})

app.post('/habits', async (context) => {
  const habitPayload = await context.req.json()

  const userId = await getUserIdFromCookie(context)
  if (!userId) { return context.json({ error: 'Unauthorized' }, 401) }

  const habit = await createHabit({
    name: habitPayload.name,
    active: habitPayload.active !== undefined ? habitPayload.active : true,
    userId: userId,
  })

  return context.json(habit, 201)
})

app.patch('/habits/:id', async (context) => {
  const userId = await getUserIdFromCookie(context)

  if (!userId) { return context.json({ error: 'Unauthorized' }, 401) }

  const id = context.req.param('id')
  const { name } = await context.req.json()
  const updatedHabit = await updateHabit(id, userId, { name })

  return context.json(updatedHabit)
})

app.delete('/habits/:id', async (context) => {
  const userId = await getUserIdFromCookie(context)

  if (!userId) { return context.json({ error: 'Unauthorized' }, 401) }

  const id = context.req.param('id')
  const deletedHabit = await removeHabit(id, userId)

  return context.json(deletedHabit)
})

// users

app.post('/users', async context => {
  const credentials = await context.req.json()

  const user = await registerUser(credentials)

  if (!user) return context.json({ error: 'Email already exists' }, 409)

  return context.json(user, 201)
})

app.post('/sessions', async context => {
  const credentials = await context.req.json()

  const user = await authenticateUser(credentials)

  if (!user) { return context.json({ error: 'Invalid credentials' }, 401) }

  const token = await createToken(user.id)

  setCookie(context, 'jwt', token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: false,
    path: '/',
  })

  return context.json({ ok: true })
})

app.post('/logout', async (context) => {
  setCookie(context, 'jwt', '', {
    httpOnly: true,
    sameSite: 'Lax',
    secure: false,
    path: '/',
    maxAge: 0,
  })
  return context.json({ ok: true })
})

app.get('/sessions/current', async (context) => {
  const userId = await getUserIdFromCookie(context)

  if (!userId) { return context.json({ error: 'Unauthorized' }, 401) }

  const user = await findById(userId)

  if (!user) { return context.json({ error: 'User not found' }, 404) }

  return context.json(user)
})

serve({
  fetch: app.fetch,
  port: 3003
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
