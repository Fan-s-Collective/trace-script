<script setup lang="ts">
import type { TraceSummary } from '@trace-script/core'
import { amountText, timingText } from '@/utils/ui-model'

defineProps<{ trace: TraceSummary, matched: number, collapsed: boolean, selected: boolean }>()
const emit = defineEmits<{ select: [], toggle: [] }>()
</script>

<template>
  <div class="trace-summary" :class="{ selected }">
    <button
      type="button"
      class="collapse-button"
      :aria-expanded="!collapsed"
      :aria-label="`${collapsed ? 'Expand' : 'Collapse'} ${trace.traceId}`"
      @click="emit('toggle')"
    >
      {{ collapsed ? '▸' : '▾' }}
    </button>
    <button
      type="button"
      class="summary-button"
      :aria-pressed="selected"
      @click="emit('select')"
    >
      <span class="summary-title">
        {{ trace.traceId }}
        <b :class="`status-${trace.status}`">
          {{ trace.status }}
        </b>
        <span>{{ matched }} / {{ trace.calls.length }} calls</span>
        <span v-if="trace.issues.length" class="status-incomplete">
          ⚠ {{ trace.issues.join('; ') }}
        </span>
      </span>
      <span class="summary-metrics">
        Start: {{ trace.timing.start ?? '—' }} · Duration: {{ timingText(trace.timing, trace.status === 'running') }} · Input: {{ amountText(trace.tokens.input) }} · Output: {{ amountText(trace.tokens.output) }} · Total: {{ amountText(trace.tokens.total) }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.trace-summary {
  display: flex;
  min-width: 53.75rem;
  border-bottom: 1px solid var(--divider);
  background: var(--panel-raised);
}
.trace-summary.selected {
  box-shadow: inset 2px 0 var(--accent);
}
.collapse-button {
  flex: 0 0 1.75rem;
  border: 0;
  background: transparent;
  color: var(--accent);
}
.summary-button {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  padding: 8px 0.75rem 8px 0;
  text-align: left;
}
.summary-title {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  font-size: 0.75rem;
  overflow-wrap: anywhere;
}
.summary-title b {
  font-weight: 500;
}
.summary-metrics {
  display: block;
  margin-top: 6px;
  font-size: 0.6875rem;
  color: var(--text-muted);
  overflow-wrap: anywhere;
}
</style>
