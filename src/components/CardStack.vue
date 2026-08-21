<script setup>
import { computed } from 'vue'
import PlayingCard from './PlayingCard.vue'
import { formatRat } from '../core/rational.js'

const props = defineProps({
  group: { type: Object, required: true },
  active: { type: Boolean, default: false },
  dragging: { type: Boolean, default: false },
  ghost: { type: Boolean, default: false },
})

// 自然扇形：每层手调偏移+角度（非机械均分），从公共底部支点展开，露出每张牌左上角数字
const FAN = [
  'translate(0px, 10px) rotate(-9deg)',
  'translate(6px, 4px) rotate(1deg)',
  'translate(14px, -2px) rotate(12deg)',
  'translate(24px, -8px) rotate(24deg)',
]

const isStacked = computed(() => props.group.layers.length >= 2)

const stackStyle = computed(() => {
  const n = props.group.layers.length
  // 扇形展开宽度：卡宽 108 + 左余量 + 每层右移
  return { width: `${128 + (n - 1) * 38}px` }
})

const resultText = computed(() => (props.group.value ? `= ${formatRat(props.group.value)}` : '?'))
const showResult = computed(() => isStacked.value)
</script>

<template>
  <div class="card-stack" :class="{ stacked: isStacked, active, dragging, ghost, pending: showResult && !group.value }" :style="stackStyle">
    <div class="stack-layers">
      <div v-for="(card, i) in group.layers" :key="card.id" class="stack-layer" :style="{ zIndex: i + 1 }">
        <PlayingCard :card="card" :index="i" :tilt="isStacked ? FAN[i] : ''" />
      </div>
    </div>
    <div v-if="showResult" class="stack-result">{{ resultText }}</div>
  </div>
</template>
