<script setup lang="ts">
defineProps<{ connected: boolean, eventCount: number, visibleCount: number, totalTokens: number, visibleTokens: number, failedCount: number, maxDuration: number, totalDuration: number }>()
function formatDuration(value: number): string {
  return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`
}
</script>

<template>
  <footer class="status-bar" aria-label="Trace summary">
    <span class="status-item status-primary"><i class="status-dot" :class="connected ? 'status-success' : 'status-failed'" />{{ connected ? 'Connected' : 'Disconnected' }}</span><span class="status-item"><strong>{{ eventCount }}</strong> events</span><span class="status-item"><strong>{{ visibleCount }}</strong> visible</span><span class="status-item"><strong>{{ totalTokens.toLocaleString() }}</strong> tokens</span><span class="status-item"><strong>{{ visibleTokens.toLocaleString() }}</strong> visible tokens</span><span class="status-item" :class="failedCount ? 'danger-text' : ''"><strong>{{ failedCount }}</strong> failed</span><span class="status-item">Max duration: <strong>{{ formatDuration(maxDuration) }}</strong></span><span class="status-item">Total duration: <strong>{{ formatDuration(totalDuration) }}</strong></span><span class="status-spacer" /><span class="status-hint">↑↓ Navigate</span>
  </footer>
</template>
