// Chrome executes manifest content scripts as classic scripts. Keep this entry
// import-free; the worker performs the complete protocol validation.
const PAGE_MESSAGE_FIELD = {
  CHANNEL: 'trace-script',
  KIND: 'trace-event',
  INGEST_EVENT: 'INGEST_EVENT',
  CONTENT_PORT: 'trace-content',
} as const

if (window.top === window) {
  const port = chrome.runtime.connect({ name: PAGE_MESSAGE_FIELD.CONTENT_PORT })

  function forward(event: MessageEvent): void {
    if (event.source !== window || event.origin !== window.location.origin)
      return
    const data = event.data
    if (typeof data !== 'object' || data === null)
      return
    if (!('channel' in data) || data.channel !== PAGE_MESSAGE_FIELD.CHANNEL)
      return
    if (!('kind' in data) || data.kind !== PAGE_MESSAGE_FIELD.KIND || !('data' in data))
      return
    try {
      port.postMessage({ type: PAGE_MESSAGE_FIELD.INGEST_EVENT, event: data.data })
    }
    catch {
      // Ignore malformed page messages. The page remains isolated from extension internals.
    }
  }

  window.addEventListener('message', forward)
  window.addEventListener('pagehide', () => {
    window.removeEventListener('message', forward)
    port.disconnect()
  }, { once: true })
}
