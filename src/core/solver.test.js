import { describe, it, expect } from 'vitest'
import { hasSolution, findSolutions, makeHint, solveAll, hasFractionalStep } from '../core/solver.js'

const norm = (s) => s.replace(/\s+/g, '')

describe('solver 可解性判断', () => {
  it('1,3,4,6 → 24 可解，且包含 6/(1-3/4)', () => {
    expect(hasSolution([1, 3, 4, 6], 24)).toBe(true)
    const sols = findSolutions([1, 3, 4, 6], 24)
    expect(sols.length).toBeGreaterThan(0)
    expect(sols.some((s) => norm(s) === '6/(1-3/4)')).toBe(true)
  })

  it('8,3,8,3 → 24 可解，且包含 8/(3-8/3)', () => {
    expect(hasSolution([8, 3, 8, 3], 24)).toBe(true)
    const sols = findSolutions([8, 3, 8, 3], 24)
    expect(sols.some((s) => norm(s) === '8/(3-8/3)')).toBe(true)
  })

  it('3,3,8,8 → 24 可解', () => {
    expect(hasSolution([3, 3, 8, 8], 24)).toBe(true)
  })

  it('1,1,1,1 与 10,10,10,10 无解', () => {
    expect(hasSolution([1, 1, 1, 1], 24)).toBe(false)
    expect(hasSolution([10, 10, 10, 10], 24)).toBe(false)
  })

  it('目标 36：6,6,1,1 可解', () => {
    expect(hasSolution([6, 6, 1, 1], 36)).toBe(true)
  })

  it('目标 48：6,8,1,1 可解', () => {
    expect(hasSolution([6, 8, 1, 1], 48)).toBe(true)
  })

  it('同一手牌对不可达目标无解', () => {
    expect(hasSolution([1, 1, 1, 1], 36)).toBe(false)
    expect(hasSolution([6, 6, 1, 1], 24)).toBe(true)
  })
})

describe('solver 分数精度', () => {
  it('8/(3-8/3)=24 的表达式以精确字符串形式出现（无浮点误差）', () => {
    const { solutions } = solveAll([8, 3, 8, 3], 24)
    expect(solutions.some((s) => norm(s) === '8/(3-8/3)')).toBe(true)
  })

  it('返回的每个解都满足有理数等于目标', () => {
    const { solutions, full } = solveAll([1, 3, 4, 6], 24)
    expect(solutions.length).toBeGreaterThan(0)
    const targetEntries = full.filter((e) => e.v.n === 24 && e.v.d === 1)
    expect(targetEntries.length).toBeGreaterThan(0)
  })
})

describe('solver 提示', () => {
  it('可解手牌返回第一步线索，且不包含完整答案', () => {
    const h = makeHint([1, 3, 4, 6], 24)
    expect(h).not.toBeNull()
    expect(h.startsWith('First use')).toBe(true)
    expect(h).not.toContain('6 / (1 - 3 / 4)')
    expect(h).not.toContain('6/(1-3/4)')
  })

  it('无解手牌返回 null', () => {
    expect(makeHint([1, 1, 1, 1], 24)).toBeNull()
    expect(makeHint([10, 10, 10, 10], 24)).toBeNull()
  })
})
describe('solver 难度选项', () => {
  it('Easy：只用 +−× 可解，除法必需的手牌不可解', () => {
    expect(hasSolution([1, 2, 3, 4], 24, { allowOps: ['+', '-', '*'] })).toBe(true)
    expect(hasSolution([8, 3, 8, 3], 24, { allowOps: ['+', '-', '*'] })).toBe(false)
  })

  it('Medium：integerOnly 拒绝分数中间值', () => {
    expect(hasSolution([1, 2, 3, 4], 24, { integerOnly: true })).toBe(true)
    expect(hasSolution([8, 3, 8, 3], 24, { integerOnly: true })).toBe(false)
  })

  it('Hard：分数/小数牌可解', () => {
    const hand = [{ n: 1, d: 2 }, { n: 3, d: 2 }, 6, 8] // 0.5, 1.5, 6, 8
    expect(hasSolution(hand, 24)).toBe(true)
    expect(hasSolution(hand, 24, { integerOnly: true })).toBe(false)
  })

  it('hasFractionalStep：整数路径 false，分数路径 true', () => {
    const intTree = {
      kind: 'op',
      op: '*',
      v: { n: 24, d: 1 },
      left: { kind: 'num', value: { n: 4, d: 1 } },
      right: { kind: 'num', value: { n: 6, d: 1 } },
    }
    expect(hasFractionalStep(intTree)).toBe(false)
    const { full: f2 } = solveAll([8, 3, 8, 3], 24)
    expect(hasFractionalStep(f2.find((e) => e.v.n === 24 && e.v.d === 1).tree)).toBe(true)
  })
})

