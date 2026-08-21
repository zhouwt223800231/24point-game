<script setup>
import { computed } from 'vue'
import PlayingCard from './PlayingCard.vue'
import { formatRat } from '../core/rational.js'

const props = defineProps({
  group: { type: Object, required: true },
  active: { type: Boolean, default: false },
  dragging: { type: Boolean, default: false },
  ghost: { type: Boolean, default: false },
})

const resultText = computed(() => (props.group.value ? `= ${formatRat(props.group.value)}` : '?'))
const showResult = computed(() => props.group.layers.length >= 2)
</script>

<template>
  <div class="card-stack" :class="{ active, dragging, ghost, pending: showResult && !group.value }">
    <div class="stack-layers">
      <div v-for="(card, i) in group.layers" :key="card.id" class="stack-layer" :style="{ zIndex: i + 1 }">
        <PlayingCard :card="card" :index="i" :tilt="`rotate(${i * 4 - 2}deg) translate(${i * 12}px, ${-i * 7}px)`" />
      </div>
    </div>
    <div v-if="showResult" class="stack-result">{{ resultText }}</div>
  </div>
</template>
