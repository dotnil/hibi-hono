import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('*', cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))

app.post('/tasks', async (context) => {
  const body = await context.req.json()
  console.log(body)
  return context.text('Hello Hono!')
})

serve({
  fetch: app.fetch,
  port: 3003
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
