<script setup>
import { onMounted, onBeforeUnmount, provide } from 'vue'
import { useGame } from './composables/useGame'
import TopDashboard from './components/TopDashboard.vue'
import CardTable from './components/CardTable.vue'
import OperatorBar from './components/OperatorBar.vue'
import FeedbackOverlay from './components/FeedbackOverlay.vue'

const game = useGame()
provide('game', game)

onMounted(() => game.startTimer())
onBeforeUnmount(() => game.stopTimer())
</script>

<template>
  <div class="page">
    <!-- 木炭毛躁边缘滤镜（全局 SVG） -->
    <svg class="svg-filters" aria-hidden="true">
      <defs>
        <filter id="rough-edge">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="rough-strong">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" seed="13" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="rough-ink">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="5" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>

    <TopDashboard />
    <CardTable />
    <OperatorBar />
    <FeedbackOverlay />
  </div>
</template>
