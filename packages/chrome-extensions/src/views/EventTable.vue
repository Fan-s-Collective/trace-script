<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import { eventSummary } from '../trace-display'
import { eventAgent, eventDuration, eventModel, eventName, eventStatus, eventTokens, eventTraceId, formatDuration } from '../utils/ui-model'

defineProps<{ events: TraceEventEnvelope[], selectedId: string }>()
const emit = defineEmits<{ select: [id: string] }>()
function tokens(value: number | undefined): string {
  if (value === undefined)
    return '—'
  return value > 999 ? `${(value / 1000).toFixed(1)}k` : String(value)
}
</script>

<template>
  <section class="event-table-wrap" aria-label="Trace events">
    <div class="event-table-head">
      <span>Trace ID</span><span>Name</span><span>Agent</span><span>Duration</span><span>Type</span><span>Status</span><span>Model</span><span>Tokens</span>
    </div>
    <div v-if="events.length" class="event-table-body">
      <button v-for="event in events" :key="event.eventId" type="button" class="event-row" :class="{ selected: event.eventId === selectedId }" :aria-selected="event.eventId === selectedId" @click="emit('select', event.eventId)">
        <span class="truncate" :title="eventTraceId(event)">{{ eventTraceId(event) }}</span>
        <span class="truncate event-name"><strong>{{ eventName(event) }}</strong><small>{{ eventSummary(event) }}</small></span>
        <span class="truncate">{{ eventAgent(event) }}</span>
        <span class="tabular-nums">{{ formatDuration(eventDuration(event)) }}</span>
        <span class="truncate muted">{{ event.type }}</span>
        <span :class="`status-${eventStatus(event)}`"><i class="status-dot" />{{ eventStatus(event) }}</span>
        <span class="truncate">{{ eventModel(event) }}</span>
        <span class="tabular-nums tokens">{{ tokens(eventTokens(event)) }}</span>
      </button>
    </div>
    <p v-else class="empty-state">
      No events match these filters
    </p>
  </section>
</template>
