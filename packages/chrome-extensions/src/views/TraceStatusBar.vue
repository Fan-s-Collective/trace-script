<script setup lang="ts">
import type { UsageSummary } from '@trace-script/core'
import { amountText } from '@/utils/ui-model'

defineProps<{ connected: boolean, traceCount: number, callCount: number, visibleCount: number, totalUsage: UsageSummary, visibleUsage: UsageSummary, failedCount: number }>()
</script>

<template>
  <footer class="trace-status-bar" aria-label="Call summary">
    <span>{{ connected ? 'Connected' : 'Disconnected' }}</span>
    <span>{{ traceCount }} traces · {{ callCount }} calls · {{ visibleCount }} matched</span>
    <span>All model tokens — In: {{ amountText(totalUsage.input) }} · Out: {{ amountText(totalUsage.output) }} · Total: {{ amountText(totalUsage.total) }}</span>
    <span>Matched model tokens — In: {{ amountText(visibleUsage.input) }} · Out: {{ amountText(visibleUsage.output) }} · Total: {{ amountText(visibleUsage.total) }}</span>
    <span :class="{ 'status-failed': failedCount }">
      {{ failedCount }} failed calls
    </span>
    <span>↑↓ Navigate</span>
  </footer>
</template>

<style scoped>
.trace-status-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 0;
  border-top: 1px solid var(--divider);
  padding: 6px 0;
  background: var(--panel-raised);
  color: var(--text-muted);
  font-size: 0.6875rem;
}
.trace-status-bar span {
  border-right: 1px solid var(--divider);
  padding: 0 0.625rem;
}
</style>
