import { getConfig } from '../config.js'
import { HttpError } from '../http/errors.js'
import { createDynamoRepository } from './dynamoRepository.js'
import { inMemoryStore } from './inMemoryStore.js'

export function getRepository() {
  const config = getConfig()
  const { dataMode } = config

  if (dataMode === 'memory') return inMemoryStore
  if (dataMode === 'dynamo') return createDynamoRepository(config)

  throw new HttpError(500, `Unsupported DATA_MODE '${dataMode}'.`)
}
