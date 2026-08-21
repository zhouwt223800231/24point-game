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
      <span class="target-caption">Target</span>
    </div>
    <div class="dash-mid">
      <span class="stat"><span class="stat-label">Score</span> <b class="stat-num">{{ game.state.score }}</b></span>
      <span class="stat-divider">·</span>
      <span class="stat"><span class="stat-label">Solved</span> <b class="stat-num">{{ game.state.solved }}</b></span>
      <span class="stat-divider">·</span>
      <span class="stat"><span class="stat-label">Time</span> <b class="stat-num mono">{{ timeText }}</b></span>
    </div>
    <div class="dash-right">
      <button class="btn small" title="Undo last stack" @click="game.undo()">Undo ↶</button>
      <button class="btn small" title="Show a merge hint" @click="game.hint()">Hint ?</button>
      <button class="btn small" title="Deal a new hand" @click="game.deal()">New Hand ⟳</button>
      <button class="btn small" title="Restart the game" @click="game.restart()">Restart</button>
    </div>
  </header>
</template>

