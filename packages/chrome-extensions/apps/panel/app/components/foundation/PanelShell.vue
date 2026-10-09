<script setup lang="ts">
import { version } from '../../../../../package.json'
import { useTraceEvents } from '../../composables/useTraceEvents'
import RawEvents from '../events/RawEvents.vue'
import Badge from '../ui/badge/Badge.vue'

const { events, status } = useTraceEvents()
</script>

<template>
  <main class="flex min-h-screen flex-col bg-background text-foreground">
    <header class="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
      <div class="flex items-center gap-3">
        <span class="size-2 rounded-full bg-primary" aria-hidden="true" />
        <h1 class="text-sm font-semibold tracking-tight">
          Agent Trace
        </h1>
      </div>
      <Badge variant="outline">
        v{{ version }}
      </Badge>
    </header>

    <RawEvents :events="events" :status="status" />

    <footer class="border-t border-border px-5 py-2 text-xs text-muted-foreground">
      Trace Script · Local DevTools panel
    </footer>
  </main>
</template>
