<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import { TRACE_EVENT_TYPE } from '@trace-script/metadata'
import FilterSelect from '../components/FilterSelect.vue'
import ToolbarButton from '../components/ToolbarButton.vue'
import { TRACE_FILTER_VALUE, TRACE_STATUS } from '../utils/ui-model'

defineProps<{
  total: number
  visible: number
  preview: boolean
  recording: boolean
  filtersVisible: boolean
  onlyErrors: boolean
  agents: readonly string[]
}>()

const emit = defineEmits<{
  clear: []
  add: []
  toggleRecording: []
  toggleFilters: []
  toggleErrors: []
}>()
const query = defineModel<string>('query', { required: true })
const type = defineModel<typeof TRACE_FILTER_VALUE.ALL | TraceEventEnvelope['type']>('type', { required: true })
const status = defineModel<typeof TRACE_FILTER_VALUE.ALL | typeof TRACE_STATUS[keyof typeof TRACE_STATUS]>('status', { required: true })
const agent = defineModel<string>('agent', { required: true })

const typeOptions = [
  TRACE_FILTER_VALUE.ALL,
  TRACE_EVENT_TYPE.TRACE_START,
  TRACE_EVENT_TYPE.MODEL_REQUEST,
  TRACE_EVENT_TYPE.MODEL_RESPONSE,
  TRACE_EVENT_TYPE.TOOL_RESULT,
  TRACE_EVENT_TYPE.TRACE_END,
  TRACE_EVENT_TYPE.TRACE_ERROR,
] as const

const statusOptions = [
  TRACE_FILTER_VALUE.ALL,
  TRACE_STATUS.SUCCESS,
  TRACE_STATUS.RUNNING,
  TRACE_STATUS.FAILED,
  TRACE_STATUS.CANCELLED,
] as const
</script>

<template>
  <header class="trace-toolbar">
    <div class="toolbar-main">
      <button type="button" class="icon-button" :class="recording ? 'is-live' : 'is-paused'" :aria-label="recording ? 'Pause live updates' : 'Resume live updates'" :title="recording ? 'Pause live updates' : 'Resume live updates'" @click="emit('toggleRecording')">
        {{ recording ? '●' : '▶' }}
      </button>
      <button type="button" class="icon-button" aria-label="Clear events" title="Clear events" @click="emit('clear')">
        ⌫
      </button>
      <button type="button" class="icon-button" :class="filtersVisible ? 'is-active' : ''" :aria-pressed="filtersVisible" aria-label="Toggle filters" title="Toggle filters" @click="emit('toggleFilters')">
        ≡
      </button>
      <span class="trace-brand"><span class="trace-mark">✦</span><strong>Agent Trace</strong><span v-if="preview" class="preview-badge">Preview</span></span>
      <span class="toolbar-divider" />
      <div v-show="filtersVisible" class="filter-bar">
        <input v-model="query" class="trace-search" type="search" placeholder="Search name or ID…" aria-label="Search name or ID">
        <FilterSelect v-model="type" label="Type" :options="typeOptions" />
        <FilterSelect v-model="status" label="Status" :options="statusOptions" />
        <FilterSelect v-model="agent" label="Agent" :options="agents" />
        <button type="button" class="filter-button" :class="onlyErrors ? 'is-error' : ''" @click="emit('toggleErrors')">
          Only errors
        </button>
      </div>
      <span class="event-count">{{ visible }} of {{ total }}</span>
      <ToolbarButton v-if="preview" label="Add 10 events" @click="emit('add')">
        Add 10 events
      </ToolbarButton>
    </div>
  </header>
</template>
