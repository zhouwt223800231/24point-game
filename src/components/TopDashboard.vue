<script setup>
import { inject, computed } from 'vue'

const game = inject('game')

const timeText = computed(() => {
  const s = game.state.elapsed
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
})
</script>

<template>
  <header class="dashboard charcoal-frame">
    <div class="dash-left">
      <span class="label">已解</span>
      <span class="big-value">{{ game.state.solved }}</span>
      <span class="unit">题</span>
    </div>
    <div class="dash-center">
      <div class="target-badge">{{ game.state.target }}</div>
      <div class="target-caption">目标</div>
    </div>
    <div class="dash-right">
      <div class="time">
        <span class="label">用时</span>
        <span class="big-value mono">{{ timeText }}</span>
      </div>
      <button class="charcoal-btn small" @click="game.restart()">重开</button>
    </div>
  </header>
</template>
