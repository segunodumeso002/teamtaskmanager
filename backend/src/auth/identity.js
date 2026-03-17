import { HttpError } from '../http/errors.js'
import { verifyCognitoToken } from './cognitoJwt.js'

function getHeaderValue(headers, target) {
  if (!headers) return null

  const foundKey = Object.keys(headers).find(
    (key) => key.toLowerCase() === target.toLowerCase(),
  )

  return foundKey ? headers[foundKey] : null
}

function getBearerToken(event) {
  const header = getHeaderValue(event.headers, 'authorization')
  if (!header) return null

  const [scheme, token] = header.split(' ')
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    throw new HttpError(401, 'Invalid Authorization header format.')
  }

  return token.trim()
}

function parseDevToken(token) {
  const prefix = 'dev-token-'
  if (!token.startsWith(prefix)) {
    throw new HttpError(401, 'Invalid development token.')
  }

  return token.slice(prefix.length)
}

export async function resolveIdentity(event, config, repository) {
  const token = getBearerToken(event)
  if (!token) return null

  if (config.authMode === 'dev') {
    const userId = parseDevToken(token)
    const user = await repository.getUserById(userId)

    if (!user) {
      throw new HttpError(401, 'User not found for provided token.')
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      claims: null,
    }
  }

  if (config.authMode === 'cognito') {
    const claims = await verifyCognitoToken(token, config)
    const userId = claims.sub || claims['cognito:username'] || null
    const email = claims.email || null
    const groupRole = Array.isArray(claims['cognito:groups'])
      ? claims['cognito:groups'][0]
      : null
    const claimRole = claims['custom:role'] || groupRole || 'member'

    let user = null

    if (userId) {
      user = await repository.getUserById(userId)
    }

    if (!user && email) {
      user = await repository.getUserByEmail(email)
    }

    return {
      userId: user?.id ?? userId,
      email: user?.email ?? email,
      role: user?.role ?? claimRole,
      claims,
    }
  }

  throw new HttpError(500, `Unsupported AUTH_MODE '${config.authMode}'.`)
}
