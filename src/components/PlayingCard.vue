<script setup>
import { computed } from 'vue'
import { formatRat } from '../core/rational.js'

const props = defineProps({
  card: { type: Object, required: true },
  index: { type: Number, default: 0 },
  dragging: { type: Boolean, default: false },
  ghost: { type: Boolean, default: false },
})

// 模拟真实发牌的错落摆放
const TILTS = [
  'rotate(-7deg) translateY(6px)',
  'rotate(-2deg) translateY(-6px)',
  'rotate(3deg) translateY(-10px)',
  'rotate(8deg) translateY(0px)',
]

const style = computed(() => ({ '--tilt': props.ghost ? 'rotate(0deg)' : TILTS[props.index] }))
const valueText = computed(() => formatRat(props.card.value))
</script>

<template>
  <div class="playing-card" :class="{ red: card.color === 'red', merged: card.kind === 'merged', dragging, ghost }" :style="style">
    <template v-if="card.kind === 'original'">
      <span class="corner top">{{ card.suit }}</span>
      <span class="corner bottom">{{ card.suit }}</span>
    </template>
    <span v-else class="merged-tag">合</span>
    <span class="card-value">{{ valueText }}</span>
  </div>
</template>

