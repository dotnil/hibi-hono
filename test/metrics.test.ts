import assert from 'node:assert/strict'
import test from 'node:test'
import { createTestApplication } from './support.ts'

const { app, db } = await createTestApplication()

test('creates and gets a metric for the authenticated user habit', async () => {
  const email = 'create-metric@example.com'
  const password = 'correct-horse-battery-staple'
  const registrationResponse = await app.request('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const registeredUser = await registrationResponse.json()

  assert.equal(registrationResponse.status, 201)

  const loginResponse = await app.request('/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const setCookieHeader = loginResponse.headers.get('Set-Cookie')

  assert.equal(loginResponse.status, 200)
  assert.ok(setCookieHeader)

  const createdHabitResponse = await app.request('/habits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: setCookieHeader.split(';')[0],
    },
    body: JSON.stringify({
      name: 'Read 20 minutes',
      color: '#DDEA7C',
      goalPeriod: 'week',
      goalTarget: 3,
    }),
  })
  const createdHabit = await createdHabitResponse.json()

  assert.equal(createdHabitResponse.status, 201)

  const date = '2026-06-15'
  const expectedMetricDate = '2026-06-15T00:00:00.000Z'
  const createMetricResponse = await app.request('/metrics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: setCookieHeader.split(';')[0],
    },
    body: JSON.stringify({
      habit_id: createdHabit.id,
      date,
      value: true,
    }),
  })
  const createMetricResponseBody = await createMetricResponse.json()

  assert.equal(createMetricResponse.status, 201)
  assert.deepEqual(createMetricResponseBody, {})

  const getMetricsResponse = await app.request('/metrics?start=2026-06-15&end=2026-06-16', {
    headers: { Cookie: setCookieHeader.split(';')[0] },
  })
  const metrics = await getMetricsResponse.json()

  assert.equal(getMetricsResponse.status, 200)
  assert.equal(metrics.length, 1)
  assert.equal(metrics[0].user_id, registeredUser.id)
  assert.equal(metrics[0].habit_id, createdHabit.id)
  assert.equal(metrics[0].date, expectedMetricDate)
  assert.equal(metrics[0].value, true)

  const [storedMetric] = await db`
    SELECT user_id, habit_id, date, value
    FROM metrics
    WHERE user_id = ${registeredUser.id}
      AND habit_id = ${createdHabit.id}
      AND date = ${date}
  `

  assert.equal(storedMetric.user_id, registeredUser.id)
  assert.equal(storedMetric.habit_id, createdHabit.id)
  assert.equal(storedMetric.value, true)
})

test('updates a metric value to false for the authenticated user habit', async () => {
  const email = 'remove-metric@example.com'
  const password = 'correct-horse-battery-staple'
  const registrationResponse = await app.request('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  assert.equal(registrationResponse.status, 201)

  const loginResponse = await app.request('/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const setCookieHeader = loginResponse.headers.get('Set-Cookie')

  assert.equal(loginResponse.status, 200)
  assert.ok(setCookieHeader)

  const createdHabitResponse = await app.request('/habits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: setCookieHeader.split(';')[0],
    },
    body: JSON.stringify({
      name: 'Read 20 minutes',
      color: '#DDEA7C',
      goalPeriod: 'week',
      goalTarget: 3,
    }),
  })
  const createdHabit = await createdHabitResponse.json()

  assert.equal(createdHabitResponse.status, 201)

  const date = '2026-06-15'
  const expectedMetricDate = '2026-06-15T00:00:00.000Z'
  const createMetricResponse = await app.request('/metrics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: setCookieHeader.split(';')[0],
    },
    body: JSON.stringify({
      habit_id: createdHabit.id,
      date,
      value: true,
    }),
  })

  assert.equal(createMetricResponse.status, 201)

  const removeMetricResponse = await app.request('/metrics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: setCookieHeader.split(';')[0],
    },
    body: JSON.stringify({
      habit_id: createdHabit.id,
      date,
      value: false,
    }),
  })
  const removeMetricResponseBody = await removeMetricResponse.json()

  assert.equal(removeMetricResponse.status, 201)
  assert.deepEqual(removeMetricResponseBody, {})

  const getMetricsResponse = await app.request('/metrics?start=2026-06-15&end=2026-06-16', {
    headers: { Cookie: setCookieHeader.split(';')[0] },
  })
  const metrics = await getMetricsResponse.json()

  assert.equal(getMetricsResponse.status, 200)
  assert.equal(metrics.length, 1)
  assert.equal(metrics[0].habit_id, createdHabit.id)
  assert.equal(metrics[0].date, expectedMetricDate)
  assert.equal(metrics[0].value, false)

  const storedMetrics = await db`
    SELECT id, value
    FROM metrics
    WHERE habit_id = ${createdHabit.id}
      AND date = ${date}
  `

  assert.equal(storedMetrics.length, 1)
  assert.equal(storedMetrics[0].value, false)
})

test('does not create a metric for another user habit', async () => {
  const firstUserEmail = 'first-metric-owner@example.com'
  const secondUserEmail = 'second-metric-owner@example.com'
  const password = 'correct-horse-battery-staple'

  const firstRegistrationResponse = await app.request('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: firstUserEmail, password }),
  })
  const firstUser = await firstRegistrationResponse.json()
  const secondRegistrationResponse = await app.request('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: secondUserEmail, password }),
  })

  assert.equal(firstRegistrationResponse.status, 201)
  assert.equal(secondRegistrationResponse.status, 201)

  const firstLoginResponse = await app.request('/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: firstUserEmail, password }),
  })
  const secondLoginResponse = await app.request('/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: secondUserEmail, password }),
  })
  const firstSetCookieHeader = firstLoginResponse.headers.get('Set-Cookie')
  const secondSetCookieHeader = secondLoginResponse.headers.get('Set-Cookie')

  assert.equal(firstLoginResponse.status, 200)
  assert.equal(secondLoginResponse.status, 200)
  assert.ok(firstSetCookieHeader)
  assert.ok(secondSetCookieHeader)

  const createdHabitResponse = await app.request('/habits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: secondSetCookieHeader.split(';')[0],
    },
    body: JSON.stringify({
      name: 'Second user habit',
      color: '#DDEA7C',
      goalPeriod: 'week',
      goalTarget: 3,
    }),
  })
  const createdHabit = await createdHabitResponse.json()

  assert.equal(createdHabitResponse.status, 201)

  const date = '2026-06-15'
  const createMetricResponse = await app.request('/metrics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: firstSetCookieHeader.split(';')[0],
    },
    body: JSON.stringify({
      habit_id: createdHabit.id,
      date,
      value: true,
    }),
  })

  assert.equal(createMetricResponse.status, 404)

  const storedMetrics = await db`
    SELECT id
    FROM metrics
    WHERE user_id = ${firstUser.id}
      AND habit_id = ${createdHabit.id}
      AND date = ${date}
  `

  assert.equal(storedMetrics.length, 0)
})
