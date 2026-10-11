<script setup lang="ts">
defineProps<{ modelValue: string, options: readonly string[], label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
function handleChange(event: Event): void {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <label class="filter-control"><span>{{ label }}</span><select
    :value="modelValue"
    @change="handleChange"
  >
    <option v-for="option in options" :key="option" :value="option">{{ option === 'all' ? 'All' : option }}
    </option>
  </select></label>
</template>
