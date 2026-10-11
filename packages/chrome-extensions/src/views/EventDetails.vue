<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import type { DetailTab } from '../types/trace-panel'
import { computed, ref, watch } from 'vue'
import DetailTabs from '../components/details/DetailTabs.vue'
import OverviewTab from '../components/details/OverviewTab.vue'
import PayloadTab from '../components/details/PayloadTab.vue'
import RawTab from '../components/details/RawTab.vue'
import RelationsTab from '../components/details/RelationsTab.vue'
import TimingTab from '../components/details/TimingTab.vue'
import UsageTab from '../components/details/UsageTab.vue'
import { eventPayload } from '../utils/ui-model'

const props = defineProps<{ event?: TraceEventEnvelope, siblings: TraceEventEnvelope[] }>()
const emit = defineEmits<{ select: [id: string] }>()
const tabs: readonly DetailTab[] = ['Overview', 'Usage', 'Payload', 'Timing', 'Relations', 'Raw']
const tab = ref<DetailTab>('Overview')
watch(() => props.event?.eventId, () => {
  tab.value = 'Overview'
})
const payload = computed(() => props.event ? eventPayload(props.event) : {})
const related = computed(() => props.event ? props.siblings.filter(item => item.traceId === props.event!.traceId && item.eventId !== props.event!.eventId) : [])
</script>

<template>
  <aside class="details-panel" aria-label="Event details">
    <template v-if="event">
      <DetailTabs v-model:active="tab" :tabs="tabs" />
      <div class="details-content min-h-0 flex-1 overflow-auto">
        <OverviewTab v-if="tab === 'Overview'" :event="event" />
        <UsageTab v-else-if="tab === 'Usage'" :event="event" />
        <PayloadTab v-else-if="tab === 'Payload'" :payload="payload" />
        <TimingTab v-else-if="tab === 'Timing'" :event="event" />
        <RelationsTab v-else-if="tab === 'Relations'" :related="related" @select="emit('select', $event)" />
        <RawTab v-else :value="event" />
      </div>
    </template>
    <p v-else class="empty-state">
      Select an event to inspect details
    </p>
  </aside>
</template>
