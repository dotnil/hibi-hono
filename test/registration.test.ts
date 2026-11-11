import assert from 'node:assert/strict'
import test from 'node:test'
import bcrypt from 'bcrypt'
import { createTestApplication } from './support.ts'

const { app, db } = await createTestApplication()

test('registers a user', async () => {
  const email = 'registration@example.com'
  const password = 'correct-horse-battery-staple'
  const response = await app.request('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const user = await response.json()

  assert.equal(response.status, 201)
  assert.ok(user.id)
  assert.equal(user.email, email)
  assert.equal('password' in user, false)
  assert.equal('password_hash' in user, false)

  const [storedUser] = await db`
    SELECT id, email, password_hash
    FROM users
    WHERE id = ${user.id}
  `

  assert.equal(storedUser.email, email)
  assert.notEqual(storedUser.password_hash, password)
  assert.equal(await bcrypt.compare(password, storedUser.password_hash), true)
})
