<script setup lang="ts">
import type { TraceRow } from '../../types/panel'
import { nextTick, useTemplateRef, watch } from 'vue'

const props = defineProps<{ rows: TraceRow[], selectedId: string }>()
const emit = defineEmits<{ select: [id: string] }>()
const scroller = useTemplateRef<HTMLDivElement>('scroller')
function duration(value: number): string {
  return value < 1000 ? `${value}ms` : `${(value / 1000).toFixed(1)}s`
}
function tokens(value: number): string {
  return value > 999 ? `${(value / 1000).toFixed(1)}k` : String(value)
}
function move(event: KeyboardEvent, index: number): void {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')
    return
  event.preventDefault()
  const next = props.rows[index + (event.key === 'ArrowDown' ? 1 : -1)]
  if (next) {
    emit('select', next.event.id)
    nextTick(() => scroller.value?.querySelectorAll<HTMLElement>('[role="row"]')[index + (event.key === 'ArrowDown' ? 1 : -1)]?.focus())
  }
}
watch(() => props.selectedId, () => {
  const target = scroller.value?.querySelector<HTMLElement>('[aria-selected="true"]')
  target?.scrollIntoView({ block: 'nearest' })
})
</script>

<template>
  <div ref="scroller" class="table-scroll" role="grid" aria-label="Trace events" tabindex="0">
    <div class="trace-table-head" role="row">
      <span>Trace ID</span><span>Name</span><span>Agent</span><span>Duration</span><span>Type</span><span>Status</span><span>Model</span><span>Tokens</span>
    </div>
    <div v-if="rows.length" class="trace-table-body">
      <div v-for="(row, index) in rows" :key="row.event.id" class="trace-row" :class="row.event.id === selectedId ? 'is-selected' : ''" role="row" tabindex="0" :aria-selected="row.event.id === selectedId" @click="emit('select', row.event.id)" @focus="emit('select', row.event.id)" @keydown="move($event, index)">
        <span class="truncate trace-id">{{ row.event.traceId }}</span><span class="truncate event-name">{{ row.event.name }}</span><span class="truncate">{{ row.event.agent }}</span><span class="num">{{ duration(row.event.duration) }}</span><span class="truncate type-text">{{ row.event.type }}</span><span :class="`status-${row.event.status}`"><i class="status-dot" />{{ row.event.status }}</span><span class="truncate">{{ row.event.model }}</span><span class="num">{{ tokens(row.event.tokens) }}</span>
      </div>
    </div>
    <div v-else class="empty-state">
      No events match these filters
    </div>
  </div>
</template>
