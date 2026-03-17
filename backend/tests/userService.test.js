import assert from 'node:assert/strict'
import test from 'node:test'

import { HttpError } from '../src/http/errors.js'
import { createUser, updateUserRole } from '../src/services/userService.js'

test('createUser allows admin and normalizes email', async () => {
  const repository = {
    createUser: async (payload) => ({ id: 'u100', ...payload }),
  }

  const created = await createUser(
    repository,
    { name: 'Jane Doe', email: 'JANE@Example.COM', role: 'member' },
    { userId: 'u1', role: 'admin' },
  )

  assert.equal(created.id, 'u100')
  assert.equal(created.email, 'jane@example.com')
  assert.equal(created.role, 'member')
})

test('createUser rejects missing auth with 401', async () => {
  const repository = {
    createUser: async () => ({ id: 'u100' }),
  }

  await assert.rejects(
    createUser(repository, { name: 'Jane', email: 'jane@example.com', role: 'member' }, null),
    (error) => {
      assert.ok(error instanceof HttpError)
      assert.equal(error.statusCode, 401)
      return true
    },
  )
})

test('createUser rejects non-admin with 403', async () => {
  const repository = {
    createUser: async () => ({ id: 'u100' }),
  }

  await assert.rejects(
    createUser(
      repository,
      { name: 'Jane', email: 'jane@example.com', role: 'member' },
      { userId: 'u2', role: 'manager' },
    ),
    (error) => {
      assert.ok(error instanceof HttpError)
      assert.equal(error.statusCode, 403)
      return true
    },
  )
})

test('createUser surfaces duplicate email as 409', async () => {
  const repository = {
    createUser: async () => {
      throw new HttpError(409, 'A user with that email already exists.')
    },
  }

  await assert.rejects(
    createUser(
      repository,
      { name: 'Jane', email: 'jane@example.com', role: 'member' },
      { userId: 'u1', role: 'admin' },
    ),
    (error) => {
      assert.ok(error instanceof HttpError)
      assert.equal(error.statusCode, 409)
      return true
    },
  )
})

test('updateUserRole updates member to manager for admin actor', async () => {
  const repository = {
    getUserById: async () => ({ id: 'u3', role: 'member' }),
    updateUserRole: async (userId, role) => ({ id: userId, role }),
  }

  const updated = await updateUserRole(
    repository,
    'u3',
    { role: 'manager' },
    { userId: 'u1', role: 'admin' },
  )

  assert.equal(updated.id, 'u3')
  assert.equal(updated.role, 'manager')
})

test('updateUserRole rejects non-admin actor with 403', async () => {
  const repository = {
    getUserById: async () => ({ id: 'u3', role: 'member' }),
    updateUserRole: async () => ({ id: 'u3', role: 'manager' }),
  }

  await assert.rejects(
    updateUserRole(repository, 'u3', { role: 'manager' }, { userId: 'u2', role: 'manager' }),
    (error) => {
      assert.ok(error instanceof HttpError)
      assert.equal(error.statusCode, 403)
      return true
    },
  )
})
