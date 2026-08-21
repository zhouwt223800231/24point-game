<script setup>
import { onMounted, onBeforeUnmount, provide } from 'vue'
import { useGame } from './composables/useGame'
import TopDashboard from './components/TopDashboard.vue'
import CardTable from './components/CardTable.vue'
import MergeTrace from './components/MergeTrace.vue'
import ActionBar from './components/ActionBar.vue'
import OperationPicker from './components/OperationPicker.vue'
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
      </defs>
    </svg>

    <TopDashboard />
    <CardTable />
    <MergeTrace />
    <ActionBar />
    <OperationPicker />
    <FeedbackOverlay />
  </div>
</template>
