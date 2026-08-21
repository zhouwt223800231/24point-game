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
    <TopDashboard />
    <CardTable />
    <OperatorBar />
    <FeedbackOverlay />
  </div>
</template>
