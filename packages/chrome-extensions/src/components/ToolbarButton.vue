<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  active?: boolean
  tone?: 'default' | 'danger'
}>(), {
  active: false,
  tone: 'default',
})
</script>

<template>
  <button
    type="button" class="toolbar-button"
    :class="[{ 'toolbar-button-active': active }, `toolbar-button-${tone}`]" :aria-label="label"
  >
    <slot>{{ label }}</slot>
  </button>
</template>

<style scoped>
.toolbar-button {
  height: 1.75rem;
  border: 1px solid var(--control-border);
  border-radius: 0.1875rem;
  background: var(--control-bg);
  padding: 0 0.5625rem;
  white-space: nowrap;
}
.toolbar-button:hover,
.toolbar-button-active {
  background: var(--control-hover);
}
</style>
