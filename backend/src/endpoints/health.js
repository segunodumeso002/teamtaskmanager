import { getConfig } from '../config.js'
import { ok } from '../http/response.js'

export async function healthHandler() {
  const config = getConfig()

  return ok({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: {
      data: config.dataMode,
      auth: config.authMode,
    },
  })
}