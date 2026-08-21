// 游戏状态机（V3 叠牌合成版）：发牌（保证可解）、拖牌叠放、运算符预览、自动结算、撤销、提示、计分、计时。
import { reactive } from 'vue'
import { hasSolution, makeHint } from '../core/solver.js'
import { makeOriginalCard, makeSingleGroup, makeStack, applyOp, groupIsSolved, formatGroupTree } from '../core/merge.js'
import { formatRat } from '../core/rational.js'

const SUITS = [
  { sym: '♠', color: 'black' },
  { sym: '♥', color: 'red' },
  { sym: '♣', color: 'black' },
  { sym: '♦', color: 'red' },
]

// 兜底：随机重抽 10 次仍无解时，从这些已知可解手牌中选一副
const FALLBACK_HANDS = [
  [1, 2, 3, 4],
  [1, 3, 4, 6],
  [8, 3, 8, 3],
  [3, 3, 8, 8],
  [2, 3, 5, 6],
  [1, 5, 5, 5],
]

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function dealSolvable(target) {
  for (let i = 0; i < 10; i++) {
    const nums = [0, 1, 2, 3].map(() => randInt(1, 10))
    if (hasSolution(nums, target)) return nums
  }
  return [...FALLBACK_HANDS[randInt(0, FALLBACK_HANDS.length - 1)]]
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
    groups: [], // 牌桌上的叠组（4 → 1 叠）
    handValues: [], // 本局原始 4 个数值（提示用）
    activeGroupId: null, // 最近一次叠放、等待/允许选运算符的叠
    solved: 0,
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

  function deal() {
    const values = dealSolvable(state.target)
    state.handValues = [...values]
    state.groups = values.map((v, i) => {
      const suit = SUITS[randInt(0, SUITS.length - 1)]
      return makeSingleGroup(makeOriginalCard(v, i, { suit: suit.sym, color: suit.color }), i)
    })
    history = []
    state.activeGroupId = null
    state.hint = ''
    state.trace = values.join('　·　')
    state.fx.active = false
    state.message = ''
    state.drag = null
  }

  function restart() {
    state.solved = 0
    state.elapsed = 0
    deal()
  }

  // ---- 拖拽（按叠组命中） ----
  function beginDrag(groupId, pointerId, offsetX, offsetY) {
    if (state.groups.length <= 1) return false
    if (!findGroup(groupId)) return false
    state.drag = { sourceId: groupId, pointerId, offsetX, offsetY, ghostX: 0, ghostY: 0, hoverGroupId: null }
    return true
  }

  function moveDrag(x, y, hoverGroupId) {
    if (!state.drag) return
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
      flash('不能除以 0，换一种运算')
      return
    }
    state.groups = state.groups.map((x) => (x.id === id ? updated : x))
    updateTrace()
    afterOp()
  }

  function afterOp() {
    if (groupIsSolved(state.groups, state.target)) {
      state.solved++
      triggerFx('success', '')
      // 结算动效结束后自动发下一副牌
      setTimeout(() => deal(), 1600)
    } else if (state.groups.length === 1) {
      const v = state.groups[0].value
      if (v) flash(`当前结果 ${formatRat(v)} ≠ ${state.target}，可继续调整`)
    }
  }

  function undo() {
    if (!history.length) {
      flash('没有可撤销的步骤')
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
      flash('这局似乎无解，帮您换一副')
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
