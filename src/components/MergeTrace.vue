<script setup>
import { inject } from 'vue'

const game = inject('game')
</script>

<template>
  <div class="merge-trace charcoal-frame">
    <div class="trace-row">
      <span class="trace-label">算式</span>
      <span class="trace-text">{{ game.state.trace || '—' }}</span>
    </div>
    <div v-if="game.state.hint" class="hint-text">💡 {{ game.state.hint }}</div>
  </div>
</template>
