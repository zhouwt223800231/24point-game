<script setup>
import { inject, computed } from 'vue'

const props = defineProps({
  card: { type: Object, required: true },
  index: { type: Number, required: true },
  used: { type: Boolean, default: false },
})

const game = inject('game')

// 模拟真实发牌的错落摆放（旋转 + 上下错位）
const TILTS = ['rotate(-7deg) translateY(6px)', 'rotate(-2deg) translateY(-6px)', 'rotate(3deg) translateY(-10px)', 'rotate(8deg) translateY(0px)']

const style = computed(() => ({ '--tilt': TILTS[props.index] }))
</script>

<template>
  <div
    class="playing-card"
    :class="{ red: card.color === 'red', used }"
    :style="style"
    :title="used ? '已放入算式，点击槽位可移除' : '点击放入算式'"
    @click="game.placeCard(index)"
  >
    <span class="corner top">{{ card.suit }}</span>
    <span class="card-value">{{ card.value }}</span>
    <span class="corner bottom">{{ card.suit }}</span>
    <span v-if="used" class="dust" aria-hidden="true">
      <i v-for="n in 8" :key="n"></i>
    </span>
  </div>
</template>
