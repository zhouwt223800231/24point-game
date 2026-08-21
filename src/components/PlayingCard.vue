<script setup>
import { inject, computed } from 'vue'
import { formatRat, formatDecimal } from '../core/rational.js'

const props = defineProps({
  card: { type: Object, required: true },
  index: { type: Number, default: 0 },
  dragging: { type: Boolean, default: false },
  ghost: { type: Boolean, default: false },
  tilt: { type: String, default: '' }, // 自定义倾斜/偏移（叠牌扇形层用）
})

const TILTS = [
  'rotate(-7deg) translateY(6px)',
  'rotate(-2deg) translateY(-6px)',
  'rotate(3deg) translateY(-10px)',
  'rotate(8deg) translateY(0px)',
]

const style = computed(() => ({ '--tilt': props.tilt || (props.ghost ? 'rotate(0deg)' : TILTS[props.index]) }))
// 小数牌按小数显示，分数牌/合并结果按 n/d 显示，整数显示整数
const valueText = computed(() => (props.card.display === 'dec' ? formatDecimal(props.card.value) : formatRat(props.card.value)))
</script>

<template>
  <div class="playing-card" :class="{ red: card.color === 'red', merged: card.kind === 'merged', dragging, ghost }" :style="style">
    <!-- 经典扑克角标：左上数字+花色，右下 180° 镜像 -->
    <div class="corner-index tl">
      <span class="idx-value">{{ valueText }}</span>
      <span v-if="card.kind === 'original'" class="idx-suit">{{ card.suit }}</span>
    </div>
    <div class="corner-index br">
      <span class="idx-value">{{ valueText }}</span>
      <span v-if="card.kind === 'original'" class="idx-suit">{{ card.suit }}</span>
    </div>
    <span v-if="card.kind === 'merged'" class="merged-tag">Σ</span>
  </div>
</template>
