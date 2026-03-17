import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { HttpError } from '../http/errors.js'
import { createId } from '../utils/id.js'
import { createDocumentClient } from './dynamoClient.js'

async function scanAll(client, tableName, options = {}) {
  const items = []
  let lastEvaluatedKey

  do {
    const response = await client.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: lastEvaluatedKey,
        ...options,
      }),
    )

    if (response.Items) {
      items.push(...response.Items)
    }

    lastEvaluatedKey = response.LastEvaluatedKey
  } while (lastEvaluatedKey)

  return items
}

function buildUpdateExpression(updates) {
  const fields = Object.entries(updates).filter(([, value]) => value !== undefined)

  if (fields.length === 0) {
    throw new HttpError(400, 'No update fields provided.')
  }

  const ExpressionAttributeNames = {}
  const ExpressionAttributeValues = {}
  const parts = []

  fields.forEach(([key, value], index) => {
    const nameToken = `#f${index}`
    const valueToken = `:v${index}`
    ExpressionAttributeNames[nameToken] = key
    ExpressionAttributeValues[valueToken] = value
    parts.push(`${nameToken} = ${valueToken}`)
  })

  return {
    UpdateExpression: `SET ${parts.join(', ')}`,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  }
}

export function createDynamoRepository(config) {
  const client = createDocumentClient(config.region)
  const { users, projects, projectMembers, tasks, comments } = config.tables

  return {
    getUserById: async (userId) => {
      const response = await client.send(
        new GetCommand({ TableName: users, Key: { id: userId } }),
      )
      return response.Item ?? null
    },

    getUserByEmail: async (email) => {
      const response = await client.send(
        new ScanCommand({
          TableName: users,
          FilterExpression: '#email = :email',
          ExpressionAttributeNames: { '#email': 'email' },
          ExpressionAttributeValues: { ':email': email },
          Limit: 1,
        }),
      )

      return response.Items?.[0] ?? null
    },

    getTaskById: async (taskId) => {
      const response = await client.send(
        new GetCommand({ TableName: tasks, Key: { id: taskId } }),
      )

      return response.Item ?? null
    },

    getCommentById: async (commentId) => {
      const response = await client.send(
        new GetCommand({ TableName: comments, Key: { id: commentId } }),
      )

      return response.Item ?? null
    },

    getBootstrapState: async () => {
      const [userItems, projectItems, taskItems, commentItems, membershipItems] =
        await Promise.all([
          scanAll(client, users),
          scanAll(client, projects),
          scanAll(client, tasks),
          scanAll(client, comments),
          scanAll(client, projectMembers),
        ])

      const membershipMap = new Map()
      for (const member of membershipItems) {
        const list = membershipMap.get(member.projectId) ?? []
        list.push({ userId: member.userId, role: member.role })
        membershipMap.set(member.projectId, list)
      }

      const hydratedProjects = projectItems.map((project) => ({
        ...project,
        members: membershipMap.get(project.id) ?? [],
      }))

      return {
        currentUserId: userItems[0]?.id ?? null,
        activeProjectId: hydratedProjects[0]?.id ?? null,
        users: userItems,
        projects: hydratedProjects,
        tasks: taskItems,
        comments: commentItems,
      }
    },

    login: async ({ userId, email }) => {
      let user = null

      if (userId) {
        const response = await client.send(
          new GetCommand({ TableName: users, Key: { id: userId } }),
        )
        user = response.Item ?? null
      }

      if (!user && email) {
        const response = await client.send(
          new ScanCommand({
            TableName: users,
            FilterExpression: '#email = :email',
            ExpressionAttributeNames: { '#email': 'email' },
            ExpressionAttributeValues: { ':email': email },
            Limit: 1,
          }),
        )
        user = response.Items?.[0] ?? null
      }

      if (!user) {
        return null
      }

      return {
        accessToken: `dev-token-${user.id}`,
        refreshToken: `dev-refresh-${user.id}`,
        user,
      }
    },

    createProject: async (payload) => {
      const project = {
        id: createId('p'),
        name: payload.name,
        description: payload.description ?? '',
        createdBy: payload.createdBy,
        createdAt: new Date().toISOString(),
      }

      await client.send(new PutCommand({ TableName: projects, Item: project }))

      const memberRecords = payload.memberIds.map((memberId) => ({
        projectId: project.id,
        userId: memberId,
        role: memberId === payload.createdBy ? 'manager' : 'member',
      }))

      await Promise.all(
        memberRecords.map((member) =>
          client.send(new PutCommand({ TableName: projectMembers, Item: member })),
        ),
      )

      return {
        ...project,
        members: memberRecords.map((member) => ({
          userId: member.userId,
          role: member.role,
        })),
      }
    },

    createUser: async (payload) => {
      const normalizedEmail = payload.email.trim().toLowerCase()

      const existingByEmail = await client.send(
        new ScanCommand({
          TableName: users,
          FilterExpression: '#email = :email',
          ExpressionAttributeNames: { '#email': 'email' },
          ExpressionAttributeValues: { ':email': normalizedEmail },
          Limit: 1,
        }),
      )

      if (existingByEmail.Items?.[0]) {
        throw new HttpError(409, 'A user with that email already exists.')
      }

      const user = {
        id: createId('u'),
        name: payload.name,
        email: normalizedEmail,
        role: payload.role,
      }

      await client.send(new PutCommand({ TableName: users, Item: user }))
      return user
    },

    updateUserRole: async (userId, role) => {
      try {
        const response = await client.send(
          new UpdateCommand({
            TableName: users,
            Key: { id: userId },
            UpdateExpression: 'SET #role = :role',
            ExpressionAttributeNames: {
              '#role': 'role',
            },
            ExpressionAttributeValues: {
              ':role': role,
            },
            ConditionExpression: 'attribute_exists(id)',
            ReturnValues: 'ALL_NEW',
          }),
        )

        return response.Attributes ?? null
      } catch (error) {
        if (error?.name === 'ConditionalCheckFailedException') {
          return null
        }

        throw error
      }
    },

    createTask: async (payload) => {
      const task = {
        id: createId('t'),
        createdAt: new Date().toISOString(),
        ...payload,
      }

      await client.send(new PutCommand({ TableName: tasks, Item: task }))
      return task
    },

    updateTask: async (taskId, updates) => {
      const expression = buildUpdateExpression(updates)

      try {
        const response = await client.send(
          new UpdateCommand({
            TableName: tasks,
            Key: { id: taskId },
            ...expression,
            ConditionExpression: 'attribute_exists(id)',
            ReturnValues: 'ALL_NEW',
          }),
        )

        return response.Attributes ?? null
      } catch (error) {
        if (error?.name === 'ConditionalCheckFailedException') {
          return null
        }
        throw error
      }
    },

    deleteTask: async (taskId) => {
      const task = await client.send(new GetCommand({ TableName: tasks, Key: { id: taskId } }))
      if (!task.Item) {
        return false
      }

      await client.send(new DeleteCommand({ TableName: tasks, Key: { id: taskId } }))

      const taskComments = await scanAll(client, comments, {
        FilterExpression: '#taskId = :taskId',
        ExpressionAttributeNames: { '#taskId': 'taskId' },
        ExpressionAttributeValues: { ':taskId': taskId },
      })

      await Promise.all(
        taskComments.map((comment) =>
          client.send(new DeleteCommand({ TableName: comments, Key: { id: comment.id } })),
        ),
      )

      return true
    },

    addComment: async (payload) => {
      const comment = {
        id: createId('c'),
        createdAt: new Date().toISOString(),
        ...payload,
      }

      await client.send(new PutCommand({ TableName: comments, Item: comment }))
      return comment
    },

    deleteComment: async (commentId) => {
      const existing = await client.send(
        new GetCommand({ TableName: comments, Key: { id: commentId } }),
      )

      if (!existing.Item) {
        return false
      }

      await client.send(new DeleteCommand({ TableName: comments, Key: { id: commentId } }))
      return true
    },
  }
}
