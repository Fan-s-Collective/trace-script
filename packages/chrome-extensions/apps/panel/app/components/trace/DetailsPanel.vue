<script setup lang="ts">
import type { DetailTab, PanelEvent } from '../../types/panel'
import { computed, shallowRef } from 'vue'

const props = defineProps<{ row: PanelEvent | false, siblings: PanelEvent[] }>()
const emit = defineEmits<{ select: [id: string] }>()
const active = shallowRef<DetailTab>('Overview')
const tabs: DetailTab[] = ['Overview', 'Payload', 'Relations', 'Raw']
const related = computed(() => {
  const current = props.row
  return current ? props.siblings.filter(item => item.id !== current.id && (item.parentId === current.id || current.parentId === item.id || item.traceId === current.traceId)) : []
})
const children = computed(() => {
  const current = props.row
  return current ? props.siblings.filter(item => item.parentId === current.id) : []
})
function duration(item: number): string {
  return item < 1000 ? `${item}ms` : `${(item / 1000).toFixed(1)}s`
}
</script>

<template>
  <aside class="details-panel">
    <template v-if="row">
      <nav class="details-tabs" aria-label="Detail views" role="tablist">
        <button v-for="tab in tabs" :key="tab" role="tab" :aria-selected="active === tab" :class="active === tab ? 'is-active' : ''" @click="active = tab">
          {{ tab }}
        </button>
      </nav>
      <div class="details-content">
        <template v-if="active === 'Overview'">
          <dl class="details-fields">
            <template v-for="entry in [['Name', row.name], ['Type', row.type], ['Status', row.status], ['Agent', row.agent], ['Model', row.model], ['Tokens', row.tokensReported ? row.tokens : '—'], ['Duration', row.durationReported ? duration(row.duration) : '—'], ['Started', new Date(row.timestamp).toLocaleTimeString()], ['Event ID', row.id], ['Session ID', row.sessionId], ['Trace ID', row.traceId], ['Parent ID', row.parentId || '—']]" :key="entry[0]">
              <dt>{{ entry[0] }}</dt><dd>{{ entry[1] }}</dd>
            </template>
          </dl>
        </template>
        <template v-else-if="active === 'Payload'">
          <div class="details-section-label">
            Event payload
          </div><pre class="details-code">{{ JSON.stringify(row.payload, null, 2) }}</pre>
        </template>
        <template v-else-if="active === 'Relations'">
          <div class="details-section-label">
            Parent and children
          </div><button v-if="row.parentId" class="relation-button" @click="emit('select', row.parentId)">
            Parent: {{ row.parentId }}
          </button><button v-for="item in children" :key="item.id" class="relation-button" @click="emit('select', item.id)">
            Child: {{ item.name }}
          </button><div class="details-section-label spaced">
            Trace links
          </div><button v-for="item in related" :key="item.id" class="relation-button" @click="emit('select', item.id)">
            {{ item.name }} · {{ item.id }}
          </button><p v-if="!row.parentId && !children.length && !related.length" class="detail-note">
            No related events
          </p>
        </template>
        <pre v-else class="details-code">{{ JSON.stringify(row, null, 2) }}</pre>
      </div>
    </template>
    <div v-else class="details-empty">
      Select an event to inspect details
    </div>
  </aside>
</template>
