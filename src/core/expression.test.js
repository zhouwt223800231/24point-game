import { describe, it, expect } from 'vitest'
import {
  evaluateExpression,
  parensValid,
  parensNeverNegative,
  isComplete,
  buildTokens,
} from '../core/expression'

const NONE = () => ({ open: [false, false, false, false], close: [false, false, false, false] })

describe('expression 求值', () => {
  it('运算符优先级：2+3*4+1 = 15', () => {
    const r = evaluateExpression([2, 3, 4, 1], ['+', '*', '+'], [false, false, false, false], [false, false, false, false])
    expect(r.ok).toBe(true)
    expect(r.value).toBe(15)
  })

  it('括号：8/(3-8/3) ≈ 24', () => {
    const r = evaluateExpression([8, 3, 8, 3], ['/', '-', '/'], [false, true, false, false], [false, false, false, true])
    expect(r.ok).toBe(true)
    expect(Math.abs(r.value - 24)).toBeLessThan(1e-9)
  })

  it('括号：(1+2+3)*4 = 24', () => {
    const r = evaluateExpression([1, 2, 3, 4], ['+', '+', '*'], [true, false, false, false], [false, false, true, false])
    expect(r.ok).toBe(true)
    expect(r.value).toBe(24)
  })

  it('除以 0 报错（不视为“不等于24”）', () => {
    const r = evaluateExpression([5, 2, 2, 1], ['/', '-', '+'], [false, true, false, false], [false, false, true, false])
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('div by zero')
  })

  it('未填满时返回 incomplete', () => {
    const r = evaluateExpression([2, 3, null, null], ['+', null, null], [false, false, false, false], [false, false, false, false])
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('incomplete')
  })

  it('括号不平衡返回 parens', () => {
    const r = evaluateExpression([1, 2, 3, 4], ['+', '+', '+'], [true, false, false, false], [false, false, false, false])
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('parens')
  })
})

describe('expression 括号校验', () => {
  it('未闭合的左括号：parensValid=false，parensNeverNegative=true', () => {
    expect(parensValid([true, false, false, false], [false, false, false, false])).toBe(false)
    expect(parensNeverNegative([true, false, false, false], [false, false, false, false])).toBe(true)
  })

  it('成对括号合法', () => {
    expect(parensValid([true, false, false, false], [true, false, false, false])).toBe(true)
    expect(parensValid([false, true, false, false], [false, false, false, true])).toBe(true)
  })

  it('孤立右括号非法（平衡为负）', () => {
    expect(parensNeverNegative([false, false, false, false], [false, true, false, false])).toBe(false)
  })
})

describe('expression 辅助函数', () => {
  it('isComplete 判断', () => {
    expect(isComplete([1, 2, 3, 4], ['+', '-', '*'])).toBe(true)
    expect(isComplete([1, 2, 3, null], ['+', '-', '*'])).toBe(false)
    expect(isComplete([1, 2, 3, 4], ['+', null, '*'])).toBe(false)
  })

  it('buildTokens 输出正确 token 序列', () => {
    expect(buildTokens([1, 2, 3, 4], ['+', '-', '*'], [false, false, false, false], [false, false, false, false])).toEqual([1, '+', 2, '-', 3, '*', 4])
    expect(buildTokens([8, 3, 8, 3], ['/', '-', '/'], [false, true, false, false], [false, false, false, true])).toEqual([8, '/', '(', 3, '-', 8, '/', 3, ')'])
  })
})
