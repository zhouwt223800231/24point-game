import { describe, it, expect } from 'vitest'
import { isFractionRequired, constructiveCandidates, HARD_FALLBACK_POOL, makeHardHand } from '../core/hardhands.js'

describe('hardhands 必须分数步', () => {
  it('构造法候选全部通过谓词', () => {
    const cons = constructiveCandidates(24)
    expect(cons.length).toBeGreaterThan(0)
    for (const h of cons) expect(isFractionRequired(h, 24)).toBe(true)
  })

  it('兜底池每副可解且必须分数步', () => {
    expect(HARD_FALLBACK_POOL.length).toBeGreaterThan(0)
    for (const h of HARD_FALLBACK_POOL) expect(isFractionRequired(h, 24)).toBe(true)
  })

  it('makeHardHand 返回的手牌均通过谓词', () => {
    for (let i = 0; i < 20; i++) expect(isFractionRequired(makeHardHand(24), 24)).toBe(true)
  })
})
