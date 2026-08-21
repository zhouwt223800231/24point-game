import { describe, it, expect } from 'vitest'
import {
  makeOriginalCard,
  makeSingleGroup,
  makeStack,
  applyOp,
  groupIsSolved,
  formatGroupTree,
  combine,
} from '../core/merge.js'

describe('merge 卡片合并', () => {
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
    const m1 = combine(e1, t1, '/')
    const m2 = combine(t2, m1, '-')
    const m3 = combine(e2, m2, '/')
    expect(m2.value).toEqual({ n: 1, d: 3 })
    expect(m3.value).toEqual({ n: 24, d: 1 })
    expect(groupIsSolved([makeSingleGroup(m3)], 24)).toBe(true)
  })
})

describe('merge 叠组模型', () => {
  it('makeStack 合并 layers 并捕获 sub（后拖来的在上）', () => {
    const a = makeSingleGroup(makeOriginalCard(8, 'a'))
    const b = makeSingleGroup(makeOriginalCard(3, 'b'))
    const s = makeStack(a, b, 's1') // b 拖到 a 上 → b 在上
    expect(s.layers.length).toBe(2)
    expect(s.layers[0].id).toBe('a')
    expect(s.layers[1].id).toBe('b')
    expect(s.op).toBeNull()
    expect(s.sub.bottom.value).toEqual({ n: 8, d: 1 })
    expect(s.sub.top.value).toEqual({ n: 3, d: 1 })
  })

  it('applyOp 按 top op bottom 固定顺序', () => {
    const a = makeSingleGroup(makeOriginalCard(8, 'a'))
    const b = makeSingleGroup(makeOriginalCard(3, 'b'))
    const s = makeStack(a, b, 's1') // top=3, bottom=8
    const r1 = applyOp(s, '-') // 3 − 8 = -5
    expect(r1.value).toEqual({ n: -5, d: 1 })
    const r2 = applyOp(s, '/') // 3 / 8
    expect(r2.value).toEqual({ n: 3, d: 8 })
    expect(r2.tree.left.kind).toBe('num')
    expect(r2.tree.right.kind).toBe('num')
  })

  it('applyOp 可切换运算符（预览）', () => {
    const a = makeSingleGroup(makeOriginalCard(8, 'a'))
    const b = makeSingleGroup(makeOriginalCard(3, 'b'))
    const s = makeStack(a, b, 's1')
    const plus = applyOp(s, '+') // 11
    const mul = applyOp(s, '*') // 24
    expect(plus.value).toEqual({ n: 11, d: 1 })
    expect(mul.value).toEqual({ n: 24, d: 1 })
  })

  it('applyOp 除零返回 null', () => {
    const a = makeSingleGroup(makeOriginalCard(3, 'a'))
    const b = makeSingleGroup(makeOriginalCard(3, 'b'))
    const s = makeStack(a, b, 's1')
    const zero = applyOp(s, '-') // 3 − 3 = 0
    expect(zero.value).toEqual({ n: 0, d: 1 })
    const c = makeSingleGroup(makeOriginalCard(5, 'c'))
    const s2 = makeStack(zero, c, 's2') // c(5) 在上
    const r = applyOp(s2, '/') // 5 / 0
    expect(r).toBeNull()
  })

  it('三层叠放 value/tree 正确', () => {
    const a = makeSingleGroup(makeOriginalCard(8, 'a'))
    const b = makeSingleGroup(makeOriginalCard(3, 'b'))
    const s1 = makeStack(a, b, 's1')
    const s1r = applyOp(s1, '/') // 3 / 8
    const c = makeSingleGroup(makeOriginalCard(4, 'c'))
    const s2 = makeStack(s1r, c, 's2') // c(4) 在上
    const s2r = applyOp(s2, '/') // 4 ÷ (3/8) = 32/3
    expect(s2r.value).toEqual({ n: 32, d: 3 })
    expect(formatGroupTree(s2r)).toBe('4 / (3 / 8)')
  })

  it('groupIsSolved 仅当单叠且等于目标', () => {
    expect(groupIsSolved([makeSingleGroup(makeOriginalCard(24, 'x'))], 24)).toBe(true)
    expect(groupIsSolved([makeSingleGroup(makeOriginalCard(25, 'x'))], 24)).toBe(false)
    expect(groupIsSolved([makeSingleGroup(makeOriginalCard(12, 'x')), makeSingleGroup(makeOriginalCard(12, 'y'))], 24)).toBe(false)
  })

  it('formatGroupTree 未选运算显示 ?', () => {
    const a = makeSingleGroup(makeOriginalCard(8, 'a'))
    const b = makeSingleGroup(makeOriginalCard(3, 'b'))
    const s = makeStack(a, b, 's1')
    expect(formatGroupTree(s)).toBe('3 ? 8')
    expect(formatGroupTree(a)).toBe('8')
  })
})

