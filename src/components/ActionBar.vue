<script setup>
import { inject } from 'vue'

const game = inject('game')
</script>

<template>
  <section class="action-bar">
    <button class="charcoal-btn action" @click="game.undo()">撤销 ↶</button>
    <button class="charcoal-btn action" @click="game.hint()">提示 ?</button>
    <button class="charcoal-btn action" @click="game.deal()">换牌 ⟳</button>
    <button class="charcoal-btn action" @click="game.restart()">重开</button>
  </section>
</template>
