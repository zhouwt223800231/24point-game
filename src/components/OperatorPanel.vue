<script setup>
import { inject } from 'vue'

const game = inject('game')

const ops = [
  { key: '+', sym: '+' },
  { key: '-', sym: '−' },
  { key: '*', sym: '×' },
  { key: '/', sym: '÷' },
]
</script>

<template>
  <section class="operator-panel">
    <button v-for="op in ops" :key="op.key" class="charcoal-btn op-btn" @click="game.placeOp(op.key)">
      {{ op.sym }}
    </button>
    <button class="charcoal-btn paren-btn" title="插入括号" @click="game.parenHint()">( )</button>
  </section>
</template>
