<script setup lang="ts">
import type { CallRecord } from '@trace-script/core'
import type { VisibleTrace } from '@/types/trace-panel'
import { computed } from 'vue'
import { formatDuration, timingText } from '@/utils/ui-model'

const props = defineProps<{ groups: VisibleTrace[], selectedId: string }>()
const emit = defineEmits<{ select: [id: string] }>()
const timestamps = computed(() => props.groups.flatMap(group => [group.trace.timing, ...group.calls.map(call => call.timing)]).flatMap(timing => [timing.start, timing.end].flatMap(value => value ? [Date.parse(value)] : [])).filter(Number.isFinite))
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
      <section v-for="group in groups" :key="group.trace.id">
        <button
          class="timeline-trace"
          :class="{ selected: group.trace.id === selectedId }"
          :title="`${group.trace.timing.start ?? 'Missing start'} → ${group.trace.timing.end ?? 'Not ended'}`"
          @click="emit('select', group.trace.id)"
        >
          {{ group.trace.traceId }} · Trace interval: {{ timingText(group.trace.timing, group.trace.status === 'running') }}
        </button>
        <div
          v-for="call in group.calls"
          :key="call.id"
          class="timeline-row"
          :class="{ selected: call.id === selectedId }"
        >
          <button class="timeline-label" :title="`${call.kind}: ${call.name} · ${call.callId}`" @click="emit('select', call.id)">
            {{ call.name }}
            <small>{{ call.kind }}</small>
          </button>
          <div class="timeline-track">
            <button
              class="timeline-bar"
              :class="[`bar-${call.status}`, { marker: call.timing.duration === undefined }]"
              :style="barStyle(call)"
              :aria-label="`${call.name}: ${call.kind === 'tool' ? 'Return interval' : 'Duration'} ${timingText(call.timing)}; ${call.status}`"
              :title="`${call.name} · ${call.kind === 'tool' ? 'Return interval' : 'Duration'}: ${timingText(call.timing)} · ${call.status}`"
              @click="emit('select', call.id)"
            >
              <span v-if="(call.timing.duration ?? 0) > span * 0.1">
                {{ timingText(call.timing) }}
              </span>
            </button>
          </div>
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
.timeline-trace {
  display: block;
  width: 100%;
  min-width: 41.25rem;
  min-height: 1.75rem;
  border: 0;
  border-bottom: 1px solid var(--divider);
  padding: 6px 0.75rem;
  background: var(--panel-surface);
  text-align: left;
  color: var(--text-muted);
  font-size: 0.6875rem;
}
.timeline-row {
  height: 1.875rem;
  border-bottom: 1px solid var(--divider);
}
.timeline-label {
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
.selected {
  background: var(--control-hover);
  box-shadow: inset 2px 0 var(--accent);
}
.selected .timeline-bar {
  outline: 1px solid white;
}
</style>
