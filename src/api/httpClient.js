const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export function isApiConfigured() {
  return Boolean(API_BASE_URL)
}

export function getApiBaseUrl() {
  return API_BASE_URL ?? null
}

export async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw new ApiError('VITE_API_BASE_URL is not configured.', 0)
  }

  const token = localStorage.getItem('ttm_access_token')
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (error) {
    throw new ApiError(
      `Unable to reach API at ${API_BASE_URL}. Check backend server and VITE_API_BASE_URL.`,
      0,
      { cause: error?.message ?? 'network_error' },
    )
  }

  const responseText = await response.text()
  let responseData = null

  if (responseText) {
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { message: responseText }
    }
  }

  if (!response.ok) {
    throw new ApiError(
      responseData?.message ?? 'Request failed.',
      response.status,
      responseData,
    )
  }

  return responseData
}
