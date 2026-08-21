<script setup>
import { inject, computed } from 'vue'
import { OP_FNS } from '../core/merge.js'
import { formatRat } from '../core/rational.js'

const game = inject('game')
const OP_SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' }

const pair = computed(() => {
  const pm = game.state.pendingMerge
  if (!pm) return null
  return {
    a: game.state.cards.find((c) => c.id === pm.a),
    b: game.state.cards.find((c) => c.id === pm.b),
  }
})

// 6 个运算选项：+、A−B、B−A、×、A÷B、B÷A，显示真实数值预览
const options = computed(() => {
  if (!pair.value) return []
  const { a, b } = pair.value
  const fa = formatRat(a.value)
  const fb = formatRat(b.value)
  const mk = (op, reverse) => {
    const v = OP_FNS[op](reverse ? b.value : a.value, reverse ? a.value : b.value)
    return {
      key: op + (reverse ? 'r' : ''),
      op,
      reverse,
      label: `${reverse ? fb : fa} ${OP_SYM[op]} ${reverse ? fa : fb}`,
      result: v ? formatRat(v) : '',
      disabled: !v,
    }
  }
  return [mk('+', false), mk('-', false), mk('-', true), mk('*', false), mk('/', false), mk('/', true)]
})

// 浮层定位在落点附近，自动约束在视口内
const pos = computed(() => {
  const pm = game.state.pendingMerge
  if (!pm) return { left: 0, top: 0 }
  const w = 360
  const h = 240
  const left = Math.min(Math.max(pm.x - w / 2, 8), window.innerWidth - w - 8)
  const top = Math.min(Math.max(pm.y - h / 2, 8), window.innerHeight - h - 8)
  return { left, top }
})
</script>

<template>
  <div v-if="game.state.pendingMerge" class="picker-backdrop" @click="game.cancelMerge()">
    <div class="operation-picker" :style="{ left: pos.left + 'px', top: pos.top + 'px' }" @click.stop>
      <div class="picker-title">选择运算</div>
      <div class="picker-grid">
        <button v-for="opt in options" :key="opt.key" class="charcoal-btn picker-opt" type="button" :disabled="opt.disabled" @click="game.applyMerge(opt.op, opt.reverse)">
          <span class="opt-expr">{{ opt.label }}</span>
          <span class="opt-result" :class="{ zero: opt.disabled }">{{ opt.disabled ? '不能 ÷ 0' : `= ${opt.result}` }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

