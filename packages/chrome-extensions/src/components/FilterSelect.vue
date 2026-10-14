<script setup lang="ts" generic="T extends string">
const props = defineProps<{ modelValue: T, options: readonly T[], label: string, allLabel: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

function handleChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  const option = props.options.find(option => option === value)
  if (option !== undefined)
    emit('update:modelValue', option)
}
</script>

<template>
  <label class="filter-control">
    <select
      class="filter-control-select"
      :value="modelValue"
      :aria-label="label"
      @change="handleChange"
    >
      <option v-for="option in options" :key="option" :value="option">
        {{ option === 'all' ? allLabel : option }}
      </option>
    </select>
  </label>
</template>

<style scoped>
.filter-control {
  display: flex;
  align-items: center;
  gap: 0.3125rem;
  color: var(--text-muted);
  white-space: nowrap;
}
.filter-control-select {
  width: auto;
  height: 1.75rem;
  border: 1px solid var(--control-border);
  border-radius: 0.1875rem;
  background: var(--control-bg);
  padding: 0 6px;
  field-sizing: content;
}
</style>
