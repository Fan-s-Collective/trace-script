<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import { eventName } from '../../utils/ui-model'

defineProps<{ related: TraceEventEnvelope[] }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <p class="details-section-label">
    Trace and event links
  </p><button v-for="item in related" :key="item.eventId" type="button" class="details-relation" @click="emit('select', item.eventId)">
    {{ eventName(item) }} · #{{ item.sequence }}
  </button><p v-if="!related.length" class="empty-state">
    No related events
  </p>
</template>
