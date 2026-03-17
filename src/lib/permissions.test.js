import assert from 'node:assert/strict'
import test from 'node:test'

import { canEditTask, isProjectManagerLike } from './permissions.js'

test('isProjectManagerLike allows admin and manager global roles', () => {
  assert.equal(isProjectManagerLike({ role: 'admin' }, null), true)
  assert.equal(isProjectManagerLike({ role: 'manager' }, null), true)
})

test('isProjectManagerLike allows project-level manager membership', () => {
  assert.equal(isProjectManagerLike({ role: 'member' }, 'manager'), true)
  assert.equal(isProjectManagerLike({ role: 'member' }, 'member'), false)
})

test('canEditTask allows admin/manager and task creator', () => {
  const task = { id: 't1', creatorId: 'u3' }

  assert.equal(canEditTask({ id: 'u1', role: 'admin' }, null, task), true)
  assert.equal(canEditTask({ id: 'u2', role: 'manager' }, null, task), true)
  assert.equal(canEditTask({ id: 'u3', role: 'member' }, null, task), true)
  assert.equal(canEditTask({ id: 'u4', role: 'member' }, null, task), false)
})
