import { HttpError } from '../http/errors.js'
import { validateCreateComment } from '../validators/commentValidator.js'

export async function addComment(repository, payload, actor) {
  validateCreateComment(payload)

  if (!actor) {
    throw new HttpError(401, 'Authentication required.')
  }

  payload.authorId = actor.userId

  return repository.addComment(payload)
}

export async function deleteComment(repository, commentId, actor) {
  if (!actor) {
    throw new HttpError(401, 'Authentication required.')
  }

  const existing = await repository.getCommentById(commentId)
  if (!existing) {
    throw new HttpError(404, 'Comment not found.')
  }

  if (actor.role === 'member' && existing.authorId !== actor.userId) {
    throw new HttpError(403, 'Members can only delete comments they created.')
  }

  const deleted = await repository.deleteComment(commentId)
  if (!deleted) {
    throw new HttpError(404, 'Comment not found.')
  }
}
