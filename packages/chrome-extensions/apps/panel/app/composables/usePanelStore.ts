import type { TraceBridgeMessage, TraceEventEnvelope } from '@trace-script/metadata'
import type { ComputedRef, ShallowRef } from 'vue'
import type { PanelEvent, PanelStatus, TraceRow } from '../types/panel'
import { safeParseBridgeMessage } from '@trace-script/core'
import { computed, shallowRef } from 'vue'

type EventPayload = TraceEventEnvelope extends { payload: infer Payload } ? Payload : Record<string, string | number | boolean>

export interface PanelStore {
  events: ShallowRef<PanelEvent[]>
  rows: ComputedRef<TraceRow[]>
  visibleRows: ComputedRef<TraceRow[]>
  selected: ComputedRef<PanelEvent | false>
  selectedId: ShallowRef<string>
  connected: ShallowRef<boolean>
  recording: ShallowRef<boolean>
  query: ShallowRef<string>
  type: ShallowRef<string>
  statusFilter: ShallowRef<string>
  agent: ShallowRef<string>
  agents: ComputedRef<string[]>
  onlyErrors: ShallowRef<boolean>
  totalTokens: ComputedRef<number>
  visibleTokens: ComputedRef<number>
  totalDuration: ComputedRef<number>
  maxDuration: ComputedRef<number>
  failedCount: ComputedRef<number>
  select: (id: string) => void
  selectAdjacent: (direction: 1 | -1) => void
  clear: () => void
  toggleRecording: () => void
  connect: () => void
  dispose: () => void
}

function scalar(value: EventPayload[keyof EventPayload]): string | number | boolean {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    return value
  const serialized = JSON.stringify(value)
  return typeof serialized === 'string' ? serialized : ''
}

function payloadRecord(value: EventPayload): Record<string, string | number | boolean> {
  if (value === null || Array.isArray(value) || typeof value !== 'object')
    return {}
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, scalar(child)]))
}

function payloadNumber(payload: Record<string, string | number | boolean>, keys: string[]): number {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'number' && Number.isFinite(value))
      return value
  }
  return 0
}

function hasPayloadNumber(payload: Record<string, string | number | boolean>, keys: string[]): boolean {
  return keys.some(key => typeof payload[key] === 'number' && Number.isFinite(payload[key]))
}

function panelEvent(event: TraceEventEnvelope): PanelEvent {
  const rawPayload = 'payload' in event ? event.payload : {}
  const payload = payloadRecord(rawPayload)
  const status: PanelStatus = event.type === 'trace.error' ? 'failed' : event.type === 'trace.start' ? 'running' : 'success'
  const type = event.type.startsWith('model.') ? 'LLM' : event.type === 'tool.result' ? 'Tool' : 'Agent'
  const name = typeof payload.name === 'string' ? payload.name : event.type
  const model = typeof payload.model === 'string' ? payload.model : '—'
  const agent = typeof payload.agent === 'string' ? payload.agent : '—'
  return {
    id: event.eventId,
    sequence: event.sequence,
    timestamp: Date.parse(event.timestamp),
    name,
    type,
    status,
    agent,
    model,
    tokens: payloadNumber(payload, ['total_tokens', 'tokens']),
    tokensReported: hasPayloadNumber(payload, ['total_tokens', 'tokens']),
    duration: payloadNumber(payload, ['duration_ms', 'duration']),
    durationReported: hasPayloadNumber(payload, ['duration_ms', 'duration']),
    traceId: event.traceId,
    sessionId: 'sessionId' in event && typeof event.sessionId === 'string' ? event.sessionId : event.traceId,
    parentId: 'parentId' in event && typeof event.parentId === 'string' ? event.parentId : '',
    payload,
  }
}

export function usePanelStore(): PanelStore {
  const events = shallowRef<PanelEvent[]>([])
  const selectedId = shallowRef('')
  const connected = shallowRef(false)
  const recording = shallowRef(true)
  const query = shallowRef('')
  const type = shallowRef('all')
  const statusFilter = shallowRef('all')
  const agent = shallowRef('all')
  const onlyErrors = shallowRef(false)
  let port: chrome.runtime.Port | false = false
  let disposed = false

  const rows = computed<TraceRow[]>(() => {
    const start = events.value[0]?.timestamp ?? 0
    return events.value.map(event => ({ event, start: event.timestamp - start }))
  })
  const visibleRows = computed(() => rows.value.filter((row) => {
    const event = row.event
    const text = `${event.name} ${event.id} ${event.traceId}`.toLowerCase()
    return (!query.value || text.includes(query.value.toLowerCase())) && (type.value === 'all' || event.type === type.value) && (statusFilter.value === 'all' || event.status === statusFilter.value) && (agent.value === 'all' || event.agent === agent.value) && (!onlyErrors.value || event.status === 'failed')
  }))
  const selected = computed(() => events.value.find(event => event.id === selectedId.value) ?? false)
  const totalTokens = computed(() => events.value.reduce((sum, event) => sum + event.tokens, 0))
  const visibleTokens = computed(() => visibleRows.value.reduce((sum, row) => sum + row.event.tokens, 0))
  const totalDuration = computed(() => events.value.reduce((sum, event) => sum + event.duration, 0))
  const maxDuration = computed(() => events.value.reduce((max, event) => Math.max(max, event.duration), 0))
  const failedCount = computed(() => events.value.filter(event => event.status === 'failed').length)
  const agents = computed(() => [...new Set(events.value.map(event => event.agent).filter(value => value !== '—'))].sort())

  function append(message: TraceBridgeMessage): void {
    if (!recording.value || message.kind !== 'trace-event')
      return
    const next = panelEvent(message.data)
    if (events.value.some(event => event.id === next.id))
      return
    events.value = [...events.value, next].sort((left, right) => left.sequence - right.sequence)
  }
  function receive(message: object): void {
    const parsed = safeParseBridgeMessage(message)
    if (parsed.success)
      append(parsed.data)
  }
  function connect(): void {
    if (disposed || typeof chrome === 'undefined' || !chrome.runtime?.connect) {
      connected.value = false
      return
    }
    try {
      port = chrome.runtime.connect({ name: 'trace-script-panel' })
      connected.value = true
      port.onMessage.addListener(receive)
      port.onDisconnect.addListener(() => {
        port = false
        connected.value = false
      })
      const tabId = chrome.devtools?.inspectedWindow?.tabId
      if (typeof tabId === 'number')
        port.postMessage({ tabId })
    }
    catch {
      port = false
      connected.value = false
    }
  }
  function select(id: string): void {
    selectedId.value = id
  }
  function selectAdjacent(direction: 1 | -1): void {
    const index = visibleRows.value.findIndex(row => row.event.id === selectedId.value)
    const next = Math.max(0, Math.min(visibleRows.value.length - 1, (index < 0 ? 0 : index) + direction))
    const row = visibleRows.value[next]
    if (row)
      select(row.event.id)
  }
  function clear(): void {
    events.value = []
    selectedId.value = ''
  }
  function toggleRecording(): void {
    recording.value = !recording.value
  }
  function dispose(): void {
    disposed = true
    connected.value = false
    if (port)
      port.disconnect()
    port = false
  }

  return { events, rows, visibleRows, selected, selectedId, connected, recording, query, type, statusFilter, agent, agents, onlyErrors, totalTokens, visibleTokens, totalDuration, maxDuration, failedCount, select, selectAdjacent, clear, toggleRecording, connect, dispose }
}
