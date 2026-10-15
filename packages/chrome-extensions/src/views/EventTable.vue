<script setup lang="ts">
import type { CallRecord } from '@trace-script/core'
import { timingText, tokenText } from '@/utils/ui-model'

defineProps<{ calls: CallRecord[], selectedId: string }>()
const emit = defineEmits<{ select: [id: string] }>()
const columns = ['Name', 'Type', 'Status', 'Model', 'Agent', 'Duration / return interval', 'Input tokens', 'Output tokens', 'Total tokens']
</script>

<template>
  <section class="event-table-wrap" aria-label="Trace calls">
    <div class="event-table-head">
      <span v-for="column in columns" :key="column">
        {{ column }}
      </span>
    </div>
    <div v-if="calls.length" class="event-table-body">
      <button
        v-for="call in calls"
        :key="call.id"
        type="button"
        class="event-row"
        :class="{ selected: call.id === selectedId }"
        :aria-pressed="call.id === selectedId"
        @click="emit('select', call.id)"
      >
        <span class="event-name" :title="`${call.name} · ${call.traceId} · ${call.callId}`">
          {{ call.name }}
          <small v-if="call.issues.length">
            ⚠ Data incomplete or conflicting
          </small>
        </span>
        <span>{{ call.kind }}</span>
        <span :class="`status-${call.status}`">
          {{ call.status }}
        </span>
        <span :title="call.model">
          {{ call.model }}
        </span>
        <span :title="call.agent">
          {{ call.agent }}
        </span>
        <span :title="call.kind === 'tool' ? 'Return interval includes waiting, scheduling and execution' : 'Observed request to final response interval'">
          {{ timingText(call.timing) }}
        </span>
        <span>{{ tokenText(call.tokens.input) }}</span>
        <span>{{ tokenText(call.tokens.output) }}</span>
        <span>{{ tokenText(call.tokens.total) }}</span>
      </button>
    </div>
    <p v-else class="empty-state">
      No calls match these filters
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
  display: grid;
  min-width: 59.5rem;
  grid-template-columns:
    minmax(10rem, 1.6fr) minmax(4rem, 0.55fr) minmax(6rem, 0.8fr) minmax(8rem, 1.2fr) minmax(6rem, 1fr)
    minmax(9rem, 1.3fr) repeat(3, minmax(5.5rem, 0.8fr));
  align-items: center;
  border-bottom: 1px solid var(--divider);
  font-size: 0.75rem;
}
.event-table-head {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--panel-surface);
  color: var(--text-muted);
}
.event-table-head span,
.event-row span {
  min-width: 0;
  padding: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.event-row {
  width: 100%;
  min-height: 2.75rem;
  border: 0;
  border-bottom: 1px solid var(--divider);
  background: var(--panel-bg);
  text-align: left;
}
.event-row:hover,
.event-row.selected {
  background: var(--control-hover);
}
.event-row.selected {
  box-shadow: inset 2px 0 var(--accent);
}
.event-row .event-name {
  display: flex;
  flex-direction: column;
}
.event-name small {
  color: var(--warning);
  font-size: 0.625rem;
}
</style>
