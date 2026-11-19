import assert from 'node:assert/strict'
import test from 'node:test'
import { createTestApplication } from './support.ts'

const { app, db } = await createTestApplication()

async function registerAndLogin(email) {
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

  return { userId: registeredUser.id, cookie: setCookieHeader.split(';')[0] }
}

test('creates a habit for the authenticated user', async () => {
  const { userId, cookie } = await registerAndLogin('create-habit@example.com')
  const habitPayload = {
    name: 'Read 20 minutes',
    color: '#DDEA7C',
    goalPeriod: 'week',
    goalTarget: 3,
  }
  const habitResponse = await app.request('/habits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify(habitPayload),
  })
  const createdHabit = await habitResponse.json()

  assert.equal(habitResponse.status, 201)
  assert.ok(createdHabit.id)
  assert.equal(createdHabit.user_id, userId)
  assert.equal(createdHabit.active, true)
  assert.equal(createdHabit.name, habitPayload.name)
  assert.equal(createdHabit.color, habitPayload.color)
  assert.equal(createdHabit.goal_period, habitPayload.goalPeriod)
  assert.equal(createdHabit.goal_target, String(habitPayload.goalTarget))

  const [storedHabit] = await db`
    SELECT id, user_id, active, name, color, goal_period, goal_target
    FROM habits
    WHERE id = ${createdHabit.id}
  `

  assert.equal(storedHabit.user_id, userId)
  assert.equal(storedHabit.active, true)
  assert.equal(storedHabit.name, habitPayload.name)
  assert.equal(storedHabit.color, habitPayload.color)
  assert.equal(storedHabit.goal_period, habitPayload.goalPeriod)
  assert.equal(storedHabit.goal_target, String(habitPayload.goalTarget))
})

test('lists only habits that belong to the authenticated user', async () => {
  const { cookie: firstUserCookie } = await registerAndLogin('first-habits@example.com')
  const { cookie: secondUserCookie } = await registerAndLogin('second-habits@example.com')

  const firstHabitResponse = await app.request('/habits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: firstUserCookie,
    },
    body: JSON.stringify({
      name: 'First user habit',
      color: '#DDEA7C',
      goalPeriod: 'day',
      goalTarget: 1,
    }),
  })
  const firstHabit = await firstHabitResponse.json()

  const secondHabitResponse = await app.request('/habits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: secondUserCookie,
    },
    body: JSON.stringify({
      name: 'Second user habit',
      color: '#F2A9A0',
      goalPeriod: 'month',
      goalTarget: 10,
    }),
  })
  const secondHabit = await secondHabitResponse.json()

  assert.equal(firstHabitResponse.status, 201)
  assert.equal(secondHabitResponse.status, 201)

  const listResponse = await app.request('/habits', {
    headers: { Cookie: firstUserCookie },
  })
  const habits = await listResponse.json()

  assert.equal(listResponse.status, 200)
  assert.equal(habits.length, 1)
  assert.equal(habits[0].id, firstHabit.id)
  assert.equal(habits[0].name, 'First user habit')
  assert.equal(
    habits.some((habit) => habit.id === secondHabit.id),
    false,
  )
})

test('updates a habit for the authenticated user', async () => {
  const { userId, cookie } = await registerAndLogin('update-habit@example.com')

  const createdHabitResponse = await app.request('/habits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
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

  const updatedHabitPayload = {
    name: 'Read 30 minutes',
    color: '#F2A9A0',
    goalPeriod: 'month',
    goalTarget: 10,
  }
  const updatedHabitResponse = await app.request(`/habits/${createdHabit.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify(updatedHabitPayload),
  })
  const updatedHabit = await updatedHabitResponse.json()

  assert.equal(updatedHabitResponse.status, 200)
  assert.equal(updatedHabit.id, createdHabit.id)
  assert.equal(updatedHabit.user_id, createdHabit.user_id)
  assert.equal(updatedHabit.name, updatedHabitPayload.name)
  assert.equal(updatedHabit.color, updatedHabitPayload.color)
  assert.equal(updatedHabit.goal_period, updatedHabitPayload.goalPeriod)
  assert.equal(updatedHabit.goal_target, String(updatedHabitPayload.goalTarget))

  const [storedHabit] = await db`
    SELECT user_id, name, color, goal_period, goal_target
    FROM habits
    WHERE id = ${createdHabit.id}
  `

  assert.equal(storedHabit.user_id, userId)
  assert.equal(storedHabit.name, updatedHabitPayload.name)
  assert.equal(storedHabit.color, updatedHabitPayload.color)
  assert.equal(storedHabit.goal_period, updatedHabitPayload.goalPeriod)
  assert.equal(storedHabit.goal_target, String(updatedHabitPayload.goalTarget))
})

test('deletes a habit for the authenticated user', async () => {
  const { cookie } = await registerAndLogin('delete-habit@example.com')

  const createdHabitResponse = await app.request('/habits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
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

  const deletedHabitResponse = await app.request(`/habits/${createdHabit.id}`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  })
  const deletedHabit = await deletedHabitResponse.json()

  assert.equal(deletedHabitResponse.status, 200)
  assert.equal(deletedHabit.id, createdHabit.id)

  const listResponse = await app.request('/habits', {
    headers: { Cookie: cookie },
  })
  const habits = await listResponse.json()

  assert.equal(listResponse.status, 200)
  assert.equal(
    habits.some((habit) => habit.id === createdHabit.id),
    false,
  )

  const [storedHabit] = await db`
    SELECT id
    FROM habits
    WHERE id = ${createdHabit.id}
  `

  assert.equal(storedHabit, undefined)
})
