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
        <div class="fx-text">太棒了！+1</div>
      </div>
    </div>
  </transition>
</template>
