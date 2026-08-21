// 24点求解器：子集 DP + 有理数（分数）四则运算，避免浮点误差。
// 支持任意目标值（24 / 36 / 48 / 随机），供发牌可解校验、提示生成使用。

function gcd(a, b) {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    const t = a % b
    a = b
    b = t
  }
  return a || 1
}

// 有理数：{ n: 分子, d: 分母 }，始终 d > 0 且已约分
function rat(n, d = 1) {
  if (d === 0) return null
  if (d < 0) {
    n = -n
    d = -d
  }
  const g = gcd(n, d)
  return { n: n / g, d: d / g }
}

const add = (a, b) => rat(a.n * b.d + b.n * a.d, a.d * b.d)
const sub = (a, b) => rat(a.n * b.d - b.n * a.d, a.d * b.d)
const mul = (a, b) => rat(a.n * b.n, a.d * b.d)
const div = (a, b) => (b.n === 0 ? null : rat(a.n * b.d, a.d * b.n))

const OPS = [
  { sym: '+', fn: add },
  { sym: '-', fn: sub },
  { sym: '*', fn: mul },
  { sym: '/', fn: div },
]

const PREC = { '+': 1, '-': 1, '*': 2, '/': 2 }

function needParens(childOp, parentOp, isRight) {
  if (!childOp) return false
  const cp = PREC[childOp]
  const pp = PREC[parentOp]
  if (cp < pp) return true
  if (cp > pp) return false
  // 相同优先级：加/乘左右都无需括号；减/除仅右侧需要
  if (parentOp === '+' || parentOp === '*') return false
  if (!isRight) return false
  return true
}

export function formatTree(tree) {
  if (tree.kind === 'num') return String(tree.value)
  const left = formatTree(tree.left)
  const right = formatTree(tree.right)
  const ls = needParens(tree.left && tree.left.op, tree.op, false) ? `(${left})` : left
  const rs = needParens(tree.right && tree.right.op, tree.op, true) ? `(${right})` : right
  return `${ls} ${tree.op} ${rs}`
}

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

const OP_LABEL = { '+': '加', '-': '减', '*': '乘', '/': '除' }

// 提示：只揭示第一步线索，不给出完整答案；无解返回 null
export function makeHint(numbers, target) {
  const { solutions, full } = solveAll(numbers, target)
  if (!solutions.length) return null
  const first = findFirstOp(full[0].tree)
  if (!first) return null
  const a = first.left.value
  const b = first.right.value
  const label = OP_LABEL[first.op] || first.op
  const v = first.v
  const res = v.d === 1 ? String(v.n) : `${v.n}/${v.d}`
  return `先用 ${a} 和 ${b} ${label}，得到 ${res}`
}
