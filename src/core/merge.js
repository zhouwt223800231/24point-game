// 拖拽合成核心：卡片合并、可解判定、表达式树格式化（纯函数，UI 无关）。
import { rat, addRat, subRat, mulRat, divRat } from './rational.js'

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

// 表达式树 → 中缀字符串（括号最小化且正确）
export function formatTree(tree) {
  if (tree.kind === 'num') return String(tree.value)
  const left = formatTree(tree.left)
  const right = formatTree(tree.right)
  const ls = needParens(tree.left && tree.left.op, tree.op, false) ? `(${left})` : left
  const rs = needParens(tree.right && tree.right.op, tree.op, true) ? `(${right})` : right
  return `${ls} ${tree.op} ${rs}`
}

export const OP_FNS = { '+': addRat, '-': subRat, '*': mulRat, '/': divRat }

export function makeOriginalCard(value, id, extra = {}) {
  return { id, value: rat(value), tree: { kind: 'num', value }, kind: 'original', ...extra }
}

let seq = 0

// 合并两张卡：cardA op cardB，返回合成卡；除零/非法运算返回 null
export function combine(cardA, cardB, op, id) {
  const fn = OP_FNS[op]
  if (!fn) return null
  const v = fn(cardA.value, cardB.value)
  if (!v) return null
  return {
    id: id ?? `m${++seq}`,
    value: v,
    tree: { kind: 'op', op, left: cardA.tree, right: cardB.tree },
    kind: 'merged',
  }
}

// 是否已合并为单张且等于目标
export function isSolved(cards, target) {
  if (cards.length !== 1) return false
  const v = cards[0].value
  return v.n === target && v.d === 1
}

