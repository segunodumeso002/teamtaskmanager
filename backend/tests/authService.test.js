import assert from 'node:assert/strict'
import test from 'node:test'

import { HttpError } from '../src/http/errors.js'
import { login } from '../src/services/authService.js'

test('login returns session for valid payload', async () => {
  const repository = {
    login: async () => ({
      accessToken: 'dev-token-u1',
      refreshToken: 'dev-refresh-u1',
      user: { id: 'u1', name: 'Admin', role: 'admin' },
    }),
  }

  const result = await login(repository, { userId: 'u1' })
  assert.equal(result.user.id, 'u1')
  assert.equal(result.accessToken, 'dev-token-u1')
})

test('login throws 401 for invalid credentials', async () => {
  const repository = {
    login: async () => null,
  }

  await assert.rejects(
    login(repository, { userId: 'missing-user' }),
    (error) => {
      assert.ok(error instanceof HttpError)
      assert.equal(error.statusCode, 401)
      return true
    },
  )
})
