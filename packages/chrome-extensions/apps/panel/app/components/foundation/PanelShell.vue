<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { usePanelStore } from '../../composables/usePanelStore'
import DetailsPanel from '../trace/DetailsPanel.vue'
import Timeline from '../trace/Timeline.vue'
import Toolbar from '../trace/Toolbar.vue'
import TraceFooter from '../trace/TraceFooter.vue'
import TraceTable from '../trace/TraceTable.vue'

const store = usePanelStore()
const { events, visibleRows, selected, selectedId, connected, recording, query, type, statusFilter, agent, agents, onlyErrors, totalTokens, visibleTokens, totalDuration, maxDuration, failedCount } = store
const filtersVisible = shallowRef(true)
const timelineHeight = shallowRef(154)
const detailsWidth = shallowRef(340)
const dragging = shallowRef<'timeline' | 'details' | false>(false)
let dragOrigin = 0
let dragSize = 0
const workspaceStyle = computed(() => ({ gridTemplateRows: `${timelineHeight.value}px 1px minmax(0, 1fr)` }))
const contentStyle = computed(() => ({ gridTemplateColumns: `minmax(420px, 1fr) 1px ${detailsWidth.value}px` }))
function startResize(kind: 'timeline' | 'details', event: PointerEvent): void {
  dragging.value = kind
  dragOrigin = kind === 'timeline' ? event.clientY : event.clientX
  dragSize = kind === 'timeline' ? timelineHeight.value : detailsWidth.value
  window.addEventListener('pointermove', resize)
  window.addEventListener('pointerup', stopResize, { once: true })
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
}
function resize(event: PointerEvent): void {
  if (!dragging.value)
    return
  const delta = dragging.value === 'timeline' ? event.clientY - dragOrigin : dragOrigin - event.clientX
  if (dragging.value === 'timeline')
    timelineHeight.value = Math.min(360, Math.max(92, dragSize + delta))
  else
    detailsWidth.value = Math.min(520, Math.max(280, dragSize + delta))
}
function stopResize(): void {
  dragging.value = false
  window.removeEventListener('pointermove', resize)
}
function keyboard(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    store.select('')
    return
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
    store.selectAdjacent(event.key === 'ArrowDown' ? 1 : -1)
}
onMounted(() => {
  store.connect()
  document.addEventListener('keydown', keyboard)
})
onUnmounted(() => {
  store.dispose()
  document.removeEventListener('keydown', keyboard)
  window.removeEventListener('pointermove', resize)
})
</script>

<template>
  <main class="panel-root">
    <Toolbar
      :recording="recording"
      :filters-visible="filtersVisible"
      :query="query"
      :type="type"
      :status="statusFilter"
      :agent="agent"
      :agents="agents"
      :only-errors="onlyErrors"
      :total="events.length"
      :count="visibleRows.length"
      @toggle-recording="store.toggleRecording"
      @clear="store.clear"
      @toggle-filters="filtersVisible = !filtersVisible"
      @update:query="query = $event"
      @update:type="type = $event"
      @update:status="statusFilter = $event"
      @update:agent="agent = $event"
      @toggle-errors="onlyErrors = !onlyErrors"
    />
    <div class="trace-workspace" :style="workspaceStyle">
      <Timeline
        :rows="visibleRows"
        :selected-id="selectedId"
        @select="store.select"
      />
      <div
        class="resize-handle resize-handle-vertical"
        role="separator"
        aria-label="Resize timeline height"
        tabindex="0"
        @pointerdown="startResize('timeline', $event)"
        @keydown.down.prevent="timelineHeight = Math.min(360, timelineHeight + 8)"
        @keydown.up.prevent="timelineHeight = Math.max(92, timelineHeight - 8)"
      />
      <div class="content-workspace" :style="contentStyle">
        <TraceTable :rows="visibleRows" :selected-id="selectedId" @select="store.select" />
        <div
          class="resize-handle resize-handle-horizontal"
          role="separator"
          aria-label="Resize details panel width"
          tabindex="0"
          @pointerdown="startResize('details', $event)"
          @keydown.left.prevent="detailsWidth = Math.min(520, detailsWidth + 8)"
          @keydown.right.prevent="detailsWidth = Math.max(280, detailsWidth - 8)"
        />
        <DetailsPanel :row="selected" :siblings="events" @select="store.select" />
      </div>
    </div>
    <TraceFooter
      :connected="connected"
      :event-count="events.length"
      :visible-count="visibleRows.length"
      :total-tokens="totalTokens"
      :visible-tokens="visibleTokens"
      :failed-count="failedCount"
      :max-duration="maxDuration"
      :total-duration="totalDuration"
    />
  </main>
</template>
