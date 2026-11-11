import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { after, beforeEach } from 'node:test'
import postgres from 'postgres'

export async function createTestApplication() {
  const adminDatabaseUrl = process.env.TEST_ADMIN_DATABASE_URL

  if (!adminDatabaseUrl) {
    throw new Error('TEST_ADMIN_DATABASE_URL is required.')
  }

  const parsedAdminDatabaseUrl = new URL(adminDatabaseUrl)
  const supportedProtocols = ['postgres:', 'postgresql:']

  if (!supportedProtocols.includes(parsedAdminDatabaseUrl.protocol)) {
    throw new Error('TEST_ADMIN_DATABASE_URL must be a PostgreSQL URL.')
  }

  if (parsedAdminDatabaseUrl.pathname !== '/postgres') {
    throw new Error('TEST_ADMIN_DATABASE_URL must point to the postgres service database.')
  }

  const temporaryDatabaseName = `hibi_test_${process.pid}_${randomUUID().replaceAll('-', '')}`
  const temporaryDatabaseUrl = new URL(parsedAdminDatabaseUrl)
  temporaryDatabaseUrl.pathname = `/${temporaryDatabaseName}`

  const adminDatabase = postgres(adminDatabaseUrl, { max: 1 })
  let databaseCreated = false

  async function removeTemporaryDatabase() {
    await adminDatabase.unsafe(`DROP DATABASE IF EXISTS "${temporaryDatabaseName}" WITH (FORCE)`)
  }

  try {
    await adminDatabase.unsafe(`CREATE DATABASE "${temporaryDatabaseName}"`)
    databaseCreated = true

    const migrationResult = spawnSync(
      'dbmate',
      ['--env', 'DATABASE_URL', '--no-dump-schema', 'migrate'],
      {
        env: {
          ...process.env,
          DATABASE_URL: temporaryDatabaseUrl.href,
        },
        stdio: 'inherit',
      },
    )

    if (migrationResult.error) {
      throw new Error(`Could not run dbmate: ${migrationResult.error.message}`)
    }

    if (migrationResult.status !== 0) {
      throw new Error(
        `dbmate migration failed with exit code ${migrationResult.status ?? 'unknown'}.`,
      )
    }

    process.env.DATABASE_URL = temporaryDatabaseUrl.href
    process.env.JWT_SECRET = 'test-jwt-secret'
    process.env.CORS_ORIGIN = 'http://localhost:3000'

    const [{ app }, { db }] = await Promise.all([import('../src/app.ts'), import('../src/db.ts')])

    beforeEach(async () => {
      await db`TRUNCATE TABLE public.metrics, public.habits, public.users RESTART IDENTITY`
    })

    after(async () => {
      try {
        await db.end()
      } finally {
        try {
          await removeTemporaryDatabase()
        } finally {
          await adminDatabase.end()
        }
      }
    })

    return { app, db }
  } catch (error) {
    try {
      if (databaseCreated) {
        await removeTemporaryDatabase()
      }
    } finally {
      await adminDatabase.end()
    }

    throw error
  }
}
