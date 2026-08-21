<script setup>
import { inject, computed } from 'vue'

const game = inject('game')

const OPS = [
  { key: '+', sym: '+' },
  { key: '-', sym: '−' },
  { key: '*', sym: '×' },
  { key: '/', sym: '÷' },
]

const activeGroup = computed(() => game.state.groups.find((g) => g.id === game.state.activeGroupId) || null)
// 有可运算的叠（2 张以上）才启用
const enabled = computed(() => !!activeGroup.value && !!activeGroup.value.sub)
</script>

<template>
  <div class="operator-bar">
    <div v-if="enabled" class="order-hint">Order: top card op bottom card</div>
    <div class="op-row">
      <button
        v-for="op in OPS"
        :key="op.key"
        class="charcoal-btn op-btn"
        :class="{ selected: activeGroup && activeGroup.op === op.key }"
        :disabled="!enabled"
        type="button"
        @click="game.setOp(op.key)"
      >{{ op.sym }}</button>
    </div>
  </div>
</template>
