import { describe, it, expect } from 'vitest'
import {
  makeOriginalCard,
  makeSingleGroup,
  makeStack,
  setOp,
  resolveValue,
  findNextPending,
  pendingCount,
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
  })
})

describe('merge 叠组惰性模型', () => {
  it('makeStack 合并 layers 并引用操作数组（后拖来的在上）', () => {
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

  it('setOp 按 top op bottom 固定顺序', () => {
    const a = makeSingleGroup(makeOriginalCard(8, 'a'))
    const b = makeSingleGroup(makeOriginalCard(3, 'b'))
    const s = makeStack(a, b, 's1') // top=3, bottom=8
    expect(setOp(s, '-').ok).toBe(true)
    expect(resolveValue(s)).toEqual({ n: -5, d: 1 }) // 3 − 8
    expect(setOp(s, '/').ok).toBe(true)
    expect(resolveValue(s)).toEqual({ n: 3, d: 8 }) // 3 / 8
  })

  it('setOp 全解决后可预览切换最外层', () => {
    const a = makeSingleGroup(makeOriginalCard(8, 'a'))
    const b = makeSingleGroup(makeOriginalCard(3, 'b'))
    const s = makeStack(a, b, 's1')
    setOp(s, '+')
    expect(resolveValue(s)).toEqual({ n: 11, d: 1 })
    setOp(s, '*')
    expect(resolveValue(s)).toEqual({ n: 24, d: 1 })
  })

  it('setOp 除零返回 { ok:false, reason:"div" } 并回滚', () => {
    const a = makeSingleGroup(makeOriginalCard(3, 'a'))
    const b = makeSingleGroup(makeOriginalCard(3, 'b'))
    const s = makeStack(a, b, 's1')
    setOp(s, '-') // 3 − 3 = 0
    const c = makeSingleGroup(makeOriginalCard(5, 'c'))
    const s2 = makeStack(s, c, 's2') // c(5) 在上，bottom=0
    const r = setOp(s2, '/') // 5 / 0
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('div')
    expect(s2.op).toBeNull()
    expect(resolveValue(s2)).toBeNull()
  })

  it('惰性嵌套：先解决内层，再解决外层', () => {
    const a = makeSingleGroup(makeOriginalCard(8, 'a'))
    const b = makeSingleGroup(makeOriginalCard(3, 'b'))
    const c = makeSingleGroup(makeOriginalCard(10, 'c'))
    const g1 = makeStack(a, b, 'g1') // pending (3 ? 8)
    const g2 = makeStack(c, g1, 'g2') // g1 在上，c 在下 → 外层 pending
    expect(pendingCount(g2)).toBe(2)
    // 第一次点击 → 解决内层 (3+8=11)，外层仍未决
    expect(setOp(g2, '+').ok).toBe(true)
    expect(pendingCount(g2)).toBe(1)
    expect(resolveValue(g2)).toBeNull()
    // 第二次点击 → 解决外层 (11 − 10 = 1)
    expect(setOp(g2, '-').ok).toBe(true)
    expect(resolveValue(g2)).toEqual({ n: 1, d: 1 })
    expect(pendingCount(g2)).toBe(0)
    expect(formatGroupTree(g2)).toBe('((3 + 8) - 10)')
  })

  it('groupIsSolved 仅当单叠且值等于目标', () => {
    expect(groupIsSolved([makeSingleGroup(makeOriginalCard(24, 'x'))], 24)).toBe(true)
    expect(groupIsSolved([makeSingleGroup(makeOriginalCard(25, 'x'))], 24)).toBe(false)
    const a = makeSingleGroup(makeOriginalCard(12, 'a'))
    const b = makeSingleGroup(makeOriginalCard(12, 'b'))
    expect(groupIsSolved([makeStack(a, b, 's')], 24)).toBe(false) // 未决
    setOp(makeStack(a, b, 's2'), '+')
  })

  it('formatGroupTree：未决显示 ?，已决带括号', () => {
    const a = makeSingleGroup(makeOriginalCard(8, 'a'))
    const b = makeSingleGroup(makeOriginalCard(3, 'b'))
    const s = makeStack(a, b, 's1')
    expect(formatGroupTree(s)).toBe('(3 ? 8)')
    setOp(s, '+')
    expect(formatGroupTree(s)).toBe('(3 + 8)')
    expect(formatGroupTree(a)).toBe('8')
  })
})

