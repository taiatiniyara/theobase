import app from '../src/index'
import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { createInstitutionalAccount, createLocalAccount } from '../src/auth/accounts'
import { getDb } from '../src/db/client'

const ORIGIN = 'http://localhost:5173'

function cookieFrom(res: Response): string {
  const setCookie = res.headers.get('set-cookie')
  if (!setCookie) throw new Error('expected a Set-Cookie header')
  return setCookie.split(';')[0]
}

describe('local login (phone + PIN)', () => {
  it('logs in with a correct PIN, sets a session cookie, and /auth/me resolves it', async () => {
    const db = getDb(env.DB)
    await createLocalAccount(db, { displayName: 'Treasurer Tia', phone: '+6791234567', pin: '4321' })

    const loginRes = await app.request(
      '/auth/local/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({ phone: '+6791234567', pin: '4321' }),
      },
      env,
    )
    expect(loginRes.status).toBe(200)
    const loginBody = await loginRes.json<{ account: { displayName: string } }>()
    expect(loginBody.account.displayName).toBe('Treasurer Tia')

    const cookie = cookieFrom(loginRes)
    const meRes = await app.request(
      '/auth/me',
      { headers: { cookie, origin: ORIGIN } },
      env,
    )
    expect(meRes.status).toBe(200)
    const meBody = await meRes.json<{ account: { displayName: string } }>()
    expect(meBody.account.displayName).toBe('Treasurer Tia')
  })

  it('rejects a wrong PIN', async () => {
    const db = getDb(env.DB)
    await createLocalAccount(db, { displayName: 'Treasurer Wrong', phone: '+6790000001', pin: '1111' })

    const res = await app.request(
      '/auth/local/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({ phone: '+6790000001', pin: '9999' }),
      },
      env,
    )
    expect(res.status).toBe(401)
  })

  it('rejects an unknown phone number', async () => {
    const res = await app.request(
      '/auth/local/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({ phone: '+6799999999', pin: '1234' }),
      },
      env,
    )
    expect(res.status).toBe(401)
  })

  it('locks the account after repeated failed attempts', async () => {
    const db = getDb(env.DB)
    await createLocalAccount(db, { displayName: 'Treasurer Locked', phone: '+6790000002', pin: '5555' })

    for (let i = 0; i < 5; i++) {
      const res = await app.request(
        '/auth/local/login',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin: ORIGIN },
          body: JSON.stringify({ phone: '+6790000002', pin: 'wrong' }),
        },
        env,
      )
      expect(res.status).toBe(401)
    }

    // 6th attempt — even with the *correct* PIN — should now be locked.
    const res = await app.request(
      '/auth/local/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({ phone: '+6790000002', pin: '5555' }),
      },
      env,
    )
    expect(res.status).toBe(423)
  })
})

describe('institutional login (email + password)', () => {
  it('logs in with a correct password and shares the same session model as local login', async () => {
    const db = getDb(env.DB)
    await createInstitutionalAccount(db, {
      displayName: 'CFO Carmen',
      email: 'cfo@example.test',
      password: 'correct-horse-battery-staple',
    })

    const loginRes = await app.request(
      '/auth/institutional/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({ email: 'cfo@example.test', password: 'correct-horse-battery-staple' }),
      },
      env,
    )
    expect(loginRes.status).toBe(200)

    const cookie = cookieFrom(loginRes)
    const meRes = await app.request('/auth/me', { headers: { cookie, origin: ORIGIN } }, env)
    expect(meRes.status).toBe(200)
    const meBody = await meRes.json<{ account: { displayName: string; accountType: string } }>()
    expect(meBody.account.displayName).toBe('CFO Carmen')
    expect(meBody.account.accountType).toBe('institutional')
  })

  it('rejects a wrong password', async () => {
    const db = getDb(env.DB)
    await createInstitutionalAccount(db, {
      displayName: 'CFO Wrong',
      email: 'wrong@example.test',
      password: 'correct-horse-battery-staple',
    })

    const res = await app.request(
      '/auth/institutional/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({ email: 'wrong@example.test', password: 'nope' }),
      },
      env,
    )
    expect(res.status).toBe(401)
  })
})

describe('session lifecycle', () => {
  it('/auth/me rejects when there is no session cookie', async () => {
    const res = await app.request('/auth/me', { headers: { origin: ORIGIN } }, env)
    expect(res.status).toBe(401)
  })

  it('logout clears the session so /auth/me stops working', async () => {
    const db = getDb(env.DB)
    await createLocalAccount(db, { displayName: 'Treasurer Logout', phone: '+6790000003', pin: '2468' })

    const loginRes = await app.request(
      '/auth/local/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({ phone: '+6790000003', pin: '2468' }),
      },
      env,
    )
    const cookie = cookieFrom(loginRes)

    const logoutRes = await app.request(
      '/auth/logout',
      { method: 'POST', headers: { cookie, origin: ORIGIN } },
      env,
    )
    expect(logoutRes.status).toBe(200)

    const meRes = await app.request('/auth/me', { headers: { cookie, origin: ORIGIN } }, env)
    expect(meRes.status).toBe(401)
  })

  it('rejects a tampered session cookie', async () => {
    const res = await app.request(
      '/auth/me',
      { headers: { cookie: `theobase_session=not-a-real-signed-value`, origin: ORIGIN } },
      env,
    )
    expect(res.status).toBe(401)
  })
})
