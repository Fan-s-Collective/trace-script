<script setup lang="ts">
import { formatDuration } from '../utils/ui-model'

defineProps<{ connected: boolean, eventCount: number, visibleCount: number, totalTokens: number, visibleTokens: number, failedCount: number, maxDuration: number, totalDuration: number }>()
</script>

<template>
  <footer class="trace-status-bar" aria-label="Trace summary">
    <span class="status-item primary"><i class="status-dot" :class="connected ? 'status-success' : 'status-failed'" />{{ connected ? 'Connected' : 'Disconnected' }}</span>
    <span class="status-item"><strong>{{ eventCount }}</strong> events</span>
    <span class="status-item"><strong>{{ visibleCount }}</strong> visible</span>
    <span class="status-item"><strong>{{ totalTokens }}</strong> tokens</span>
    <span class="status-item"><strong>{{ visibleTokens }}</strong> visible tokens</span>
    <span class="status-item" :class="failedCount ? 'status-failed' : ''"><strong>{{ failedCount }}</strong> failed</span>
    <span class="status-item">Max duration: <strong>{{ formatDuration(maxDuration) }}</strong></span>
    <span class="status-item">Total duration: <strong>{{ formatDuration(totalDuration) }}</strong></span>
    <span class="status-spacer" /><span class="status-item hint">↑↓ Navigate · Esc Clear selection</span>
  </footer>
</template>

<style scoped>
.trace-status-bar {
  display: flex;
  min-height: 2.125rem;
  align-items: center;
  gap: 0;
  border-top: 1px solid var(--divider);
  background: var(--panel-raised);
  color: var(--text-muted);
}
.status-item {
  border-right: 1px solid var(--divider);
  padding: 0 0.625rem;
  white-space: nowrap;
}
.status-item.primary {
  color: var(--text);
}
.status-spacer {
  flex: 1;
}
.status-item.hint {
  border: 0;
  color: #70757a;
}
</style>
