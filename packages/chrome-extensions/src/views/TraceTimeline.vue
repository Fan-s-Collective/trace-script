<script setup lang="ts">
import type { CallRecord } from '@trace-script/core'
import { computed } from 'vue'
import { formatDuration, timingText } from '@/utils/ui-model'

const props = defineProps<{ calls: CallRecord[], selectedId: string }>()
const emit = defineEmits<{ select: [id: string] }>()
const kinds: CallRecord['kind'][] = ['model', 'tool']
const groups = computed(() => kinds.map(kind => ({ kind, calls: props.calls.filter(call => call.kind === kind) })).filter(group => group.calls.length))
const timestamps = computed(() => props.calls.flatMap(call => [call.timing.start, call.timing.end].flatMap(value => value ? [Date.parse(value)] : [])).filter(Number.isFinite))
const first = computed(() => timestamps.value.length ? Math.min(...timestamps.value) : 0)
const span = computed(() => Math.max(1, ...timestamps.value.map(value => value - first.value)))
const ticks = computed(() => Array.from({ length: 5 }, (_, index) => ({ label: formatDuration(span.value * index / 4), position: index * 25 })))
function barStyle(call: CallRecord): Record<string, string> {
  const anchor = call.timing.start ?? call.timing.end
  const offset = anchor ? Date.parse(anchor) - first.value : 0
  return { left: `${offset / span.value * 100}%`, width: `${Math.max((call.timing.duration ?? 0) / span.value * 100, 0.5)}%` }
}
</script>

<template>
  <section class="timeline-panel" aria-label="Call timeline">
    <div v-if="groups.length" class="timeline-scroll">
      <div class="timeline-ruler">
        <strong>TIMELINE</strong>
        <div>
          <span v-for="tick in ticks" :key="tick.position" :style="{ left: `${tick.position}%` }">
            {{ tick.label }}
          </span>
        </div>
      </div>
      <section
        v-for="group in groups"
        :key="group.kind"
        class="timeline-row"
        :aria-label="`${group.kind} calls`"
      >
        <div class="timeline-label">
          {{ group.kind }}
          <small>{{ group.calls.length }} calls</small>
        </div>
        <div class="timeline-track">
          <button
            v-for="call in group.calls"
            :key="call.id"
            class="timeline-bar"
            :class="[`bar-${call.status}`, { marker: call.timing.duration === undefined, selected: call.id === selectedId }]"
            :style="barStyle(call)"
            :aria-pressed="call.id === selectedId"
            :aria-label="`${call.name} · ${call.traceId} · ${call.callId}: ${call.kind === 'tool' ? 'Return interval' : 'Duration'} ${timingText(call.timing)}; ${call.status}`"
            :title="`${call.name} · ${call.traceId} · ${call.callId} · ${call.kind === 'tool' ? 'Return interval' : 'Duration'}: ${timingText(call.timing)} · ${call.status}`"
            @click="emit('select', call.id)"
          >
            <span v-if="(call.timing.duration ?? 0) > span * 0.1">
              {{ timingText(call.timing) }}
            </span>
          </button>
        </div>
      </section>
    </div>
    <p v-else class="empty-state">
      No calls match these filters
    </p>
  </section>
</template>

<style scoped>
.timeline-panel {
  min-height: 0;
  overflow: hidden;
  background: var(--panel-bg);
}
.timeline-scroll {
  height: 100%;
  overflow: auto;
}
.timeline-ruler,
.timeline-row {
  display: grid;
  min-width: 41.25rem;
  grid-template-columns: 12.5rem minmax(0, 1fr);
}
.timeline-ruler {
  position: sticky;
  top: 0;
  z-index: 2;
  height: 1.625rem;
  background: var(--panel-raised);
  font-size: 0.6875rem;
}
.timeline-ruler strong {
  padding: 6px 0.75rem;
}
.timeline-ruler > div {
  position: relative;
  margin-right: 2.25rem;
}
.timeline-ruler span {
  position: absolute;
  padding-top: 6px;
  white-space: nowrap;
}
.timeline-row {
  height: 1.875rem;
  border-bottom: 1px solid var(--divider);
}
.timeline-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  overflow: hidden;
  border: 0;
  border-right: 1px solid var(--divider);
  padding: 0 0.75rem;
  background: transparent;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
}
.timeline-label small {
  color: var(--text-muted);
}
.timeline-track {
  position: relative;
  margin-right: 2.25rem;
  background: linear-gradient(to right, rgb(154 160 166 / 18%) 1px, transparent 1px) 0 0 / 25% 100% repeat-x;
}
.timeline-bar {
  position: absolute;
  top: 7px;
  height: 1rem;
  min-width: 3px;
  border: 0;
  border-radius: 2px;
  overflow: hidden;
  padding: 0 4px;
  background: #3aa987;
  color: white;
  font-size: 0.6875rem;
  text-align: left;
  white-space: nowrap;
}
.bar-running,
.bar-waiting {
  background: #d39a2e;
}
.bar-failed {
  background: #d05a55;
}
.bar-cancelled,
.bar-incomplete,
.bar-unknown,
.bar-interrupted {
  background: #78818a;
}
.marker {
  border: 1px dashed var(--text-muted);
}
.timeline-bar.selected {
  z-index: 1;
  outline: 1px solid white;
}
</style>
