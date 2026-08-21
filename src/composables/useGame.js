// 游戏状态机（V3 叠牌合成版）：发牌（保证可解）、拖牌叠放、运算符预览、自动结算、撤销、提示、计分、计时。
import { reactive } from 'vue'
import { hasSolution, makeHint, solveAll, hasFractionalStep } from '../core/solver.js'
import { makeOriginalCard, makeSingleGroup, makeStack, applyOp, groupIsSolved, formatGroupTree } from '../core/merge.js'
import { formatRat, formatDecimal, toRat } from '../core/rational.js'
import { getScoreBand, formatSeconds } from '../core/scoring.js'

const SUITS = [
  { sym: '♠', color: 'black' },
  { sym: '♥', color: 'red' },
  { sym: '♣', color: 'black' },
  { sym: '♦', color: 'red' },
]

// 三档难度：Easy=只用 +−×、Medium=四则但中间值整数、Hard=分数/小数混合牌且含分数中间步
const EASY_FALLBACK = [
  [1, 2, 3, 4],
  [1, 4, 5, 8],
  [2, 3, 4, 6],
  [3, 4, 6, 8],
]
const MEDIUM_FALLBACK = [
  [1, 2, 3, 4],
  [2, 3, 5, 6],
  [3, 5, 6, 8],
  [2, 3, 4, 6],
]
const HARD_FALLBACK = [
  [8, 3, 8, 3],
  [3, 3, 8, 8],
  [1, 3, 4, 6],
]
const HARD_POOL = [
  { n: 1, d: 1, display: '' }, { n: 2, d: 1, display: '' }, { n: 3, d: 1, display: '' },
  { n: 4, d: 1, display: '' }, { n: 5, d: 1, display: '' }, { n: 6, d: 1, display: '' },
  { n: 7, d: 1, display: '' }, { n: 8, d: 1, display: '' }, { n: 9, d: 1, display: '' },
  { n: 10, d: 1, display: '' },
  { n: 1, d: 2, display: 'dec' }, { n: 3, d: 2, display: 'dec' }, { n: 5, d: 2, display: 'dec' }, { n: 7, d: 2, display: 'dec' },
  { n: 1, d: 3, display: 'frac' }, { n: 2, d: 3, display: 'frac' },
  { n: 1, d: 4, display: 'frac' }, { n: 3, d: 4, display: 'frac' },
  { n: 4, d: 3, display: 'frac' }, { n: 5, d: 3, display: 'frac' },
  { n: 2, d: 5, display: 'frac' }, { n: 3, d: 5, display: 'frac' },
]

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

const toPick = (n) => ({ n, d: 1, display: '' })

// 按难度抽一副可解手牌（返回 {n,d,display} 数组）
function drawHand(difficulty, target) {
  if (difficulty === 'easy') {
    for (let i = 0; i < 20; i++) {
      const nums = [0, 1, 2, 3].map(() => randInt(1, 10))
      if (hasSolution(nums, target, { allowOps: ['+', '-', '*'] })) return nums.map(toPick)
    }
    return EASY_FALLBACK[randInt(0, EASY_FALLBACK.length - 1)].map(toPick)
  }
  if (difficulty === 'hard') {
    for (let i = 0; i < 20; i++) {
      const hand = [0, 1, 2, 3].map(() => HARD_POOL[randInt(0, HARD_POOL.length - 1)])
      const values = hand.map((p) => ({ n: p.n, d: p.d }))
      const { full } = solveAll(values, target)
      const ok = full.some((e) => e.v.n === target && e.v.d === 1 && hasFractionalStep(e.tree))
      if (ok) return hand.map((p) => ({ ...p }))
    }
    return HARD_FALLBACK[randInt(0, HARD_FALLBACK.length - 1)].map(toPick)
  }
  // medium
  for (let i = 0; i < 20; i++) {
    const nums = [0, 1, 2, 3].map(() => randInt(1, 10))
    if (hasSolution(nums, target, { integerOnly: true })) return nums.map(toPick)
  }
  return MEDIUM_FALLBACK[randInt(0, MEDIUM_FALLBACK.length - 1)].map(toPick)
}

function cloneTree(t) {
  if (t.kind === 'num') return { ...t }
  return { ...t, left: cloneTree(t.left), right: cloneTree(t.right) }
}

function cloneCard(c) {
  return { ...c, value: { ...c.value }, tree: cloneTree(c.tree) }
}

// 叠组深拷贝（撤销快照用）
function cloneGroup(g) {
  return {
    id: g.id,
    layers: g.layers.map(cloneCard),
    op: g.op,
    value: g.value ? { ...g.value } : null,
    tree: g.tree ? cloneTree(g.tree) : null,
    sub: g.sub
      ? {
          bottom: { value: { ...g.sub.bottom.value }, tree: cloneTree(g.sub.bottom.tree) },
          top: { value: { ...g.sub.top.value }, tree: cloneTree(g.sub.top.tree) },
        }
      : null,
  }
}

export function useGame() {
  const state = reactive({
    target: 24, // 阶段二/三从这里切换 36/48/随机
    difficulty: 'medium', // easy | medium | hard
    groups: [], // 牌桌上的叠组（4 → 1 叠）
    handValues: [], // 本局原始 4 个数值（提示用）
    activeGroupId: null, // 最近一次叠放、等待/允许选运算符的叠
    solved: 0,
    score: 0,
    roundStart: 0,
    lastRound: null, // 最近一次成功结算 { praise, points, time }
    elapsed: 0,
    hint: '',
    message: '',
    trace: '',
    fx: { type: '', active: false }, // success | error | invalid
    drag: null, // { sourceId, pointerId, offsetX, offsetY, ghostX, ghostY, hoverGroupId }
  })

  let history = [] // 叠牌快照栈（撤销）
  let timerId = null
  let messageTimer = null
  let fxTimer = null

  const findGroup = (id) => state.groups.find((g) => g.id === id)

  function flash(msg) {
    state.message = msg
    if (messageTimer) clearTimeout(messageTimer)
    messageTimer = setTimeout(() => {
      state.message = ''
    }, 1800)
  }

  function triggerFx(type, msg = '') {
    state.fx = { type, active: true }
    state.message = msg
    if (fxTimer) clearTimeout(fxTimer)
    fxTimer = setTimeout(() => {
      state.fx.active = false
    }, type === 'success' ? 1600 : 1200)
  }

  function updateTrace() {
    state.trace = state.groups.map(formatGroupTree).join('　·　')
  }

  function formatDraw(p) {
    const v = toRat(p)
    return p.display === 'dec' ? formatDecimal(v) : formatRat(v)
  }

  function deal() {
    const draw = drawHand(state.difficulty, state.target)
    state.handValues = draw.map((p) => toRat(p))
    state.groups = draw.map((p, i) => {
      const suit = SUITS[randInt(0, SUITS.length - 1)]
      return makeSingleGroup(makeOriginalCard(p, i, { suit: suit.sym, color: suit.color, display: p.display || '' }), i)
    })
    history = []
    state.roundStart = Date.now()
    state.lastRound = null
    state.activeGroupId = null
    state.hint = ''
    state.trace = draw.map(formatDraw).join(' · ')
    state.fx.active = false
    state.message = ''
    state.drag = null
  }

  function setDifficulty(d) {
    if (!['easy', 'medium', 'hard'].includes(d)) return
    state.difficulty = d
    deal()
  }

  function restart() {
    state.solved = 0
    state.score = 0
    state.elapsed = 0
    deal()
  }

  // ---- 拖拽（按叠组命中） ----
  function beginDrag(groupId, pointerId, offsetX, offsetY) {
    if (state.groups.length <= 1) return false
    const g = findGroup(groupId)
    if (!g) return false
    // 待选运算的叠（2 张以上且未选运算符）必须先选运算符才能继续参与合并
    if (g.layers.length >= 2 && !g.op) return false
    state.drag = { sourceId: groupId, pointerId, offsetX, offsetY, ghostX: 0, ghostY: 0, hoverGroupId: null, moved: false }
    return true
  }

  function moveDrag(x, y, hoverGroupId) {
    if (!state.drag) return
    state.drag.moved = true
    state.drag.ghostX = x - state.drag.offsetX
    state.drag.ghostY = y - state.drag.offsetY
    state.drag.hoverGroupId = hoverGroupId
  }

  function endDrag() {
    const d = state.drag
    if (!d) return
    state.drag = null
    if (d.hoverGroupId && d.hoverGroupId !== d.sourceId) {
      stackOnto(d.sourceId, d.hoverGroupId)
    }
  }

  // ---- 叠牌 ----
  function stackOnto(sourceId, targetId) {
    const src = findGroup(sourceId)
    const dst = findGroup(targetId)
    if (!src || !dst) return
    if (src.layers.length >= 2 && !src.op) return
    if (dst.layers.length >= 2 && !dst.op) return
    history.push({ groups: state.groups.map(cloneGroup), activeGroupId: state.activeGroupId })
    // 后拖来的（source）叠到目标（target）上面
    const stacked = makeStack(dst, src)
    state.groups = state.groups.filter((g) => g.id !== sourceId).map((g) => (g.id === targetId ? stacked : g))
    state.activeGroupId = stacked.id
    state.hint = ''
    state.message = ''
    updateTrace()
  }

  // ---- 运算符（可切换预览） ----
  function setOp(op) {
    if (state.fx.active && state.fx.type === 'success') return
    const id = state.activeGroupId
    if (id == null) return
    const g = findGroup(id)
    if (!g || !g.sub) return
    const updated = applyOp(g, op)
    if (!updated) {
      flash('Cannot divide by 0 — try another operation')
      return
    }
    state.groups = state.groups.map((x) => (x.id === id ? updated : x))
    updateTrace()
    afterOp()
  }

  function afterOp() {
    if (groupIsSolved(state.groups, state.target)) {
      const seconds = (Date.now() - state.roundStart) / 1000
      const band = getScoreBand(seconds, state.difficulty)
      state.score += band.points
      state.solved++
      state.lastRound = { praise: band.praise, points: band.points, time: formatSeconds(seconds) }
      triggerFx('success', '')
      // 结算动效结束后自动发下一副牌
      setTimeout(() => deal(), 1600)
    } else if (state.groups.length === 1) {
      const v = state.groups[0].value
      if (v) flash(`Result ${formatRat(v)} ≠ ${state.target} — keep adjusting`)
    }
  }

  function undo() {
    if (!history.length) {
      flash('Nothing to undo')
      return
    }
    const prev = history.pop()
    state.groups = prev.groups
    state.activeGroupId = prev.activeGroupId
    state.fx.active = false
    state.message = ''
    updateTrace()
  }

  function hint() {
    const h = makeHint(state.handValues, state.target)
    if (h) {
      state.hint = h
    } else {
      state.hint = ''
      flash('This hand seems impossible — dealing a new one')
      setTimeout(deal, 800)
    }
  }

  function startTimer() {
    if (timerId != null) return
    timerId = setInterval(() => {
      state.elapsed++
    }, 1000)
  }

  function stopTimer() {
    if (timerId != null) {
      clearInterval(timerId)
      timerId = null
    }
  }

  // 首次发牌
  deal()

  return {
    state,
    deal,
    restart,
    setDifficulty,
    beginDrag,
    moveDrag,
    endDrag,
    stackOnto,
    setOp,
    undo,
    hint,
    startTimer,
    stopTimer,
  }
}




