import assert from 'node:assert/strict'
import test from 'node:test'
import { createTestApplication } from './support.ts'

const { app } = await createTestApplication()

test('logs in a registered user', async () => {
  const email = 'login@example.com'
  const password = 'correct-horse-battery-staple'

  await app.request('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const response = await app.request('/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const responseBody = await response.json()
  const setCookieHeader = response.headers.get('Set-Cookie')

  assert.equal(response.status, 200)
  assert.deepEqual(responseBody, { ok: true })
  assert.ok(setCookieHeader)
  assert.match(setCookieHeader, /^jwt=[^;]+/)
  assert.match(setCookieHeader, /HttpOnly/)
  assert.match(setCookieHeader, /SameSite=Lax/)
  assert.match(setCookieHeader, /Path=\//)
})

test('gets the current user from a valid session', async () => {
  const email = 'current-user@example.com'
  const password = 'correct-horse-battery-staple'

  const registrationResponse = await app.request('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const registeredUser = await registrationResponse.json()

  const loginResponse = await app.request('/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const setCookieHeader = loginResponse.headers.get('Set-Cookie')
  const sessionCookie = setCookieHeader?.split(';')[0]

  const response = await app.request('/sessions/current', {
    headers: { Cookie: sessionCookie },
  })
  const user = await response.json()

  assert.equal(response.status, 200)
  assert.equal(user.id, registeredUser.id)
  assert.equal(user.email, email)
  assert.equal('password_hash' in user, false)
})

test('logs out a user', async () => {
  const email = 'logout@example.com'
  const password = 'correct-horse-battery-staple'

  await app.request('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const loginResponse = await app.request('/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const loginSetCookieHeader = loginResponse.headers.get('Set-Cookie')
  assert.ok(loginSetCookieHeader)
  const sessionCookie = loginSetCookieHeader.split(';')[0]

  const response = await app.request('/logout', {
    method: 'POST',
    headers: { Cookie: sessionCookie },
  })
  const responseBody = await response.json()
  const setCookieHeader = response.headers.get('Set-Cookie')

  assert.equal(response.status, 200)
  assert.deepEqual(responseBody, { ok: true })
  assert.ok(setCookieHeader)
  assert.match(setCookieHeader, /^jwt=;/)
  assert.match(setCookieHeader, /Max-Age=0/)
})
