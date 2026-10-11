<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import { eventTokens, eventUsage } from '../../utils/ui-model'

defineProps<{ event: TraceEventEnvelope }>()
</script>

<template>
  <dl class="details-fields">
    <dt class="details-field-label">
      Input tokens
    </dt><dd class="details-field-value">
      {{ eventUsage(event).input_tokens ?? '—' }}
    </dd><dt class="details-field-label">
      Output tokens
    </dt><dd class="details-field-value">
      {{ eventUsage(event).output_tokens ?? '—' }}
    </dd><dt class="details-field-label">
      Total tokens
    </dt><dd class="details-field-value">
      {{ eventTokens(event) ?? '—' }}
    </dd>
  </dl>
</template>
