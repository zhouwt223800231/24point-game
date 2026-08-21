import { describe, it, expect } from 'vitest'
import { rat, addRat, subRat, mulRat, divRat, formatRat, formatDecimal, toRat, ratEqInt } from '../core/rational.js'

describe('rational 有理数', () => {
  it('rat 约分与符号归一', () => {
    expect(rat(4, 8)).toEqual({ n: 1, d: 2 })
    expect(rat(2, -3)).toEqual({ n: -2, d: 3 })
    expect(rat(0, 5)).toEqual({ n: 0, d: 1 })
    expect(rat(5, 0)).toBeNull()
  })

  it('加减乘除', () => {
    expect(addRat(rat(1, 3), rat(1, 6))).toEqual({ n: 1, d: 2 })
    expect(subRat(rat(1, 2), rat(1, 3))).toEqual({ n: 1, d: 6 })
    expect(mulRat(rat(2, 3), rat(3, 4))).toEqual({ n: 1, d: 2 })
    expect(divRat(rat(8, 3), rat(1, 3))).toEqual({ n: 8, d: 1 })
    expect(divRat(rat(1, 2), rat(0, 1))).toBeNull()
  })

  it('formatRat 与 ratEqInt', () => {
    expect(formatRat(rat(8, 3))).toBe('8/3')
    expect(formatRat(rat(24, 1))).toBe('24')
    expect(ratEqInt(rat(24, 1), 24)).toBe(true)
    expect(ratEqInt(rat(24, 2), 24)).toBe(false)
  })
})
describe('rational 转换与小数显示', () => {
  it('toRat 支持 number / {n,d} / 字符串', () => {
    expect(toRat(5)).toEqual({ n: 5, d: 1 })
    expect(toRat({ n: 3, d: 4 })).toEqual({ n: 3, d: 4 })
    expect(toRat('8/3')).toEqual({ n: 8, d: 3 })
    expect(toRat('2')).toEqual({ n: 2, d: 1 })
    expect(toRat(null)).toBeNull()
  })

  it('formatDecimal', () => {
    expect(formatDecimal(rat(1, 2))).toBe('0.5')
    expect(formatDecimal(rat(3, 2))).toBe('1.5')
    expect(formatDecimal(rat(7, 2))).toBe('3.5')
  })
})

