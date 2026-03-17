import { createRemoteJWKSet, jwtVerify } from 'jose'
import { HttpError } from '../http/errors.js'

const jwksCache = new Map()

function getIssuer(region, userPoolId) {
  return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`
}

function getJwks(region, userPoolId) {
  const key = `${region}:${userPoolId}`
  if (!jwksCache.has(key)) {
    const issuer = getIssuer(region, userPoolId)
    jwksCache.set(key, createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`)))
  }

  return jwksCache.get(key)
}

export async function verifyCognitoToken(token, config) {
  if (!config.cognitoUserPoolId || !config.cognitoClientId) {
    throw new HttpError(500, 'Cognito auth is enabled but pool/client settings are missing.')
  }

  const issuer = getIssuer(config.region, config.cognitoUserPoolId)
  const JWKS = getJwks(config.region, config.cognitoUserPoolId)

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      audience: config.cognitoClientId,
    })

    return payload
  } catch {
    throw new HttpError(401, 'Invalid or expired authentication token.')
  }
}
