<script setup lang="ts">
import type { DetailTab } from '../../types/trace-panel'

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
