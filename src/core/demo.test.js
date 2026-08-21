import { describe, it, expect } from 'vitest'
import { findSolution, buildDemoSteps } from '../core/demo.js'
import { OP_FNS } from '../core/merge.js'
import { hasFractionalStep } from '../core/solver.js'

function evalTree(t) {
  if (t.kind === 'num') return t.value
  const l = evalTree(t.left)
  const r = evalTree(t.right)
  return OP_FNS[t.op](l, r)
}
function opsOf(t) {
  if (t.kind === 'num') return []
  return [t.op, ...opsOf(t.left), ...opsOf(t.right)]
}
function isIntegerPath(t) {
  if (t.kind === 'num') return true
  const v = evalTree(t)
  if (v.d !== 1) return false
  return isIntegerPath(t.left) && isIntegerPath(t.right)
}

describe('demo 答案揭晓', () => {
  it('findSolution 三档返回满足约束的解', () => {
    const easy = findSolution([1, 2, 3, 4], 'easy')
    expect(easy).not.toBeNull()
    expect(evalTree(easy)).toEqual({ n: 24, d: 1 })
    for (const op of opsOf(easy)) expect(['+', '-', '*']).toContain(op)

    const med = findSolution([2, 3, 5, 6], 'medium')
    expect(med).not.toBeNull()
    expect(evalTree(med)).toEqual({ n: 24, d: 1 })
    expect(isIntegerPath(med)).toBe(true)

    const hard = findSolution([1, 3, 4, 6], 'hard')
    expect(hard).not.toBeNull()
    expect(evalTree(hard)).toEqual({ n: 24, d: 1 })
    expect(hasFractionalStep(hard)).toBe(true)
  })

  it('buildDemoSteps 生成 3 步且按后序可执行到 24', () => {
    const tree = findSolution([8, 3, 8, 3], 'hard')
    expect(tree).not.toBeNull()
    const steps = buildDemoSteps(tree)
    expect(steps.length).toBe(3)
    let values = [8, 3, 8, 3].map((n) => ({ n, d: 1 }))
    for (const s of steps) {
      const li = values.findIndex((v) => v.n === s.left.n && v.d === s.left.d)
      const ri = values.findIndex((v, i) => i !== li && v.n === s.right.n && v.d === s.right.d)
      expect(li).not.toBe(-1)
      expect(ri).not.toBe(-1)
      const merged = OP_FNS[s.op](values[li], values[ri])
      values = values.filter((_, i) => i !== li && i !== ri)
      values.push(merged)
    }
    expect(values.length).toBe(1)
    expect(values[0]).toEqual({ n: 24, d: 1 })
  })

  it('无解时 findSolution 返回 null', () => {
    expect(findSolution([1, 1, 1, 1], 'hard')).toBeNull()
  })
})
