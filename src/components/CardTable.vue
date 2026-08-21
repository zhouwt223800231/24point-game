<script setup>
import { inject } from 'vue'
import PlayingCard from './PlayingCard.vue'

const game = inject('game')
</script>

<template>
  <section class="card-table">
    <PlayingCard
      v-for="(card, i) in game.state.cards"
      :key="i"
      :card="card"
      :index="i"
      :used="game.isCardUsed(i)"
    />
  </section>
</template>
