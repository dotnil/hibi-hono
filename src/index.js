import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { create as createHabit, list, update, remove} from './habits'
import { create as createUser } from './users'
import bcrypt from 'bcrypt'

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

// user

app.post('/users', async (context) => {
  const { email, password } =
    await context.req.json()

  const password_hash =
    await bcrypt.hash(password, 10)

  const backendUser =
    await createUser({
      email,
      password_hash,
    })

  return context.json(backendUser, 201)
})

serve({
  fetch: app.fetch,
  port: 3003
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
