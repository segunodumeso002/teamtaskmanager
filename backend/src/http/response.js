import { HttpError } from './errors.js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PATCH,DELETE',
}

export function ok(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
}

export function noContent() {
  return {
    statusCode: 204,
    headers: CORS_HEADERS,
    body: '',
  }
}

export function errorResponse(error) {
  if (error instanceof HttpError) {
    return ok(
      {
        message: error.message,
        details: error.details,
      },
      error.statusCode,
    )
  }

  return ok(
    {
      message: 'Internal server error.',
    },
    500,
  )
}

export function options() {
  return {
    statusCode: 204,
    headers: CORS_HEADERS,
    body: '',
  }
}
