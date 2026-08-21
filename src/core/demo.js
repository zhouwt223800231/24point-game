// 答案揭晓：按难度求正确解法树，并生成分步合并序列（后序 = 内层先，与叠牌/惰性解决顺序一致）。
import { solveAll, hasFractionalStep } from './solver.js'

const DIFF_OPTS = {
  easy: { allowOps: ['+', '-', '*'] },
  medium: { integerOnly: true },
  hard: {},
}

// 按难度返回解法树；无解返回 null
export function findSolution(hand, difficulty, target = 24) {
  const opts = DIFF_OPTS[difficulty] || {}
  const { full } = solveAll(hand, target, opts)
  let entry = full.find((e) => e.v.n === target && e.v.d === 1)
  if (difficulty === 'hard' && entry) {
    // 优先含分数/小数中间步的解
    const frac = full.find((e) => e.v.n === target && e.v.d === 1 && hasFractionalStep(e.tree))
    if (frac) entry = frac
  }
  return entry ? entry.tree : null
}

// 后序遍历解树 → 合并步骤（内层先），每步 { left(值), right(值), op }
export function buildDemoSteps(tree) {
  const steps = []
  function walk(node) {
    if (node.kind === 'num') return node.value
    const left = walk(node.left)
    const right = walk(node.right)
    steps.push({ left, right, op: node.op })
    return node.v
  }
  walk(tree)
  return steps
}
