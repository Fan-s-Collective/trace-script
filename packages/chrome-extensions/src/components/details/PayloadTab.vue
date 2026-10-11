<script setup lang="ts">
defineProps<{ payload: Record<string, unknown> }>()
</script>

<template>
  <div class="details-section-label">
    Response payload
  </div><pre class="details-code details-json">{{ JSON.stringify(payload, null, 2) }}</pre>
</template>
