<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import { eventAgent, eventModel, eventStatus, eventTraceId } from '@/utils/ui-model'

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
