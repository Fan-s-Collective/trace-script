<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import { eventDuration, formatDuration } from '../../utils/ui-model'

defineProps<{ event: TraceEventEnvelope }>()
</script>

<template>
  <dl class="details-fields">
    <dt class="details-field-label">
      Duration
    </dt><dd class="details-field-value">
      {{ formatDuration(eventDuration(event)) }}
    </dd><dt class="details-field-label">
      Started
    </dt><dd class="details-field-value">
      {{ event.timestamp }}
    </dd><dt class="details-field-label">
      Ended
    </dt><dd class="details-field-value">
      {{ eventDuration(event) ? new Date(Date.parse(event.timestamp) + eventDuration(event)).toISOString() : '—' }}
    </dd>
  </dl>
</template>
