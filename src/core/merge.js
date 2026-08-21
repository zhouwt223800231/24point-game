// 叠牌合成核心：卡片/叠组模型、合并、惰性运算、结算判定、表达式格式化（纯函数，UI 无关）。
// 惰性模型：叠组可嵌套“待决合并”（op=null），运算符按“先内层后外层”逐步解决。
import { rat, toRat, formatRat, addRat, subRat, mulRat, divRat } from './rational.js'

const PREC = { '+': 1, '-': 1, '*': 2, '/': 2 }

function needParens(childOp, parentOp, isRight) {
  if (!childOp) return false
  const cp = PREC[childOp]
  const pp = PREC[parentOp]
  if (cp < pp) return true
  if (cp > pp) return false
  if (parentOp === '+' || parentOp === '*') return false
  if (!isRight) return false
  return true
}

// 表达式树 → 中缀字符串（括号最小化且正确；叶节点为有理数）
export function formatTree(tree) {
  if (tree.kind === 'num') return formatRat(tree.value)
  const left = formatTree(tree.left)
  const right = formatTree(tree.right)
  const ls = needParens(tree.left && tree.left.op, tree.op, false) ? `(${left})` : left
  const rs = needParens(tree.right && tree.right.op, tree.op, true) ? `(${right})` : right
  return `${ls} ${tree.op} ${rs}`
}

export const OP_FNS = { '+': addRat, '-': subRat, '*': mulRat, '/': divRat }

export function makeOriginalCard(value, id, extra = {}) {
  const v = toRat(value)
  return { id, value: v, tree: { kind: 'num', value: v }, kind: 'original', ...extra }
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
// sub: { bottom: <叠组>, top: <叠组> } —— 操作数叠组引用（可嵌套待决）
// 固定运算顺序：上面的牌（后拖来的）op 下面的牌（目标）

export function makeSingleGroup(card, id) {
  return { id, layers: [card], op: null, value: card.value, tree: card.tree, sub: null }
}

function cloneTree(t) {
  if (t.kind === 'num') return { ...t }
  return { ...t, left: cloneTree(t.left), right: cloneTree(t.right) }
}

// 深拷贝叠组为普通对象（避免在响应式 state 中共享响应式代理导致递归）
function cloneGroupNode(g) {
  return {
    id: g.id,
    layers: g.layers.map((c) => ({ ...c, value: { ...c.value }, tree: c.tree ? cloneTree(c.tree) : null })),
    op: g.op,
    value: g.value ? { ...g.value } : null,
    tree: g.tree ? cloneTree(g.tree) : null,
    sub: g.sub ? { bottom: cloneGroupNode(g.sub.bottom), top: cloneGroupNode(g.sub.top) } : null,
  }
}

export function makeStack(bottomGroup, topGroup, id) {
  return {
    id: id ?? `s${++seq}`,
    layers: [...bottomGroup.layers, ...topGroup.layers],
    op: null,
    value: null,
    tree: null,
    sub: { bottom: cloneGroupNode(bottomGroup), top: cloneGroupNode(topGroup) },
  }
}

// 递归求值：存在未决 op 或除零返回 null
export function resolveValue(g) {
  if (!g.sub) return g.value
  if (!g.op) return null
  const top = resolveValue(g.sub.top)
  const bottom = resolveValue(g.sub.bottom)
  if (top == null || bottom == null) return null
  const fn = OP_FNS[g.op]
  return fn ? fn(top, bottom) : null
}

// 子树中是否还有未决合并
function hasPendingBelow(g) {
  if (!g.sub) return false
  if (!g.op) return true
  return hasPendingBelow(g.sub.top) || hasPendingBelow(g.sub.bottom)
}

// 找最深层（最早创建）的待决合并；无待决时返回自身（供预览换运算）
export function findNextPending(g) {
  if (!g.sub) return null
  const deep = findNextPending(g.sub.top) || findNextPending(g.sub.bottom)
  if (deep) return deep
  return g.op ? null : g
}

// 待决合并数量
export function pendingCount(g) {
  if (!g.sub) return 0
  return pendingCount(g.sub.top) + pendingCount(g.sub.bottom) + (g.op ? 0 : 1)
}

// 设置/切换运算符（惰性）：先解决最内层待决，全解决后可直接切换最外层预览
export function setOp(group, op) {
  let target = findNextPending(group)
  if (!target && group.sub) target = group // 已全部解决 → 预览切换最外层
  if (!target) return { ok: false, reason: 'none' }
  target.op = op
  const v = resolveValue(target)
  if (v == null && !hasPendingBelow(target)) {
    target.op = null
    return { ok: false, reason: 'div' }
  }
  target.value = v
  group.value = resolveValue(group)
  return { ok: true }
}

// 是否已合成单叠且等于目标
export function groupIsSolved(groups, target) {
  if (groups.length !== 1) return false
  const v = resolveValue(groups[0])
  if (!v) return false
  return v.n === target && v.d === 1
}

// 叠组 → 中缀表达式（未决合并显示 ?）
export function formatGroupTree(g) {
  if (!g.sub) return formatRat(g.value)
  const top = formatGroupTree(g.sub.top)
  const bottom = formatGroupTree(g.sub.bottom)
  const op = g.op || '?'
  return `(${top} ${op} ${bottom})`
}

