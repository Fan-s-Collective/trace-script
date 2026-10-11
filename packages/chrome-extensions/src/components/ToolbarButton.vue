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
