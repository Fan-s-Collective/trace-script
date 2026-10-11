<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import { computed, ref } from 'vue'
import { eventAgent, eventDuration, eventName, eventStatus, eventTimestamp, formatDuration } from '../utils/ui-model'

interface TimelineRow {
  event: TraceEventEnvelope
  start: number
  duration: number
}

const props = defineProps<{ events: TraceEventEnvelope[], selectedId: string }>()
const emit = defineEmits<{ select: [id: string] }>()
const rulerCanvas = ref<HTMLElement>()
const eventsScroll = ref<HTMLElement>()
const orderedEvents = computed(() => [...props.events].sort((a, b) => eventTimestamp(a) - eventTimestamp(b) || a.sequence - b.sequence))
const firstTimestamp = computed(() => orderedEvents.value.length ? Math.min(...orderedEvents.value.map(eventTimestamp)) : 0)
const rows = computed<TimelineRow[]>(() => orderedEvents.value.map(event => ({ event, start: Math.max(0, eventTimestamp(event) - firstTimestamp.value), duration: eventDuration(event) })))
const groups = computed(() => {
  const grouped = new Map<string, TimelineRow[]>()
  for (const row of rows.value) grouped.set(row.event.type, [...(grouped.get(row.event.type) ?? []), row])
  return [...grouped].map(([type, groupRows]) => ({ type, rows: groupRows }))
})
const endTime = computed(() => Math.max(1, ...rows.value.map(row => row.start + row.duration)))
const ticks = computed(() => Array.from({ length: 5 }, (_, index) => ({ value: (endTime.value / 4) * index, position: index * 25 })))
const overlapCount = computed(() => Object.fromEntries(rows.value.map(row => [row.event.eventId, rows.value.filter(other => other.event.eventId !== row.event.eventId && other.start < row.start + row.duration && row.start < other.start + other.duration).length])))
function formatTime(value: number): string {
  return formatDuration(value).replace('ms', ' ms')
}
function barStyle(row: TimelineRow): Record<string, string> {
  return {
    left: `${(row.start / endTime.value) * 100}%`,
    width: `${Math.max((row.duration / endTime.value) * 100, 0.35)}%`,
  }
}
function syncTimelineScroll(event: Event): void {
  if (rulerCanvas.value)
    rulerCanvas.value.style.transform = `translateX(-${(event.currentTarget as HTMLElement).scrollLeft}px)`
}
</script>

<template>
  <section class="timeline-panel" aria-label="Event timeline">
    <div v-if="rows.length" class="timeline-ruler-header">
      <div class="timeline-ruler-spacer">
        <span class="timeline-title">TIMELINE</span>
      </div>
      <div class="timeline-ruler-scroll">
        <div ref="rulerCanvas" class="timeline-events-canvas">
          <div class="timeline-ruler">
            <i v-for="tick in ticks" :key="tick.position" class="timeline-grid-line" :style="{ left: `${tick.position}%` }" /><span v-for="tick in ticks" :key="`label-${tick.position}`" class="timeline-tick" :style="{ left: `${tick.position}%` }">{{ formatTime(tick.value) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="rows.length" class="timeline-scroll">
      <div class="timeline-layout">
        <div class="timeline-label-column">
          <div v-for="group in groups" :key="group.type" class="timeline-label-row">
            <span class="timeline-label" :title="group.type"><strong>{{ group.type }}</strong><small>{{ group.rows.length }} events</small></span>
          </div>
        </div>
        <div ref="eventsScroll" class="timeline-events-scroll" @scroll="syncTimelineScroll">
          <div class="timeline-events-canvas">
            <div v-for="group in groups" :key="group.type" class="timeline-track-row">
              <span class="timeline-track"><i v-for="tick in ticks" :key="`row-${group.type}-${tick.position}`" class="timeline-grid-line" :style="{ left: `${tick.position}%` }" /><button v-for="row in group.rows" :key="row.event.eventId" type="button" class="timeline-bar" :class="[`timeline-bar-${eventStatus(row.event)}`, row.event.eventId === selectedId ? 'timeline-bar-selected' : '', overlapCount[row.event.eventId] ? 'timeline-bar-parallel' : '']" :style="barStyle(row)" :title="`${eventName(row.event)} · ${eventAgent(row.event)} · ${formatTime(row.duration)} · ${overlapCount[row.event.eventId] ? 'parallel' : 'serial'}`" @click="emit('select', row.event.eventId)"><b v-if="row.duration > endTime * 0.08">{{ formatTime(row.duration) }}</b></button></span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="timeline-empty">
      No events match these filters
    </div>
  </section>
</template>
