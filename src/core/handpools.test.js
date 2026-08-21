import { describe, it, expect } from 'vitest'
import { EASY_POOL, MEDIUM_POOL, FRACTION_POOL, DIVISION_POOL, HARD_FRACTION_RATIO, dealHand } from '../core/handpools.js'
import { hasSolution } from '../core/solver.js'
import { isFractionRequired } from '../core/hardhands.js'

describe('handpools 已验证手牌池', () => {
  it('四池非空且数量正确', () => {
    expect(EASY_POOL.length).toBe(505)
    expect(MEDIUM_POOL.length).toBe(556)
    expect(FRACTION_POOL.length).toBe(10)
    expect(DIVISION_POOL.length).toBe(51)
  })

  it('easyPool 每副只用 +−× 可解', () => {
    for (const h of EASY_POOL) expect(hasSolution(h, 24, { allowOps: ['+', '-', '*'] })).toBe(true)
  })

  it('mediumPool 每副整数路径可解', () => {
    for (const h of MEDIUM_POOL) expect(hasSolution(h, 24, { integerOnly: true })).toBe(true)
  })

  it('fractionPool 每副必须分数步', () => {
    for (const h of FRACTION_POOL) expect(isFractionRequired(h, 24)).toBe(true)
  })

  it('divisionPool 每副整数路径可解且必须用除法', () => {
    for (const h of DIVISION_POOL) {
      expect(hasSolution(h, 24, { integerOnly: true })).toBe(true)
      expect(hasSolution(h, 24, { allowOps: ['+', '-', '*'] })).toBe(false)
    }
  })

  it('dealHand 三档各抽 100 次全部合法', () => {
    for (let i = 0; i < 100; i++) {
      expect(hasSolution(dealHand('easy'), 24, { allowOps: ['+', '-', '*'] })).toBe(true)
      expect(hasSolution(dealHand('medium'), 24, { integerOnly: true })).toBe(true)
      expect(hasSolution(dealHand('hard'), 24)).toBe(true)
    }
  })

  it('Hard 分数步占比约 75%（确定性 rand 与统计）', () => {
    expect(HARD_FRACTION_RATIO).toBe(0.75)
    expect(isFractionRequired(dealHand('hard', 24, () => 0.1))).toBe(true)
    expect(isFractionRequired(dealHand('hard', 24, () => 0.9))).toBe(false)
    let frac = 0
    const N = 300
    for (let i = 0; i < N; i++) {
      if (isFractionRequired(dealHand('hard'))) frac++
    }
    const ratio = frac / N
    expect(ratio).toBeGreaterThan(0.6)
    expect(ratio).toBeLessThan(0.9)
  })
})
