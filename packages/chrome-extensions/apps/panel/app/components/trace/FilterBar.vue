<script setup lang="ts">
defineProps<{ query: string, type: string, status: string, agent: string, onlyErrors: boolean, total: number, count: number }>()
const emit = defineEmits<{ 'update:query': [value: string], 'update:type': [value: string], 'update:status': [value: string], 'update:agent': [value: string], 'toggleErrors': [] }>()
const typeOptions = ['all', 'Agent', 'LLM', 'Tool']
const statusOptions = ['all', 'success', 'running', 'failed', 'cancelled']
const agentOptions = ['all', 'planner', 'researcher', 'writer', 'reviewer']
</script>

<template>
  <section class="filter-bar" aria-label="Event filters">
    <input :value="query" type="search" placeholder="Search name or ID…" aria-label="Search events" @input="emit('update:query', ($event.target as HTMLInputElement).value)">
    <select :value="type" aria-label="Filter by type" @change="emit('update:type', ($event.target as HTMLSelectElement).value)">
      <option v-for="option in typeOptions" :key="option" :value="option">
        {{ option === 'all' ? 'All types' : option }}
      </option>
    </select>
    <select :value="status" aria-label="Filter by status" @change="emit('update:status', ($event.target as HTMLSelectElement).value)">
      <option v-for="option in statusOptions" :key="option" :value="option">
        {{ option === 'all' ? 'All statuses' : option }}
      </option>
    </select>
    <select :value="agent" aria-label="Filter by agent" @change="emit('update:agent', ($event.target as HTMLSelectElement).value)">
      <option v-for="option in agentOptions" :key="option" :value="option">
        {{ option === 'all' ? 'All agents' : option }}
      </option>
    </select>
    <button class="error-filter" :class="onlyErrors ? 'is-active' : ''" :aria-pressed="onlyErrors" @click="emit('toggleErrors')">
      Only errors
    </button>
    <span class="filter-count">{{ count }} of {{ total }}</span>
  </section>
</template>
