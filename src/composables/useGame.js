// 游戏状态机：发牌（保证可解）、槽位组装、括号、提交判定、提示、换牌、计分、计时。
import { reactive } from 'vue'
import { hasSolution, makeHint } from '../core/solver'
import { evaluateExpression, isComplete, parensNeverNegative } from '../core/expression'

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

const EMPTY_SLOTS = () => ({
  nums: [null, null, null, null],
  ops: [null, null, null],
  openBefore: [false, false, false, false],
  closeAfter: [false, false, false, false],
})

export function useGame() {
  const state = reactive({
    target: 24, // 阶段一固定 24；阶段二/三从这里切换
    cards: [],
    ...EMPTY_SLOTS(),
    solved: 0,
    elapsed: 0,
    hint: '',
    message: '',
    fx: { type: '', active: false }, // success | error | invalid
    shake: 0,
  })

  let history = []
  let timerId = null
  let messageTimer = null
  let fxTimer = null

  function slotValues() {
    return state.nums.map((i) => (i == null ? null : state.cards[i].value))
  }

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

  function pushHistory() {
    history.push({
      nums: [...state.nums],
      ops: [...state.ops],
      openBefore: [...state.openBefore],
      closeAfter: [...state.closeAfter],
    })
    if (history.length > 100) history.shift()
  }

  function resetSlots() {
    const empty = EMPTY_SLOTS()
    state.nums = empty.nums
    state.ops = empty.ops
    state.openBefore = empty.openBefore
    state.closeAfter = empty.closeAfter
    history = []
  }

  function deal() {
    const values = dealSolvable(state.target)
    state.cards = values.map((v) => {
      const suit = SUITS[randInt(0, SUITS.length - 1)]
      return { value: v, suit: suit.sym, color: suit.color }
    })
    resetSlots()
    state.hint = ''
    state.fx.active = false
    state.message = ''
  }

  function restart() {
    state.solved = 0
    state.elapsed = 0
    deal()
  }

  function isCardUsed(i) {
    return state.nums.includes(i)
  }

  function placeCard(cardIndex) {
    if (state.cards[cardIndex] == null) return
    if (isCardUsed(cardIndex)) return
    const i = state.nums.findIndex((v) => v == null)
    if (i === -1) {
      flash('数字槽已满，先擦除再试')
      return
    }
    pushHistory()
    state.nums[i] = cardIndex
  }

  function removeAtSlot(i) {
    if (state.nums[i] == null) return
    pushHistory()
    state.nums[i] = null
  }

  function placeOp(op) {
    const i = state.ops.findIndex((v) => v == null)
    if (i === -1) {
      flash('运算符已满')
      return
    }
    pushHistory()
    state.ops[i] = op
  }

  function removeOp(i) {
    if (state.ops[i] == null) return
    pushHistory()
    state.ops[i] = null
  }

  // side: 'open'（数字前插 "("） | 'close'（数字后插 ")"）
  function toggleParen(side, i) {
    const nextOpen = [...state.openBefore]
    const nextClose = [...state.closeAfter]
    if (side === 'open') nextOpen[i] = !nextOpen[i]
    else nextClose[i] = !nextClose[i]
    // 不允许出现没有左括号配对的右括号（平衡为负即拒绝）
    if (!parensNeverNegative(nextOpen, nextClose)) {
      flash('括号不匹配')
      return
    }
    pushHistory()
    state.openBefore = nextOpen
    state.closeAfter = nextClose
  }

  function parenHint() {
    flash('点击数字槽两边的 ( 或 ) 来插入括号')
  }

  function undo() {
    if (!history.length) {
      flash('没有可撤销的操作')
      return
    }
    const prev = history.pop()
    state.nums = prev.nums
    state.ops = prev.ops
    state.openBefore = prev.openBefore
    state.closeAfter = prev.closeAfter
  }

  function clearAll() {
    pushHistory()
    const empty = EMPTY_SLOTS()
    state.nums = empty.nums
    state.ops = empty.ops
    state.openBefore = empty.openBefore
    state.closeAfter = empty.closeAfter
  }

  function submit() {
    if (state.fx.active && state.fx.type === 'success') return
    const values = slotValues()
    if (!isComplete(values, state.ops)) {
      flash('请填满算式再提交')
      return
    }
    const res = evaluateExpression(values, state.ops, state.openBefore, state.closeAfter)
    if (!res.ok) {
      const msg =
        res.reason === 'parens'
          ? '括号不匹配，请调整'
          : res.reason === 'div by zero'
            ? '不能除以 0'
            : '算式不合法'
      triggerFx('invalid', msg)
      return
    }
    if (Math.abs(res.value - state.target) < 1e-9) {
      state.solved++
      triggerFx('success', '')
      // 结算动效结束后自动发下一副牌（deal() 会重置结算状态）
      setTimeout(() => deal(), 1600)
    } else {
      triggerFx('error', `结果 ${formatValue(res.value)} ≠ ${state.target}，再试试`)
    }
  }

  function formatValue(v) {
    return Number.isInteger(v) ? String(v) : v.toFixed(2)
  }

  function hint() {
    const hand = state.cards.map((c) => c.value)
    const h = makeHint(hand, state.target)
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
    isCardUsed,
    placeCard,
    removeAtSlot,
    placeOp,
    removeOp,
    toggleParen,
    parenHint,
    undo,
    clearAll,
    submit,
    hint,
    startTimer,
    stopTimer,
  }
}

