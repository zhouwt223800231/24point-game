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
  <header class="dashboard">
    <div class="dash-left">
      <span class="target-badge">{{ game.state.target }}</span>
      <span class="target-caption">目标</span>
    </div>
    <div class="dash-mid">
      <span class="stat"><b class="stat-num">{{ game.state.solved }}</b> 已解</span>
      <span class="stat-divider">·</span>
      <span class="stat mono">{{ timeText }}</span>
    </div>
    <div class="dash-right">
      <button class="charcoal-btn small" title="撤销上一次叠牌" @click="game.undo()">撤销 ↶</button>
      <button class="charcoal-btn small" title="合并线索" @click="game.hint()">提示 ?</button>
      <button class="charcoal-btn small" title="换一副牌" @click="game.deal()">换牌 ⟳</button>
      <button class="charcoal-btn small" title="重新开始" @click="game.restart()">重开</button>
    </div>
  </header>
</template>
