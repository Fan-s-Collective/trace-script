import { safeParseBridgeMessage } from '@trace-script/core'

window.addEventListener('message', (event) => {
  if (event.source !== window || event.origin !== window.location.origin)
    return
  const parsed = safeParseBridgeMessage(event.data)
  if (!parsed.success)
    return
  try {
    chrome.runtime.sendMessage(parsed.data).catch(() => {})
  }
  catch {
    // Existing pages can outlive their extension context after a reload.
  }
})
