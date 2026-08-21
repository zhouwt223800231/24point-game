<script setup>
import { inject, computed } from 'vue'
import { OP_SYMBOL } from '../core/expression'

const game = inject('game')

const NUM_SLOT_COUNT = 4

function slotValue(i) {
  const idx = game.state.nums[i]
  return idx == null ? null : game.state.cards[idx].value
}

const fxClass = computed(() => {
  if (game.state.fx.active && game.state.fx.type === 'error') return 'shake error'
  if (game.state.fx.active && game.state.fx.type === 'invalid') return 'shake invalid'
  return ''
})
</script>

<template>
  <section class="expr-area charcoal-frame">
    <div class="expr-toolbar">
      <button class="tool-btn" title="撤销上一步" @click="game.undo()">↶</button>
      <button class="tool-btn" title="清空算式" @click="game.clearAll()">🧽</button>
      <span class="tool-label">回退 / 擦除</span>
      <span v-if="game.state.hint" class="hint-text">{{ game.state.hint }}</span>
    </div>

    <div class="expr-row" :class="fxClass" :key="game.state.shake">
      <template v-for="i in NUM_SLOT_COUNT" :key="i">
        <div class="num-slot-wrap">
          <button
            class="paren-toggle open"
            :class="{ active: game.state.openBefore[i - 1] }"
            title="在此数字前插入左括号"
            @click="game.toggleParen('open', i - 1)"
          >(</button>
          <button
            class="num-slot"
            :class="{ filled: slotValue(i - 1) != null }"
            :title="slotValue(i - 1) != null ? '点击移除该数字' : '空槽位'"
            @click="game.removeAtSlot(i - 1)"
          >{{ slotValue(i - 1) ?? '?' }}</button>
          <button
            class="paren-toggle close"
            :class="{ active: game.state.closeAfter[i - 1] }"
            title="在此数字后插入右括号"
            @click="game.toggleParen('close', i - 1)"
          >)</button>
        </div>
        <button
          v-if="i < NUM_SLOT_COUNT"
          class="op-slot"
          :class="{ filled: game.state.ops[i - 1] != null }"
          :title="game.state.ops[i - 1] != null ? '点击移除运算符' : '运算符槽位'"
          @click="game.removeOp(i - 1)"
        >{{ game.state.ops[i - 1] ? OP_SYMBOL[game.state.ops[i - 1]] : '?' }}</button>
      </template>
      <span class="eq">=</span>
      <span class="target-val">{{ game.state.target }}</span>
    </div>

    <div class="message" :class="{ show: game.state.message }">{{ game.state.message }}</div>
  </section>
</template>
