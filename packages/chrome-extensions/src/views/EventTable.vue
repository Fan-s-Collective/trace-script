<script setup lang="ts">
import type { VisibleTrace } from '@/types/trace-panel'
import TraceSummaryRow from '@/components/TraceSummaryRow.vue'
import { timingText, tokenText } from '@/utils/ui-model'

defineProps<{ groups: VisibleTrace[], selectedId: string, collapsedIds: string[] }>()
const emit = defineEmits<{ select: [id: string], toggle: [id: string] }>()
const columns = ['Name', 'Type', 'Status', 'Model', 'Agent', 'Duration / return interval', 'Input tokens', 'Output tokens', 'Total tokens']
</script>

<template>
  <section class="event-table-wrap" aria-label="Trace calls">
    <div class="event-table-head">
      <span v-for="column in columns" :key="column">
        {{ column }}
      </span>
    </div>
    <div v-if="groups.length" class="event-table-body">
      <section v-for="group in groups" :key="group.trace.id" class="trace-group">
        <TraceSummaryRow
          :trace="group.trace"
          :matched="group.calls.length"
          :collapsed="collapsedIds.includes(group.trace.id)"
          :selected="selectedId === group.trace.id"
          @select="emit('select', group.trace.id)"
          @toggle="emit('toggle', group.trace.id)"
        />
        <div v-show="!collapsedIds.includes(group.trace.id)">
          <button
            v-for="call in group.calls"
            :key="call.id"
            type="button"
            class="event-row"
            :class="{ selected: call.id === selectedId }"
            :aria-pressed="call.id === selectedId"
            @click="emit('select', call.id)"
          >
            <span class="event-name" :title="call.name">
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
          <p v-if="!group.calls.length && group.trace.errors.length" class="trace-error">
            {{ group.trace.errors.join('; ') }}
          </p>
        </div>
      </section>
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
  min-width: 53.75rem;
  grid-template-columns: minmax(9.375rem, 1fr) 3.75rem 5.625rem 6.875rem 4.6875rem 8.125rem 4.6875rem 5rem 5rem;
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
  padding-left: 1.5rem;
}
.event-name small {
  color: var(--warning);
  font-size: 0.625rem;
}
.trace-error {
  margin: 0;
  padding: 0.75rem;
  color: var(--danger);
}
</style>
