<script setup>
import { inject, ref } from 'vue'
import CardStack from './CardStack.vue'

const game = inject('game')
const groupEls = ref([])
const active = ref({ on: false, pointerId: null })

function setGroupEl(el, i) {
  if (el) groupEls.value[i] = el
}

function getGroup(id) {
  return game.state.groups.find((g) => g.id === id)
}

// 命中检测：指针位置是否落在某叠上（排除被拖的叠）
function hitTest(x, y) {
  const d = game.state.drag
  if (!d) return null
  for (let i = 0; i < game.state.groups.length; i++) {
    const g = game.state.groups[i]
    if (g.id === d.sourceId) continue
    // 待选运算的叠不能作为投放目标
    if (g.layers.length >= 2 && !g.op) continue
    const el = groupEls.value[i]
    if (!el) continue
    const r = el.getBoundingClientRect()
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return g.id
  }
  return null
}

function onPointerDown(e, i) {
  const g = game.state.groups[i]
  if (!g || game.state.groups.length <= 1) return
  const rect = e.currentTarget.getBoundingClientRect()
  const ok = game.beginDrag(g.id, e.pointerId, e.clientX - rect.left, e.clientY - rect.top)
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
    <div class="table-info">
      <span class="trace-badge" title="当前算式">算式：{{ game.state.trace || '—' }}</span>
      <span v-if="game.state.hint" class="hint-badge">💡 {{ game.state.hint }}</span>
    </div>

    <div class="table-center">
      <div
        v-for="(g, i) in game.state.groups"
        :key="g.id"
        class="group-slot"
        :ref="(el) => setGroupEl(el, i)"
        :class="{ 'is-target': !!game.state.drag && g.id === game.state.drag.hoverGroupId }"
        @pointerdown="onPointerDown($event, i)"
        @pointermove="onPointerMove($event)"
        @pointerup="onPointerUp($event)"
        @pointercancel="onPointerUp($event)"
      >
        <CardStack
          :group="g"
          :active="g.id === game.state.activeGroupId"
          :dragging="!!game.state.drag && g.id === game.state.drag.sourceId"
        />
      </div>
    </div>

    <!-- 拖拽幽灵叠 -->
    <div v-if="game.state.drag" class="ghost-stack" :style="{ transform: `translate(${game.state.drag.ghostX}px, ${game.state.drag.ghostY}px)` }">
      <CardStack :group="getGroup(game.state.drag.sourceId)" ghost />
    </div>

    <div class="table-message" :class="{ show: game.state.message }">{{ game.state.message }}</div>
  </section>
</template>

