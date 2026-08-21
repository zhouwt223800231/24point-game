<script setup>
import { inject, ref } from 'vue'
import PlayingCard from './PlayingCard.vue'

const game = inject('game')
const cardEls = ref([])
const active = ref({ on: false, pointerId: null })

function setCardEl(el, i) {
  if (el) cardEls.value[i] = el
}

function getCard(id) {
  return game.state.cards.find((c) => c.id === id)
}

// 命中检测：指针位置是否落在某张目标卡上（排除被拖的卡）
function hitTest(x, y) {
  const d = game.state.drag
  if (!d) return null
  for (let i = 0; i < game.state.cards.length; i++) {
    const card = game.state.cards[i]
    if (card.id === d.sourceId) continue
    const el = cardEls.value[i]
    if (!el) continue
    const r = el.getBoundingClientRect()
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return card.id
  }
  return null
}

function onPointerDown(e, i) {
  const card = game.state.cards[i]
  if (!card || game.state.cards.length <= 1) return
  const rect = e.currentTarget.getBoundingClientRect()
  const ok = game.beginDrag(card.id, e.pointerId, e.clientX - rect.left, e.clientY - rect.top)
  if (!ok) return
  active.value = { on: true, pointerId: e.pointerId }
  try {
    e.currentTarget.setPointerCapture(e.pointerId)
  } catch {}
  e.preventDefault()
}

function onPointerMove(e) {
  if (!active.value.on || e.pointerId !== active.value.pointerId) return
  game.moveDrag(e.clientX, e.clientY, hitTest(e.clientX, e.clientY))
}

function onPointerUp(e) {
  if (!active.value.on || e.pointerId !== active.value.pointerId) return
  active.value.on = false
  game.endDrag()
}
</script>

<template>
  <section class="card-table">
    <div
      v-for="(card, i) in game.state.cards"
      :key="card.id"
      class="card-slot"
      :ref="(el) => setCardEl(el, i)"
      :class="{ 'is-target': !!game.state.drag && card.id === game.state.drag.hoverTargetId }"
      @pointerdown="onPointerDown($event, i)"
      @pointermove="onPointerMove($event)"
      @pointerup="onPointerUp($event)"
      @pointercancel="onPointerUp($event)"
    >
      <PlayingCard :card="card" :index="i" :dragging="!!game.state.drag && card.id === game.state.drag.sourceId" />
    </div>

    <!-- 拖拽幽灵卡 -->
    <div v-if="game.state.drag" class="ghost-card" :style="{ transform: `translate(${game.state.drag.ghostX}px, ${game.state.drag.ghostY}px)` }">
      <PlayingCard :card="getCard(game.state.drag.sourceId)" :index="0" ghost />
    </div>

    <div class="table-message" :class="{ show: game.state.message }">{{ game.state.message }}</div>
  </section>
</template>
