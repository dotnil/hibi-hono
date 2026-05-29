import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { create, list, update, remove} from './habits'

const app = new Hono()

app.use('*', cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))

app.get('/habits', async (context) => {
  console.log('GET /habits called')

  const habits = await list()

  console.log('DB result:', habits)

  return context.json(habits)
})

app.post('/habits', async (context) => {
  const habitPayload = await context.req.json()
  const backendHabit = await create(habitPayload)
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

serve({
  fetch: app.fetch,
  port: 3003
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
