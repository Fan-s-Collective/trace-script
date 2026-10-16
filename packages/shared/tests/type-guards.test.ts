import { describe, expect, it } from 'vitest'
import { isNumber } from '@/type-guards'

describe('isNumber', () => {
  it('accepts finite numbers and rejects non-numeric values', () => {
    expect(isNumber(42)).toBeTruthy()
    expect(isNumber(Number.NaN)).toBeFalsy()
    expect(isNumber(Number.POSITIVE_INFINITY)).toBeFalsy()
    expect(isNumber('42')).toBeFalsy()
  })
})
