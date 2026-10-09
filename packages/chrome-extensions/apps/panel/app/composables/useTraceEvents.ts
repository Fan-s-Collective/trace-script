/// <reference types="chrome" />
import type { TraceEventEnvelope } from '@trace-script/metadata'
import type { Ref } from 'vue'
import { safeParseBridgeMessage } from '@trace-script/core'
import { onMounted, onUnmounted, ref } from 'vue'

export function useTraceEvents(): { events: Ref<TraceEventEnvelope[]>, status: Ref<string> } {
  const events = ref<TraceEventEnvelope[]>([])
  const status = ref('Open this panel in Chrome DevTools to receive trace events.')

  onMounted(() => {
    if (!globalThis.chrome?.devtools?.inspectedWindow)
      return
    const port = chrome.runtime.connect({ name: 'trace-script-panel' })
    status.value = 'Waiting for trace events from the inspected page.'
    port.onMessage.addListener((message: object) => {
      const parsed = safeParseBridgeMessage(message)
      if (!parsed.success)
        return
      events.value.push(parsed.data.data)
      if (events.value.length > 1000)
        events.value.shift()
    })
    port.onDisconnect.addListener(() => {
      status.value = 'Disconnected. Reopen DevTools to reconnect to the extension.'
    })
    port.postMessage({ tabId: chrome.devtools.inspectedWindow.tabId })
    onUnmounted(() => port.disconnect())
  })

  return { events, status }
}
