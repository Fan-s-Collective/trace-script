import type { TraceEventEnvelope } from '@trace-script/metadata'
import type { WorkerToPanelMessage } from '../messages'
import { safeParseTraceEvent } from '@trace-script/core'
import { isContentToWorkerMessage, isPanelToWorkerMessage } from '../messages'

const eventsByTab = new Map<number, TraceEventEnvelope[]>()
const panelsByTab = new Map<number, Set<chrome.runtime.Port>>()
const tabByPanel = new Map<chrome.runtime.Port, number>()

function eventsForTab(tabId: number): TraceEventEnvelope[] {
  const events = eventsByTab.get(tabId)
  if (events)
    return events
  const created: TraceEventEnvelope[] = []
  eventsByTab.set(tabId, created)
  return created
}

function send(port: chrome.runtime.Port, message: WorkerToPanelMessage): void {
  try {
    port.postMessage(message)
  }
  catch {
    // A disconnected panel is removed by onDisconnect.
  }
}

function removePanel(port: chrome.runtime.Port): void {
  const tabId = tabByPanel.get(port)
  if (typeof tabId !== 'number')
    return
  tabByPanel.delete(port)
  const panels = panelsByTab.get(tabId)
  panels?.delete(port)
  if (panels && panels.size === 0)
    panelsByTab.delete(tabId)
}

function registerPanel(port: chrome.runtime.Port, tabId: number): void {
  removePanel(port)
  const panels = panelsByTab.get(tabId) ?? new Set<chrome.runtime.Port>()
  panels.add(port)
  panelsByTab.set(tabId, panels)
  tabByPanel.set(port, tabId)
  send(port, { type: 'TRACE_QUERY_RESULT', events: [...eventsForTab(tabId)] })
}

function ingest(tabId: number, event: object): void {
  const parsed = safeParseTraceEvent(event)
  if (!parsed.success)
    return
  const events = eventsForTab(tabId)
  events.push(parsed.data)
  const panels = panelsByTab.get(tabId)
  if (!panels)
    return
  for (const panel of panels)
    send(panel, { type: 'TRACE_EVENTS_APPEND', event: parsed.data })
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'trace-content') {
    port.onMessage.addListener((message: object) => {
      if (!isContentToWorkerMessage(message))
        return
      const tabId = port.sender?.tab?.id
      if (typeof tabId === 'number')
        ingest(tabId, message.event)
    })
    return
  }

  if (port.name !== 'trace-panel')
    return
  port.onMessage.addListener((message: object) => {
    if (!isPanelToWorkerMessage(message))
      return
    if (message.type === 'PANEL_CONNECT') {
      registerPanel(port, message.tabId)
      return
    }
    const tabId = tabByPanel.get(port)
    if (typeof tabId === 'number')
      send(port, { type: 'TRACE_QUERY_RESULT', events: [...eventsForTab(tabId)] })
  })
  port.onDisconnect.addListener(() => removePanel(port))
})
