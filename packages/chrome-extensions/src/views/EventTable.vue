<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import { eventAgent, eventDuration, eventModel, eventName, eventStatus, eventTokens, eventTraceId, formatDuration } from '@/utils/ui-model'

defineProps<{ events: TraceEventEnvelope[], selectedId: string }>()
const emit = defineEmits<{ select: [id: string] }>()
function tokens(value: number | undefined): string {
  if (value === undefined)
    return '—'
  return value > 999 ? `${(value / 1000).toFixed(1)}k` : String(value)
}

const columns = [
  { key: 'trace-id', label: 'Trace ID' },
  { key: 'name', label: 'Name' },
  { key: 'agent', label: 'Agent' },
  { key: 'duration', label: 'Duration' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'model', label: 'Model' },
  { key: 'tokens', label: 'Tokens' },
] as const
</script>

<template>
  <section class="event-table-wrap" aria-label="Trace events">
    <div class="event-table-head">
      <span v-for="column in columns" :key="column.key">{{ column.label }}</span>
    </div>
    <div v-if="events.length" class="event-table-body">
      <button v-for="event in events" :key="event.eventId" type="button" class="event-row" :class="{ selected: event.eventId === selectedId }" :aria-selected="event.eventId === selectedId" @click="emit('select', event.eventId)">
        <span class="truncate" :title="eventTraceId(event)">{{ eventTraceId(event) }}</span>
        <span class="truncate event-name"><strong>{{ eventName(event) }}</strong></span>
        <span class="truncate">{{ eventAgent(event) }}</span>
        <span class="tabular-nums">{{ formatDuration(eventDuration(event)) }}</span>
        <span class="truncate muted">{{ event.type }}</span>
        <span class="event-status" :class="`status-${eventStatus(event)}`"><i class="status-dot" />{{ eventStatus(event) }}</span>
        <span class="truncate">{{ eventModel(event) }}</span>
        <span class="tabular-nums tokens">{{ tokens(eventTokens(event)) }}</span>
      </button>
    </div>
    <p v-else class="empty-state">
      No events match these filters
    </p>
  </section>
</template>

<style scoped>
.event-table-wrap {
  min-width: 0;
  min-height: 0;
  overflow: auto;
}
.event-table-head,
.event-row {
  font-size: 0.875rem;
  display: grid;
  grid-template-columns: 18% 20% 10% 10% 12% 13% 10% 7%;
  align-items: center;
  border-bottom: 1px solid var(--divider);
}
.event-table-head {
  position: sticky;
  top: 0;
  z-index: 1;
  height: auto;
  border-bottom: 1px solid var(--divider);
  background: var(--panel-surface);
  color: var(--text-muted);
}
.event-table-head span,
.event-row span {
  min-width: 0;
  overflow: hidden;
  padding: 0 0.5rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.event-table-head span {
  padding-top: 8px;
  padding-bottom: 8px;
}
.event-row {
  width: 100%;
  min-height: 2.75rem;
  border: 0;
  border-bottom: 1px solid var(--divider);
  background: var(--panel-bg);
  text-align: left;
}
.event-row:nth-child(odd) {
  background: #282828;
}
.event-row:hover,
.event-row.selected {
  background: #3d3d3d;
}
.event-row.selected {
  box-shadow: inset 0.125rem 0 var(--accent);
}
.event-name {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.event-status {
  display: inline-flex;
  align-items: center;
}
.muted {
  color: var(--text-muted);
}
.tokens {
  text-align: left;
}
</style>
