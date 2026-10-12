<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import { eventName } from '@/utils/ui-model'

defineProps<{ related: TraceEventEnvelope[] }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <p class="details-section-label">
    Trace and event links
  </p>
  <button
    v-for="item in related"
    :key="item.eventId"
    type="button"
    class="details-relation"
    @click="emit('select', item.eventId)"
  >
    {{ eventName(item) }} · #{{ item.sequence }}
  </button>
  <p v-if="!related.length" class="empty-state">
    No related events
  </p>
</template>

<style scoped>
.details-relation {
  display: block;
  width: 100%;
  margin-bottom: 0.5rem;
  border: 1px solid var(--control-border);
  border-radius: 0.1875rem;
  background: var(--control-bg);
  padding: 0.625rem 0.75rem;
  color: var(--text);
  text-align: left;
}
.details-relation:hover {
  border-color: var(--accent);
  background: var(--control-hover);
}
</style>
