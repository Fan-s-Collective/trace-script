<script setup lang="ts">
defineProps<{ modelValue: string, options: readonly string[], label: string, allLabel: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
function handleChange(event: Event): void {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <label class="filter-control"><select
    class="filter-control-select"
    :value="modelValue"
    :aria-label="label"
    @change="handleChange"
  >
    <option
      v-for="option in options"
      :key="option"
      :value="option"
    >
      {{ option === 'all' ? allLabel : option }}
    </option>
  </select></label>
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
