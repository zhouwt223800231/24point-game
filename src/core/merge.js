// 叠牌合成核心：卡片/叠组模型、合并、运算、结算判定、表达式树格式化（纯函数，UI 无关）。
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

// ============ 叠组（stack）模型 ============
// group: { id, layers(自下而上), op, value, tree, sub }
// sub: { bottom:{value,tree}, top:{value,tree} } —— 叠放瞬间双方快照
// 固定运算顺序：上面的牌（后拖来的）op 下面的牌（目标）

export function makeSingleGroup(card, id) {
  return { id, layers: [card], op: null, value: card.value, tree: card.tree, sub: null }
}

export function makeStack(bottomGroup, topGroup, id) {
  return {
    id: id ?? `s${++seq}`,
    layers: [...bottomGroup.layers, ...topGroup.layers],
    op: null,
    value: null,
    tree: null,
    sub: {
      bottom: { value: bottomGroup.value, tree: bottomGroup.tree },
      top: { value: topGroup.value, tree: topGroup.tree },
    },
  }
}

// 应用/切换运算符：top op bottom；除零/树缺失（待选运算的叠被嵌套）返回 null
export function applyOp(group, op) {
  if (!group.sub) return null
  const { bottom, top } = group.sub
  if (!bottom.tree || !top.tree || !bottom.value || !top.value) return null
  const merged = combine(top, bottom, op)
  if (!merged) return null
  return { ...group, op, value: merged.value, tree: merged.tree }
}

// 是否已合成单叠且等于目标
export function groupIsSolved(groups, target) {
  if (groups.length !== 1) return false
  const g = groups[0]
  if (!g.value) return false
  return g.value.n === target && g.value.d === 1
}

// 叠组 → 中缀表达式（未选运算时显示 顶层 ? 底层）
export function formatGroupTree(group) {
  if (group.tree) return formatTree(group.tree)
  if (group.layers.length === 1) return formatTree(group.layers[0].tree)
  const top = group.sub && group.sub.top
  const bottom = group.sub && group.sub.bottom
  return `${top ? formatTree(top.tree) : '?'} ? ${bottom ? formatTree(bottom.tree) : '?'}`
}

