<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import type { PanelToWorkerMessage, WorkerToPanelMessage } from './messages'
import { onMounted, onUnmounted, ref } from 'vue'
import { EXTENSION_MESSAGE_TYPE, EXTENSION_PORT_NAME } from './messages'
import { eventSummary, eventTitle } from './trace-display'

const events = ref<TraceEventEnvelope[]>([])
let cleanup = (): void => {}

function handleMessage(message: WorkerToPanelMessage): void {
  if (message.type === EXTENSION_MESSAGE_TYPE.TRACE_QUERY_RESULT) {
    events.value = [...message.events]
    return
  }
  events.value = [...events.value, message.event]
}

onMounted(() => {
  const port = chrome.runtime.connect({ name: EXTENSION_PORT_NAME.PANEL })
  port.onMessage.addListener(handleMessage)
  const message: PanelToWorkerMessage = {
    type: EXTENSION_MESSAGE_TYPE.PANEL_CONNECT,
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
  <main class="trace-panel">
    <header class="trace-header">
      <strong>Agent Trace</strong>
      <span>{{ events.length }} events</span>
    </header>
    <p v-if="events.length === 0" class="empty" aria-live="polite">
      No SDK events for this tab.
    </p>
    <ol v-else class="trace-events" aria-live="polite">
      <li v-for="event in events" :key="event.eventId" class="trace-event">
        <div class="event-heading">
          <strong>{{ eventTitle(event) }}</strong>
          <span>#{{ event.sequence }}</span>
        </div>
        <p>{{ eventSummary(event) }}</p>
        <details>
          <summary>Raw event</summary>
          <pre>{{ JSON.stringify(event, null, 2) }}</pre>
        </details>
      </li>
    </ol>
  </main>
</template>
