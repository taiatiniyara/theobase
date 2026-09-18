import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// The web app (Pages) and this API (Workers) are separate origins.
// Tightened to real origins (env-driven) once those domains exist.
app.use('*', cors())

app.get('/health', (c) => c.json({ ok: true }))

app.get('/health/db', async (c) => {
  const result = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>()
  return c.json({ ok: result?.ok === 1 })
})

export default app
