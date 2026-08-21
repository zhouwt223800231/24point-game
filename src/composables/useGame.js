// 游戏状态机（V3 叠牌合成版）：发牌（保证可解）、拖牌叠放、运算符预览、自动结算、撤销、提示、计分、计时。
import { reactive } from 'vue'
import { makeHint } from '../core/solver.js'
import { makeOriginalCard, makeSingleGroup, makeStack, setOp as mergeSetOp, groupIsSolved, formatGroupTree, resolveValue } from '../core/merge.js'
import { formatRat, toRat } from '../core/rational.js'
import { getScoreBand, formatSeconds } from '../core/scoring.js'
import { dealHand } from '../core/handpools.js'
import { findSolution, buildDemoSteps } from '../core/demo.js'

const SUITS = [
  { sym: '♠', color: 'black' },
  { sym: '♥', color: 'red' },
  { sym: '♣', color: 'black' },
  { sym: '♦', color: 'red' },
]

// 值为 10 的牌面值（JOKER 代表大小王，数值均记 10）
const FACES = ['10', 'J', 'Q', 'K', 'JOKER']

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

// 按难度从"已验证可解手牌池"发牌（dealHand 保证每副都有正确算法）
function drawHand(difficulty, target) {
  return dealHand(difficulty, target)
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
    sub: g.sub ? { bottom: cloneGroup(g.sub.bottom), top: cloneGroup(g.sub.top) } : null,
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
    demo: { active: false, steps: [], index: 0, total: 0 }, // 答案揭晓演示
  })

  let history = [] // 叠牌快照栈（撤销）
  let demoTimer = null
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
    const draw = drawHand(state.difficulty, state.target)
    state.handValues = [...draw]
    state.groups = draw.map((v, i) => {
      const suit = SUITS[randInt(0, SUITS.length - 1)]
      const face = v === 10 ? FACES[randInt(0, FACES.length - 1)] : null
      return makeSingleGroup(makeOriginalCard(v, i, { suit: suit.sym, color: suit.color, face }), i)
    })
    history = []
    if (demoTimer) {
      clearTimeout(demoTimer)
      demoTimer = null
    }
    state.demo = { active: false, steps: [], index: 0, total: 0 }
    state.roundStart = Date.now()
    state.lastRound = null
    state.activeGroupId = null
    state.hint = ''
    state.trace = draw.join(' · ')
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
    if (state.demo.active) return false
    if (state.groups.length <= 1) return false
    if (!findGroup(groupId)) return false
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
  function applyOpToActive(op) {
    const id = state.activeGroupId
    if (id == null) return false
    const g = findGroup(id)
    if (!g || !g.sub) return false
    const r = mergeSetOp(g, op)
    if (!r.ok && r.reason === 'div') {
      flash('Cannot divide by 0 — try another operation')
      return false
    }
    updateTrace()
    afterOp()
    return true
  }

  function setOp(op) {
    if (state.demo.active) return
    if (state.fx.active && state.fx.type === 'success') return
    applyOpToActive(op)
  }

  function afterOp() {
    if (groupIsSolved(state.groups, state.target)) {
      if (state.demo.active) return // 演示不计分，由演示流程收尾
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
      if (v && !state.demo.active) flash(`Result ${formatRat(v)} ≠ ${state.target} — keep adjusting`)
    }
  }

  function undo() {
    if (state.demo.active) return
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
    if (state.demo.active) return
    const h = makeHint(state.handValues, state.target)
    if (h) {
      state.hint = h
    } else {
      state.hint = ''
      flash('This hand seems impossible — dealing a new one')
      setTimeout(deal, 800)
    }
  }

  // ---- 答案揭晓（动画自动演示） ----
  function groupsEqual(a, b) {
    return !!a && !!b && a.n === b.n && a.d === b.d
  }

  function findDemoGroup(value) {
    return state.groups.findIndex((g) => groupsEqual(resolveValue(g), value))
  }

  function revealAnswer() {
    if (state.demo.active) return
    if (state.groups.length <= 1) return
    const tree = findSolution(state.handValues, state.difficulty, state.target)
    if (!tree) {
      flash('No solution found for this hand')
      return
    }
    const steps = buildDemoSteps(tree)
    state.demo = { active: true, steps, index: 0, total: steps.length }
    state.message = `Demo 0/${steps.length}`
    runDemoStep()
  }

  function runDemoStep() {
    const d = state.demo
    if (!d.active) return
    if (d.index >= d.total) {
      finishDemo()
      return
    }
    const step = d.steps[d.index]
    const li = findDemoGroup(step.left)
    let ri = -1
    if (li !== -1) {
      ri = state.groups.findIndex((g, i) => i !== li && groupsEqual(resolveValue(g), step.right))
    }
    if (li === -1 || ri === -1) {
      finishDemo()
      return
    }
    // 左 op 右：把 left 拖到 right 上（left 为上层），再选运算符
    stackOnto(state.groups[li].id, state.groups[ri].id)
    applyOpToActive(step.op)
    d.index++
    state.message = `Demo ${d.index}/${d.total}`
    demoTimer = setTimeout(runDemoStep, 700)
  }

  function finishDemo() {
    if (demoTimer) {
      clearTimeout(demoTimer)
      demoTimer = null
    }
    if (!state.demo.active) return
    state.demo.active = false
    state.message = 'Answer shown — no points'
    setTimeout(() => deal(), 1600)
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
    revealAnswer,
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












