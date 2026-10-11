// Chrome executes manifest content scripts as classic scripts. Keep this entry
// import-free; the worker performs the complete protocol validation.
if (window.top === window) {
  const port = chrome.runtime.connect({ name: 'trace-content' })

  function forward(event: MessageEvent): void {
    if (event.source !== window || event.origin !== window.location.origin)
      return
    const data = event.data
    if (typeof data !== 'object' || data === null)
      return
    if (!('channel' in data) || data.channel !== 'trace-script')
      return
    if (!('kind' in data) || data.kind !== 'trace-event' || !('data' in data))
      return
    try {
      port.postMessage({ type: 'INGEST_EVENT', event: data.data })
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
