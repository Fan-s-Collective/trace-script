<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import type { PanelToWorkerMessage, WorkerToPanelMessage } from './messages'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const events = ref<TraceEventEnvelope[]>([])
let cleanup = (): void => {}

const output = computed(() => events.value
  .map(event => JSON.stringify(event, null, 2))
  .join('\n\n'))

function handleMessage(message: WorkerToPanelMessage): void {
  if (message.type === 'TRACE_QUERY_RESULT') {
    events.value = [...message.events]
    return
  }
  events.value = [...events.value, message.event]
}

onMounted(() => {
  const port = chrome.runtime.connect({ name: 'trace-panel' })
  port.onMessage.addListener(handleMessage)
  const message: PanelToWorkerMessage = {
    type: 'PANEL_CONNECT',
    tabId: chrome.devtools.inspectedWindow.tabId,
  }
  port.postMessage(message)
  cleanup = () => {
    port.onMessage.removeListener(handleMessage)
    port.disconnect()
  }
})

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <pre id="trace-output" aria-live="polite">{{ output }}</pre>
</template>
