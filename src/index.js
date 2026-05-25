import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { saveHabit } from './habits'

const app = new Hono()

app.use('*', cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))

app.post('/habits', async (context) => {
  const habitPayload = await context.req.json()
  const backendHabit = await saveHabit(habitPayload)
  return context.json(backendHabit)
})

serve({
  fetch: app.fetch,
  port: 3003
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
