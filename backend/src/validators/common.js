import { HttpError } from '../http/errors.js'

export function assertRequired(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    throw new HttpError(400, `Field '${fieldName}' is required.`)
  }
}

export function assertArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new HttpError(400, `Field '${fieldName}' must be an array.`)
  }
}
