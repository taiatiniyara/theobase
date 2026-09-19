import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { accountsRoutes } from './accounts/routes'
import { auth } from './auth/routes'
import { churchesRoutes } from './churches/routes'
import { countsRoutes } from './counts/routes'
import { missionsRoutes } from './missions/routes'
import { reconciliationsRoutes } from './reconciliations/routes'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// The web app (Pages) and this API (Workers) are separate origins.
// A wildcard origin is incompatible with credentialed requests (the
// session cookie) per the Fetch/CORS spec, so this reads an explicit,
// comma-separated allowlist from WEB_ORIGIN (see wrangler.jsonc).
app.use('*', (c, next) => {
  const allowed = c.env.WEB_ORIGIN.split(',').map((o) => o.trim())
  return cors({
    origin: allowed,
    credentials: true,
  })(c, next)
})

app.get('/health', (c) => c.json({ ok: true }))

app.get('/health/db', async (c) => {
  const result = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>()
  return c.json({ ok: result?.ok === 1 })
})

app.route('/auth', auth)
app.route('/counts', countsRoutes)
app.route('/reconciliations', reconciliationsRoutes)
app.route('/missions', missionsRoutes)
app.route('/churches', churchesRoutes)
app.route('/accounts', accountsRoutes)

export default app
