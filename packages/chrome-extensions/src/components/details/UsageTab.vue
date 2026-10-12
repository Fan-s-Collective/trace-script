<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import { eventTokens, eventUsage } from '@/utils/ui-model'

const props = defineProps<{ event: TraceEventEnvelope }>()

const fields = [
  { label: 'Input tokens', value: (event: TraceEventEnvelope) => String(eventUsage(event).input_tokens ?? '—') },
  { label: 'Output tokens', value: (event: TraceEventEnvelope) => String(eventUsage(event).output_tokens ?? '—') },
  { label: 'Total tokens', value: (event: TraceEventEnvelope) => String(eventTokens(event) ?? '—') },
] as const
</script>

<template>
  <dl class="details-fields">
    <template v-for="field in fields" :key="field.label">
      <dt class="details-field-label">
        {{ field.label }}
      </dt>
      <dd class="details-field-value">
        {{ field.value(props.event) }}
      </dd>
    </template>
  </dl>
</template>
