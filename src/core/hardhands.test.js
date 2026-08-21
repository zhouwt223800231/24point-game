import { describe, it, expect } from 'vitest'
import { isFractionRequired } from '../core/hardhands.js'

describe('hardhands 必须分数步判定', () => {
  it('已知分数步手牌为 true', () => {
    expect(isFractionRequired([1, 3, 4, 6])).toBe(true)
    expect(isFractionRequired([3, 3, 8, 8])).toBe(true)
    expect(isFractionRequired([1, 5, 5, 5])).toBe(true)
    expect(isFractionRequired([4, 4, 7, 7])).toBe(true)
  })

  it('整数路径手牌为 false', () => {
    expect(isFractionRequired([1, 2, 3, 4])).toBe(false)
    expect(isFractionRequired([2, 3, 5, 6])).toBe(false)
  })
})
