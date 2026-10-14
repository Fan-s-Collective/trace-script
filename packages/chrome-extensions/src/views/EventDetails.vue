<script setup lang="ts">
import type { TraceRecord, TraceSummary } from '@trace-script/core'
import type { DetailTab } from '@/types/trace-panel'
import { computed, shallowRef } from 'vue'
import { Detail, Overview, Payload, Raw, Relations, Timming, Usage } from '@/components/details'

const props = defineProps<{ record?: TraceRecord, traces: TraceSummary[] }>()
const emit = defineEmits<{ select: [id: string] }>()
const tabs: readonly DetailTab[] = ['Input / Output', 'Overview', 'Usage', 'Timing', 'Relations', 'Raw Events']
const tab = shallowRef<DetailTab>('Input / Output')
const trace = computed(() => props.traces.find(trace => trace.traceId === props.record?.traceId))
</script>

<template>
  <aside class="details-panel" aria-label="Call details">
    <template v-if="record">
      <Detail v-model:active="tab" :tabs="tabs" />
      <div class="details-content" role="tabpanel" :aria-label="tab">
        <Payload v-if="tab === 'Input / Output'" :record="record" />
        <Overview v-else-if="tab === 'Overview'" :record="record" />
        <Usage v-else-if="tab === 'Usage'" :record="record" />
        <Timming v-else-if="tab === 'Timing'" :record="record" />
        <Relations
          v-else-if="tab === 'Relations' && trace"
          :record="record"
          :trace="trace"
          @select="emit('select', $event)"
        />
        <Raw v-else :record="record" />
      </div>
    </template>
    <p v-else class="empty-state">
      Select a Trace or call to inspect details
    </p>
  </aside>
</template>

<style scoped>
.details-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: var(--panel-surface);
}
.details-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0.75rem;
  font-size: 0.8125rem;
}
</style>
