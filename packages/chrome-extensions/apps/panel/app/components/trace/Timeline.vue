<script setup lang="ts">
import type { TraceRow } from '../../types/panel'
import { computed, useTemplateRef } from 'vue'

const props = defineProps<{ rows: TraceRow[], selectedId: string }>()
const emit = defineEmits<{ select: [id: string] }>()
const eventScroll = useTemplateRef<HTMLDivElement>('eventScroll')
const groups = computed(() => ['Agent', 'LLM', 'Tool'].map(type => ({ type, rows: props.rows.filter(row => row.event.type === type) })).filter(group => group.rows.length))
const endTime = computed(() => Math.max(1, ...props.rows.map(row => row.start + row.event.duration)))
const ticks = computed(() => Array.from({ length: 5 }, (_, index) => ({ position: index * 25, value: endTime.value * index / 4 })))
function formatTime(value: number): string {
  return value < 1000 ? `${Math.round(value)} ms` : `${(value / 1000).toFixed(1)} s`
}
function style(row: TraceRow): Record<string, string> {
  return { left: `${row.start / endTime.value * 100}%`, width: `${Math.max(row.event.duration / endTime.value * 100, 0.6)}%` }
}
function sync(event: Event): void {
  const target = event.currentTarget as HTMLElement
  eventScroll.value?.previousElementSibling?.setAttribute('style', `transform:translateX(-${target.scrollLeft}px)`)
}
</script>

<template>
  <section class="timeline-panel" aria-label="Event timeline">
    <div v-if="rows.length" class="timeline-ruler-header">
      <div class="timeline-label-column">
        <span class="timeline-title">TIMELINE</span>
      </div><div class="timeline-ruler-scroll">
        <div class="timeline-ruler">
          <i v-for="tick in ticks" :key="tick.position" class="grid-line" :style="{ left: `${tick.position}%` }" /><span v-for="tick in ticks" :key="`label-${tick.position}`" class="tick-label" :style="{ left: `${tick.position}%` }">{{ formatTime(tick.value) }}</span>
        </div>
      </div>
    </div>
    <div v-if="rows.length" class="timeline-scroll">
      <div class="timeline-label-column">
        <div v-for="group in groups" :key="group.type" class="timeline-label-row">
          <strong>{{ group.type }}</strong><small>{{ group.rows.length }} events</small>
        </div>
      </div><div ref="eventScroll" class="timeline-events-scroll" @scroll="sync">
        <div class="timeline-canvas">
          <div v-for="group in groups" :key="group.type" class="timeline-track-row">
            <span class="timeline-track"><i v-for="tick in ticks" :key="`${group.type}-${tick.position}`" class="grid-line" :style="{ left: `${tick.position}%` }" /><button v-for="row in group.rows" :key="row.event.id" class="timeline-bar" :class="[`timeline-bar-${row.event.status}`, row.event.id === selectedId ? 'is-selected' : '']" :style="style(row)" :title="`${row.event.name} · ${formatTime(row.event.duration)}`" @click="emit('select', row.event.id)"><b v-if="row.event.duration > endTime * 0.08">{{ formatTime(row.event.duration) }}</b></button></span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="timeline-empty">
      No events match these filters
    </div>
  </section>
</template>
