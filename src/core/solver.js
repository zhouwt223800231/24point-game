// 24点求解器：子集 DP + 有理数四则运算。
// 支持任意目标值（24 / 36 / 48 / 随机）与有理数（分数/小数）牌值；
// 可选约束：allowOps（可用运算符）、integerOnly（中间值必须为整数）。
import { rat, toRat, addRat, subRat, mulRat, divRat, formatRat } from './rational.js'
import { formatTree } from './merge.js'

const ALL_OPS = { '+': addRat, '-': subRat, '*': mulRat, '/': divRat }

// 返回 { solutions: string[], full: [...] }，solutions 为去重后的中缀表达式
export function solveAll(numbers, target, opts = {}) {
  const { allowOps = ['+', '-', '*', '/'], integerOnly = false } = opts
  const OPS = allowOps.map((sym) => ({ sym, fn: ALL_OPS[sym] }))
  const n = numbers.length
  const size = 1 << n
  const dp = new Array(size).fill(null).map(() => [])

  for (let i = 0; i < n; i++) {
    const v = toRat(numbers[i])
    if (!v) continue
    if (integerOnly && v.d !== 1) continue
    dp[1 << i].push({ v, tree: { kind: 'num', value: v } })
  }

  for (let mask = 1; mask < size; mask++) {
    if (dp[mask].length) continue
    const low = mask & -mask
    const seen = new Set()
    let sub = (mask - 1) & mask
    for (; sub > 0; sub = (sub - 1) & mask) {
      if (!(sub & low)) continue
      const other = mask ^ sub
      if (!other) continue
      const left = dp[sub]
      const right = dp[other]
      if (!left.length || !right.length) continue
      for (const a of left) {
        for (const b of right) {
          for (const { sym, fn } of OPS) {
            // 非交换运算（- 与 /）需要同时尝试两种操作数顺序
            for (const [x, y] of [
              [a, b],
              [b, a],
            ]) {
              const v = fn(x.v, y.v)
              if (!v) continue
              if (integerOnly && v.d !== 1) continue
              const key = `${v.n}/${v.d}`
              if (seen.has(key)) continue
              seen.add(key)
              dp[mask].push({
                v,
                tree: { kind: 'op', op: sym, left: x.tree, right: y.tree, v },
              })
            }
          }
        }
      }
    }
  }

  const full = dp[size - 1]
  const solutions = []
  const exprSet = new Set()
  for (const item of full) {
    if (item.v.n === target && item.v.d === 1) {
      const expr = formatTree(item.tree)
      if (!exprSet.has(expr)) {
        exprSet.add(expr)
        solutions.push(expr)
      }
    }
  }
  return { solutions, full }
}

export function hasSolution(numbers, target, opts) {
  return solveAll(numbers, target, opts).solutions.length > 0
}

export function findSolutions(numbers, target, opts) {
  return solveAll(numbers, target, opts).solutions
}

// 找出表达式树中“第一步”（两个原始数字直接运算）的节点
function findFirstOp(tree) {
  if (!tree || tree.kind === 'num') return null
  if (tree.left && tree.right && tree.left.kind === 'num' && tree.right.kind === 'num') {
    return tree
  }
  return findFirstOp(tree.left) || findFirstOp(tree.right)
}

const OP_SYMBOL = { '+': '+', '-': '−', '*': '×', '/': '÷' }

// 提示：只揭示第一步线索，不给出完整答案；无解返回 null
export function makeHint(numbers, target, opts) {
  const { solutions, full } = solveAll(numbers, target, opts)
  if (!solutions.length) return null
  const first = findFirstOp(full[0].tree)
  if (!first) return null
  const sym = OP_SYMBOL[first.op] || first.op
  return `First use ${formatRat(first.left.value)} ${sym} ${formatRat(first.right.value)} → ${formatRat(first.v)}`
}

// 解是否包含分数中间步骤（Hard 档要求）
export function hasFractionalStep(tree) {
  if (!tree || tree.kind === 'num') return false
  if (tree.v && tree.v.d > 1) return true
  return hasFractionalStep(tree.left) || hasFractionalStep(tree.right)
}
