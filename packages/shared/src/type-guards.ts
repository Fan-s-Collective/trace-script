/** Return true when a value is a string. */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/** Return true when a value is a finite number. */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Return true for non-null objects, including arrays. */
export function isObject(value: unknown): value is object {
  return value !== null && typeof value === 'object'
}

/** Return true when a value is an array. */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/** Return true when a value is undefined. */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined
}
