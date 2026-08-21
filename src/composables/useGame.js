// 游戏状态机（V2 拖拽合成版）：发牌（保证可解）、拖拽合并、运算选择、自动结算、撤销、提示、计分、计时。
import { reactive } from 'vue'
import { hasSolution, makeHint } from '../core/solver.js'
import { combine, makeOriginalCard, isSolved, formatTree } from '../core/merge.js'
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

// 卡组深拷贝（撤销快照用）
function cloneCards(cards) {
  return cards.map((c) => ({ ...c, value: { ...c.value }, tree: cloneTree(c.tree) }))
}

export function useGame() {
  const state = reactive({
    target: 24, // 阶段二/三从这里切换 36/48/随机
    cards: [], // 当前卡组（4 → 1 张）
    handValues: [], // 本局原始 4 个数值（提示用）
    solved: 0,
    elapsed: 0,
    hint: '',
    message: '',
    trace: '',
    fx: { type: '', active: false }, // success | error | invalid
    shake: 0,
    drag: null, // { sourceId, pointerId, offsetX, offsetY, ghostX, ghostY, hoverTargetId }
    pendingMerge: null, // { a, b, x, y } 运算选择器状态
  })

  let history = [] // 卡组快照栈（撤销）
  let timerId = null
  let messageTimer = null
  let fxTimer = null

  const findCard = (id) => state.cards.find((c) => c.id === id)

  function flash(msg) {
    state.message = msg
    if (messageTimer) clearTimeout(messageTimer)
    messageTimer = setTimeout(() => {
      state.message = ''
    }, 1800)
  }

  function triggerFx(type, msg = '') {
    state.fx = { type, active: true }
    state.shake++
    state.message = msg
    if (fxTimer) clearTimeout(fxTimer)
    fxTimer = setTimeout(() => {
      state.fx.active = false
    }, type === 'success' ? 1600 : 1200)
  }

  function updateTrace() {
    state.trace = state.cards.map((c) => formatTree(c.tree)).join('　·　')
  }

  function deal() {
    const values = dealSolvable(state.target)
    state.handValues = [...values]
    state.cards = values.map((v, i) => {
      const suit = SUITS[randInt(0, SUITS.length - 1)]
      return makeOriginalCard(v, i, { suit: suit.sym, color: suit.color })
    })
    history = []
    state.hint = ''
    state.trace = values.join('　·　')
    state.fx.active = false
    state.message = ''
    state.drag = null
    state.pendingMerge = null
  }

  function restart() {
    state.solved = 0
    state.elapsed = 0
    deal()
  }

  // ---- 拖拽 ----
  function beginDrag(cardId, pointerId, offsetX, offsetY) {
    if (state.cards.length <= 1) return false
    if (!findCard(cardId)) return false
    state.drag = { sourceId: cardId, pointerId, offsetX, offsetY, ghostX: 0, ghostY: 0, hoverTargetId: null }
    return true
  }

  function moveDrag(x, y, hoverTargetId) {
    if (!state.drag) return
    state.drag.ghostX = x - state.drag.offsetX
    state.drag.ghostY = y - state.drag.offsetY
    state.drag.hoverTargetId = hoverTargetId
  }

  function endDrag() {
    const d = state.drag
    if (!d) return
    state.drag = null
    if (d.hoverTargetId && d.hoverTargetId !== d.sourceId) {
      prepareMerge(d.sourceId, d.hoverTargetId, d.ghostX, d.ghostY)
    }
  }

  // ---- 运算选择器 ----
  function prepareMerge(aId, bId, x, y) {
    state.pendingMerge = { a: aId, b: bId, x, y }
  }

  function cancelMerge() {
    state.pendingMerge = null
  }

  function applyMerge(op, reverse) {
    const pm = state.pendingMerge
    if (!pm) return
    const a = findCard(pm.a)
    const b = findCard(pm.b)
    if (!a || !b) {
      cancelMerge()
      return
    }
    const merged = combine(reverse ? b : a, reverse ? a : b, op)
    if (!merged) {
      flash('不能除以 0，换一种运算')
      cancelMerge()
      return
    }
    history.push(cloneCards(state.cards))
    state.cards = state.cards
      .filter((c) => c.id !== pm.a)
      .map((c) => (c.id === pm.b ? merged : c))
    state.pendingMerge = null
    state.hint = ''
    updateTrace()
    afterMerge()
  }

  function afterMerge() {
    if (isSolved(state.cards, state.target)) {
      state.solved++
      triggerFx('success', '')
      // 结算动效结束后自动发下一副牌
      setTimeout(() => deal(), 1600)
    } else if (state.cards.length === 1) {
      const v = state.cards[0].value
      triggerFx('error', `结果 ${formatRat(v)} ≠ ${state.target}，可撤销重试`)
    }
  }

  function undo() {
    if (!history.length) {
      flash('没有可撤销的步骤')
      return
    }
    state.cards = history.pop()
    state.pendingMerge = null
    state.drag = null
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
    prepareMerge,
    cancelMerge,
    applyMerge,
    undo,
    hint,
    startTimer,
    stopTimer,
  }
}

