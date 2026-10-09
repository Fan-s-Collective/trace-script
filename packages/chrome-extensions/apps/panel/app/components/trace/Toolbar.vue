<script setup lang="ts">
import FilterBar from './FilterBar.vue'

defineProps<{ recording: boolean, filtersVisible: boolean, query: string, type: string, status: string, agent: string, onlyErrors: boolean, total: number, count: number }>()
const emit = defineEmits<{ 'toggleRecording': [], 'clear': [], 'toggleFilters': [], 'update:query': [value: string], 'update:type': [value: string], 'update:status': [value: string], 'update:agent': [value: string], 'toggleErrors': [] }>()
</script>

<template>
  <header class="toolbar">
    <div class="toolbar-left">
      <button class="icon-button" :class="recording ? 'is-recording' : 'is-paused'" :aria-label="recording ? 'Pause live updates' : 'Resume live updates'" @click="emit('toggleRecording')">
        {{ recording ? '●' : '▶' }}
      </button>
      <button class="icon-button" aria-label="Clear events" @click="emit('clear')">
        ⌫
      </button>
      <button class="icon-button" :class="filtersVisible ? 'is-active' : ''" aria-label="Toggle filters" :aria-pressed="filtersVisible" @click="emit('toggleFilters')">
        ≡
      </button>
      <FilterBar v-show="filtersVisible" :query="query" :type="type" :status="status" :agent="agent" :only-errors="onlyErrors" :total="total" :count="count" @update:query="emit('update:query', $event)" @update:type="emit('update:type', $event)" @update:status="emit('update:status', $event)" @update:agent="emit('update:agent', $event)" @toggle-errors="emit('toggleErrors')" />
    </div>
    <span class="toolbar-brand"><span class="brand-mark">⌁</span> Agent Trace</span>
  </header>
</template>
