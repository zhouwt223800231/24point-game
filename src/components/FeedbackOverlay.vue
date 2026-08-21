<script setup>
import { inject } from 'vue'

const game = inject('game')
</script>

<template>
  <transition name="pop">
    <div v-if="game.state.fx.active && game.state.fx.type === 'success'" class="feedback-overlay">
      <div class="fx-content">
        <div class="ink-burst" aria-hidden="true">
          <i v-for="n in 18" :key="n"></i>
        </div>
        <div class="big-target">{{ game.state.target }}</div>
        <div class="fx-text">{{ game.state.lastRound ? game.state.lastRound.praise : 'Good job!' }}</div>
        <div v-if="game.state.lastRound" class="fx-sub">
          +{{ game.state.lastRound.points }} pts · {{ game.state.lastRound.time }}
        </div>
      </div>
    </div>
  </transition>
</template>
