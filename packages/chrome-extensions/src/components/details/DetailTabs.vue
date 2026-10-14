<script setup lang="ts">
import type { DetailTab } from '@/types/trace-panel'

defineProps<{ tabs: readonly DetailTab[], active: DetailTab }>()
const emit = defineEmits<{ 'update:active': [tab: DetailTab] }>()
</script>

<template>
  <nav class="details-tabs" aria-label="Detail views" role="tablist">
    <button
      v-for="item in tabs"
      :key="item"
      type="button"
      role="tab"
      class="details-tab"
      :aria-selected="active === item"
      @click="emit('update:active', item)"
    >
      {{ item }}
    </button>
  </nav>
</template>

<style scoped>
.details-tabs {
  display: flex;
  overflow-x: auto;
  height: auto;
  flex-shrink: 0;
  gap: 0;
  border-bottom: 1px solid var(--divider);
  background: var(--panel-surface);
}
.details-tab {
  flex: 0 0 auto;
  height: auto;
  min-height: 0;
  border: 0;
  background: transparent;
  padding: 8px 0.625rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  border-bottom: 2px solid var(--panel-surface);
}
.details-tab:hover {
  background: var(--control-hover);
  color: var(--text);
  border-bottom: 2px solid var(--control-hover);
}
.details-tab[aria-selected='true'] {
  border-bottom: 2px solid var(--accent);
  color: var(--accent);
}
</style>
