import { noContent, ok } from '../http/response.js'
import { addComment, deleteComment } from '../services/commentService.js'

export async function addCommentHandler({ repository, body, params, identity }) {
  const comment = await addComment(repository, {
    ...body,
    taskId: params.taskId,
  }, identity)

  return ok(comment, 201)
}

export async function deleteCommentHandler({ repository, params, identity }) {
  await deleteComment(repository, params.commentId, identity)
  return noContent()
}
