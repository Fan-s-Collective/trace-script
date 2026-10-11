<script setup lang="ts">
import type { TraceEventEnvelope } from '@trace-script/metadata'
import type { PanelToWorkerMessage, WorkerToPanelMessage } from './messages'
import { onMounted, onUnmounted, ref } from 'vue'
import { EXTENSION_MESSAGE_TYPE, EXTENSION_PORT_NAME } from './messages'
import { eventSummary, eventTitle } from './trace-display'

const events = ref<TraceEventEnvelope[]>([])
const isPreview = ref(false)
let cleanup = (): void => {}

const previewEvents = [
  {
    eventId: 'preview-start',
    traceId: 'preview-trace',
    sequence: 1,
    timestamp: '2024-01-01T12:00:00.000Z',
    type: 'trace.start',
  },
  {
    eventId: 'preview-request',
    traceId: 'preview-trace',
    sequence: 2,
    timestamp: '2024-01-01T12:00:00.120Z',
    type: 'model.request',
    payload: { model: 'gpt-4.1-mini', input: 'Summarize the latest trace.' },
  },
  {
    eventId: 'preview-response',
    traceId: 'preview-trace',
    sequence: 3,
    timestamp: '2024-01-01T12:00:01.340Z',
    type: 'model.response',
    payload: { model: 'gpt-4.1-mini', output_text: 'The trace is healthy.', usage: { total_tokens: 42 } },
  },
] satisfies TraceEventEnvelope[]

const previewAppendix = [
  {
    eventId: 'preview-tool',
    traceId: 'preview-trace',
    sequence: 4,
    timestamp: '2024-01-01T12:00:02.000Z',
    type: 'tool.result',
    payload: { callId: 'call_preview', output: 'Tool result received.' },
  },
  {
    eventId: 'preview-end',
    traceId: 'preview-trace',
    sequence: 5,
    timestamp: '2024-01-01T12:00:03.000Z',
    type: 'trace.end',
  },
] satisfies TraceEventEnvelope[]

function handleMessage(message: WorkerToPanelMessage): void {
  if (message.type === EXTENSION_MESSAGE_TYPE.TRACE_QUERY_RESULT) {
    events.value = [...message.events]
    return
  }
  events.value = [...events.value, message.event]
}

onMounted(() => {
  if (typeof chrome === 'undefined') {
    isPreview.value = true
    events.value = [...previewEvents]
    let nextEvent = 0
    const timer = window.setInterval(() => {
      const event = previewAppendix[nextEvent]
      if (event) {
        events.value = [...events.value, { ...event, timestamp: new Date().toISOString() }]
        nextEvent += 1
      }
      if (nextEvent >= previewAppendix.length)
        window.clearInterval(timer)
    }, 1800)
    cleanup = () => window.clearInterval(timer)
    return
  }

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
      <div class="trace-title">
        <strong>Agent Trace</strong>
        <span v-if="isPreview" class="preview-badge">Live preview</span>
      </div>
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
