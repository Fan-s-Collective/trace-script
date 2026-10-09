import type { TraceBridgeMessage } from '@trace-script/metadata'
import { safeParseBridgeMessage } from '@trace-script/core'

const histories = new Map<number, TraceBridgeMessage[]>()
const panels = new Map<chrome.runtime.Port, number>()
const maxEvents = 1000

chrome.runtime.onMessage.addListener((message: object, sender) => {
  const tabId = sender.tab?.id
  if (sender.id !== chrome.runtime.id || tabId === undefined)
    return
  const parsed = safeParseBridgeMessage(message)
  if (!parsed.success)
    return
  const history = histories.get(tabId) ?? []
  history.push(parsed.data)
  if (history.length > maxEvents)
    history.shift()
  histories.set(tabId, history)
  for (const [port, inspectedTabId] of panels) {
    if (inspectedTabId === tabId) {
      try {
        port.postMessage(parsed.data)
      }
      catch {
        panels.delete(port)
      }
    }
  }
})

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'trace-script-panel')
    return
  port.onMessage.addListener((message: object) => {
    if (!message || typeof message !== 'object' || !('tabId' in message)
      || typeof message.tabId !== 'number' || !Number.isInteger(message.tabId) || message.tabId < 0) {
      return
    }
    panels.set(port, message.tabId)
    for (const event of histories.get(message.tabId) ?? [])
      port.postMessage(event)
  })
  port.onDisconnect.addListener(() => panels.delete(port))
})

chrome.tabs.onRemoved.addListener(tabId => histories.delete(tabId))
