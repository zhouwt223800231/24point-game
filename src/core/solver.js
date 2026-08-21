// 24点求解器：子集 DP + 有理数四则运算。
// 支持任意目标值（24 / 36 / 48 / 随机），供发牌可解校验、提示生成使用。
import { rat, addRat, subRat, mulRat, divRat } from './rational.js'
import { formatTree } from './merge.js'

const OPS = [
  { sym: '+', fn: addRat },
  { sym: '-', fn: subRat },
  { sym: '*', fn: mulRat },
  { sym: '/', fn: divRat },
]

// 返回 { solutions: string[], full: [...] }，solutions 为去重后的中缀表达式
export function solveAll(numbers, target) {
  const n = numbers.length
  const size = 1 << n
  const dp = new Array(size).fill(null).map(() => [])

  for (let i = 0; i < n; i++) {
    dp[1 << i].push({
      v: rat(numbers[i]),
      tree: { kind: 'num', value: numbers[i] },
    })
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

export function hasSolution(numbers, target) {
  return solveAll(numbers, target).solutions.length > 0
}

export function findSolutions(numbers, target) {
  return solveAll(numbers, target).solutions
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
export function makeHint(numbers, target) {
  const { solutions, full } = solveAll(numbers, target)
  if (!solutions.length) return null
  const first = findFirstOp(full[0].tree)
  if (!first) return null
  const a = first.left.value
  const b = first.right.value
  const sym = OP_SYMBOL[first.op] || first.op
  const v = first.v
  const res = v.d === 1 ? String(v.n) : `${v.n}/${v.d}`
  return `First use ${a} ${sym} ${b} → ${res}`
}


