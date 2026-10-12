<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import { eventSummary } from '../../trace-display'
import { eventAgent, eventModel, eventName, eventStatus, eventTraceId } from '../../utils/ui-model'

defineProps<{ event: TraceEventEnvelope }>()
</script>

<template>
  <h2 class="overview-title">
    {{ eventName(event) }}
  </h2><p class="detail-summary">
    {{ eventSummary(event) }}
  </p>
  <dl class="details-fields">
    <dt class="details-field-label">
      Type
    </dt><dd class="details-field-value">
      {{ event.type }}
    </dd><dt class="details-field-label">
      Status
    </dt><dd class="details-field-value" :class="`status-${eventStatus(event)}`">
      {{ eventStatus(event) }}
    </dd><dt class="details-field-label">
      Agent
    </dt><dd class="details-field-value">
      {{ eventAgent(event) }}
    </dd><dt class="details-field-label">
      Model
    </dt><dd class="details-field-value">
      {{ eventModel(event) }}
    </dd><dt class="details-field-label">
      Trace ID
    </dt><dd class="details-field-value">
      {{ eventTraceId(event) }}
    </dd><dt class="details-field-label">
      Event ID
    </dt><dd class="details-field-value">
      {{ event.eventId }}
    </dd><dt class="details-field-label">
      Sequence
    </dt><dd class="details-field-value">
      #{{ event.sequence }}
    </dd><dt class="details-field-label">
      Timestamp
    </dt><dd class="details-field-value">
      {{ event.timestamp }}
    </dd>
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
