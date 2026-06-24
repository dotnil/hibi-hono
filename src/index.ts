import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { createHabit, listByUserId, updateHabit, removeHabit } from './habits.js'
import { findById } from './users.js'

import { setCookie } from 'hono/cookie'
import { registerUser, authenticateUser, createToken, getUserIdFromCookie, ensureSecret } from './authentication.js'
import { getMetricsByUserAndWeek, createMetric } from './metrics.js'

const app = new Hono()

app.onError((err, context) => {
  console.error(err)
  return context.json({ error: 'Internal Server Error' }, 500)
})

app.use('*', cors({
  origin: process.env.CORS_ORIGIN,
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

app.get('/metrics', async (c) => {
  const userId = await getUserIdFromCookie(c)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const metrics = await getMetricsByUserAndWeek(
    userId,
    '2026-06-15',   // старт
    '2026-06-21'    // конец
  )

  return c.json(metrics)
})

app.post('/metrics', async (c) => {
  const userId = await getUserIdFromCookie(c)

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json()

  await createMetric({
    userId,
    habitId: body.habit_id,
    date: body.date,
    value: body.value,
  })

  return c.json({}, 201)
})

ensureSecret()

serve({
  fetch: app.fetch,
  port: 3003
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
