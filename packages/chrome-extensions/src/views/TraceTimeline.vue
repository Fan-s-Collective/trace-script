<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import { computed, shallowRef } from 'vue'
import { eventAgent, eventDuration, eventName, eventStatus, eventTimestamp, formatDuration } from '@/utils/ui-model'

interface TimelineRow {
  event: TraceEventEnvelope
  start: number
  duration: number
}

const props = defineProps<{ events: TraceEventEnvelope[], selectedId: string }>()
const emit = defineEmits<{ select: [id: string] }>()
const rulerCanvas = shallowRef<HTMLElement>()
const eventsScroll = shallowRef<HTMLElement>()
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
  if (!rulerCanvas.value)
    return
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
            <span v-for="tick in ticks" :key="`label-${tick.position}`" class="timeline-tick">{{ formatTime(tick.value) }}</span>
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
              <span class="timeline-track"><button v-for="row in group.rows" :key="row.event.eventId" type="button" class="timeline-bar" :class="[`timeline-bar-${eventStatus(row.event)}`, row.event.eventId === selectedId ? 'timeline-bar-selected' : '', overlapCount[row.event.eventId] ? 'timeline-bar-parallel' : '']" :style="barStyle(row)" :title="`${eventName(row.event)} · ${eventAgent(row.event)} · ${formatTime(row.duration)} · ${overlapCount[row.event.eventId] ? 'parallel' : 'serial'}`" @click="emit('select', row.event.eventId)"><b v-if="row.duration > endTime * 0.08">{{ formatTime(row.duration) }}</b></button></span>
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

<style scoped>
.timeline-panel {
  display: flex;
  height: 100%;
  flex: 0 0 auto;
  flex-direction: column;
  background: var(--panel-bg);
}
.timeline-scroll {
  min-height: 0;
  flex: 1;
  overflow: hidden auto;
}
.timeline-layout,
.timeline-ruler-header {
  display: grid;
  min-width: 0;
  grid-template-columns: 13.125rem minmax(0, 1fr);
}
.timeline-label-column {
  min-width: 0;
  border-right: 1px solid var(--divider);
  background: var(--panel-bg);
}
.timeline-ruler-spacer,
.timeline-label-row {
  height: 2rem;
  line-height: 2rem;
  border-bottom: 1px solid var(--divider);
}
.timeline-ruler-header .timeline-ruler-spacer {
  height: 1.1875rem;
  line-height: 1.1875rem;
}
.timeline-ruler-scroll {
  min-width: 0;
  overflow: hidden;
}
.timeline-ruler-scroll .timeline-events-canvas {
  will-change: transform;
}
.timeline-ruler-spacer {
  display: flex;
  align-items: center;
  padding: 0 0.625rem;
}
.timeline-label-row:last-child {
  border-bottom: 0;
}
.timeline-events-scroll {
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
}
.timeline-events-canvas {
  min-width: 27.5rem;
  user-select: none;
}
.timeline-ruler {
  display: grid;
  height: 1.5rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
  border-bottom: 1px solid var(--divider);
  background:
    linear-gradient(to right, rgb(154 160 166 / 18%) 1px, transparent 1px) 0 0 / 25% 100% repeat-x,
    var(--panel-bg);
  color: var(--text-muted);
}
.timeline-title {
  color: var(--text);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}
.timeline-tick {
  font-size: 0.75rem;
  padding-top: 0.125rem;
  white-space: nowrap;
}
.timeline-tick:not(:first-child):not(:last-child) {
  text-align: center;
}
.timeline-tick:last-child {
  grid-column: 4;
  justify-self: end;
  text-align: right;
}
.timeline-track-row {
  position: relative;
  width: 100%;
  min-height: 1.3125rem;
  border-bottom: 1px solid rgb(53 54 58 / 65%);
  background: transparent;
  color: var(--text);
  text-align: left;
}
.timeline-label-row:hover,
.timeline-track-row:hover {
  background: var(--control-hover);
}
.timeline-label-row:hover {
  box-shadow: inset 0.125rem 0 var(--accent);
}
.timeline-label {
  display: flex;
  height: 100%;
  min-width: 0;
  align-items: center;
  gap: 0.375rem;
  overflow: hidden;
  padding: 0 0.625rem 0 0.75rem;
}
.timeline-label strong,
.timeline-label small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.timeline-label strong {
  font-size: 0.75rem;
  font-weight: 500;
}
.timeline-label small {
  margin-left: auto;
  color: var(--text-muted);
  font-size: 0.75rem;
}
.timeline-track {
  position: relative;
  display: block;
  width: 100%;
  min-height: 1.3125rem;
  background: linear-gradient(to right, rgb(154 160 166 / 18%) 1px, transparent 1px) 0 0 / 25% 100% repeat-x;
}
.timeline-bar {
  position: absolute;
  z-index: 1;
  top: 0.25rem;
  display: flex;
  min-width: 0.1875rem;
  height: 0.6875rem;
  align-items: center;
  overflow: hidden;
  border: 0;
  border-radius: 0.125rem;
  background: var(--accent);
  padding: 0;
  color: #fff;
  font-size: 0.75rem;
  white-space: nowrap;
  cursor: pointer;
}
.timeline-bar b {
  padding: 0 0.3125rem;
  font-weight: 500;
}
.timeline-bar-success {
  background: #3aa987;
}
.timeline-bar-running {
  background: #d39a2e;
}
.timeline-bar-failed {
  background: #d05a55;
}
.timeline-bar-cancelled {
  background: #78818a;
}
.timeline-bar-parallel {
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 35%),
    0 0 0 1px rgb(138 180 248 / 35%);
}
.timeline-bar-selected {
  box-shadow:
    inset 0 0 0 1px #fff,
    0 0 0 1px var(--accent);
}
.timeline-empty {
  display: flex;
  min-height: 0;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  color: var(--text-muted);
}
</style>
