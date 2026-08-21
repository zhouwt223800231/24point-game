import { describe, it, expect } from 'vitest'
import { makeOriginalCard, combine, isSolved, formatTree } from '../core/merge'

describe('merge 拖拽合成', () => {
  it('combine 生成合成卡', () => {
    const a = makeOriginalCard(8, 'a')
    const b = makeOriginalCard(3, 'b')
    const m = combine(a, b, '/')
    expect(m).not.toBeNull()
    expect(m.kind).toBe('merged')
    expect(m.value).toEqual({ n: 8, d: 3 })
  })

  it('分数路径 8 ÷ (3 − 8 ÷ 3) = 24', () => {
    const e1 = makeOriginalCard(8, 'a')
    const t1 = makeOriginalCard(3, 'b')
    const t2 = makeOriginalCard(3, 'c')
    const e2 = makeOriginalCard(8, 'd')
    const m1 = combine(e1, t1, '/') // 8/3
    const m2 = combine(t2, m1, '-') // 3 − 8/3 = 1/3
    const m3 = combine(e2, m2, '/') // 8 ÷ (1/3) = 24
    expect(m1.value).toEqual({ n: 8, d: 3 })
    expect(m2.value).toEqual({ n: 1, d: 3 })
    expect(m3.value).toEqual({ n: 24, d: 1 })
    expect(isSolved([m3], 24)).toBe(true)
  })

  it('交换顺序：3÷8 ≠ 8÷3', () => {
    const a = makeOriginalCard(3, 'a')
    const b = makeOriginalCard(8, 'b')
    expect(combine(a, b, '/').value).toEqual({ n: 3, d: 8 })
    expect(combine(b, a, '/').value).toEqual({ n: 8, d: 3 })
  })

  it('除零合并被拒绝（返回 null）', () => {
    const five = makeOriginalCard(5, 'a')
    const zero = combine(makeOriginalCard(3, 'b'), makeOriginalCard(3, 'c'), '-')
    expect(zero.value).toEqual({ n: 0, d: 1 })
    expect(combine(five, zero, '/')).toBeNull()
  })

  it('isSolved 仅当单卡且等于目标', () => {
    expect(isSolved([], 24)).toBe(false)
    expect(isSolved([makeOriginalCard(24, 'x')], 24)).toBe(true)
    expect(isSolved([makeOriginalCard(25, 'x')], 24)).toBe(false)
    expect(isSolved([makeOriginalCard(12, 'x'), makeOriginalCard(12, 'y')], 24)).toBe(false)
  })

  it('formatTree 括号最小化且正确', () => {
    const m1 = combine(makeOriginalCard(8, 'a'), makeOriginalCard(3, 'b'), '/')
    const m2 = combine(makeOriginalCard(3, 'c'), m1, '-')
    const m3 = combine(makeOriginalCard(8, 'd'), m2, '/')
    expect(formatTree(m3.tree)).toBe('8 / (3 - 8 / 3)')
    expect(formatTree(makeOriginalCard(24, 'x').tree)).toBe('24')
  })
})
