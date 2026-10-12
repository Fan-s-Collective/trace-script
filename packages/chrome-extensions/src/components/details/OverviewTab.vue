<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import { eventSummary } from '@/trace-display'
import { eventAgent, eventModel, eventName, eventStatus, eventTraceId } from '@/utils/ui-model'

const props = defineProps<{ event: TraceEventEnvelope }>()

const fields = [
  { label: 'Type', value: (event: TraceEventEnvelope) => event.type, className: () => '' },
  { label: 'Status', value: eventStatus, className: (event: TraceEventEnvelope) => `status-${eventStatus(event)}` },
  { label: 'Agent', value: eventAgent, className: () => '' },
  { label: 'Model', value: eventModel, className: () => '' },
  { label: 'Trace ID', value: eventTraceId, className: () => '' },
  { label: 'Event ID', value: (event: TraceEventEnvelope) => event.eventId, className: () => '' },
  { label: 'Sequence', value: (event: TraceEventEnvelope) => `#${event.sequence}`, className: () => '' },
  { label: 'Timestamp', value: (event: TraceEventEnvelope) => event.timestamp, className: () => '' },
] as const
</script>

<template>
  <h2 class="overview-title">
    {{ eventName(event) }}
  </h2>
  <p class="detail-summary">
    {{ eventSummary(event) }}
  </p>
  <dl class="details-fields">
    <template v-for="field in fields" :key="field.label">
      <dt class="details-field-label">
        {{ field.label }}
      </dt>
      <dd class="details-field-value" :class="field.className(props.event)">
        {{ field.value(props.event) }}
      </dd>
    </template>
  </dl>
</template>

<style scoped>
.overview-title {
  margin: 0 0 0.375rem;
  font-size: 0.875rem;
}
.detail-summary {
  margin: 0 0 0.75rem;
  color: var(--text-muted);
  line-height: 1.5;
}
</style>
