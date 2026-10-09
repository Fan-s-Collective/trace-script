<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import { computed } from 'vue'

const props = defineProps<{ events: TraceEventEnvelope[], status: string }>()
const entries = computed(() => props.events.map(event => JSON.stringify(event, null, 2)))
</script>

<template>
  <section class="min-w-0 flex-1 space-y-3 p-5" aria-label="Raw trace events">
    <p class="text-sm text-muted-foreground">
      {{ status }} {{ events.length }} events · Latest 1000 retained
    </p>
    <pre v-for="(entry, index) in entries" :key="index" class="overflow-auto rounded border border-border bg-muted p-4 text-xs leading-5">{{ entry }}</pre>
  </section>
</template>
