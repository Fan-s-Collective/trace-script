import type { TraceEventEnvelope } from '@trace-script/metadata'

export interface ContentToWorkerMessage {
  type: 'INGEST_EVENT'
  event: TraceEventEnvelope
}

export type PanelToWorkerMessage = {
  type: 'PANEL_CONNECT'
  tabId: number
} | {
  type: 'TRACE_QUERY'
}

export type WorkerToPanelMessage = {
  type: 'TRACE_QUERY_RESULT'
  events: TraceEventEnvelope[]
} | {
  type: 'TRACE_EVENTS_APPEND'
  event: TraceEventEnvelope
}

export function isContentToWorkerMessage(message: object): message is ContentToWorkerMessage {
  if (!('type' in message) || message.type !== 'INGEST_EVENT' || !('event' in message))
    return false
  return typeof message.event === 'object' && message.event !== null
}

export function isPanelToWorkerMessage(message: object): message is PanelToWorkerMessage {
  if (!('type' in message) || typeof message.type !== 'string')
    return false
  if (message.type === 'PANEL_CONNECT')
    return 'tabId' in message && typeof message.tabId === 'number'
  return message.type === 'TRACE_QUERY'
}
