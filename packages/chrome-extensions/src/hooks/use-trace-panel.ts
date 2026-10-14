import type { CallRecord, TraceRecord, TraceSummary, UsageSummary } from '@trace-script/core'
import type { TraceEventEnvelope } from '@trace-script/metadata'
import type { ComputedRef, Ref, ShallowRef } from 'vue'
import type { WorkerToPanelMessage } from '@/messages'
import type { EventTypeFilter, StatusFilter, TracePanelFilter } from '@/types/trace-panel'
import { aggregateEvents, sumUsage } from '@trace-script/core'
import { useEventListener, useToggle } from '@vueuse/core'
import { computed, onMounted, onUnmounted, reactive, shallowRef } from 'vue'
import { EXTENSION_MESSAGE_TYPE, EXTENSION_PORT_NAME } from '@/messages'
import { previewEvents } from '@/preview'
import { matchesCall, matchesTrace, TRACE_FILTER_VALUE } from '@/utils/ui-model'

interface UseTracePanelReturn {
  events: ShallowRef<TraceEventEnvelope[]>
  traces: ComputedRef<TraceSummary[]>
  calls: ComputedRef<CallRecord[]>
  selectedId: ShallowRef<string>
  activeId: ComputedRef<string>
  selectedRecord: ComputedRef<TraceRecord | undefined>
  isPreview: ShallowRef<boolean>
  connected: ShallowRef<boolean>
  filtersVisible: ShallowRef<boolean>
  recording: Ref<boolean>
  filter: TracePanelFilter
  agents: ComputedRef<string[]>
  visibleCalls: ComputedRef<CallRecord[]>
  visibleTraces: ComputedRef<{ trace: TraceSummary, calls: CallRecord[] }[]>
  totalUsage: ComputedRef<UsageSummary>
  visibleUsage: ComputedRef<UsageSummary>
  failedCount: ComputedRef<number>
  collapsedIds: ShallowRef<string[]>
  timelineHeight: ShallowRef<number>
  detailsWidth: ShallowRef<number>
  workspaceStyle: ComputedRef<Record<string, string>>
  contentStyle: ComputedRef<Record<string, string>>
  toggleRecording: (value?: boolean) => boolean
  handleMessage: (message: WorkerToPanelMessage) => void
  selectEvent: (id: string) => void
  toggleTrace: (id: string) => void
  clearEvents: () => void
  addPreviewEvents: () => void
  startResize: (kind: 'timeline' | 'details', event: PointerEvent) => void
}

export function useTracePanel(): UseTracePanelReturn {
  const events = shallowRef<TraceEventEnvelope[]>([])
  const selectedId = shallowRef('')
  const selectedSources = shallowRef<string[]>([])
  const selectedKind = shallowRef<'trace' | 'model' | 'tool'>('trace')
  const collapsedIds = shallowRef<string[]>([])
  const isPreview = shallowRef(false)
  const connected = shallowRef(false)
  const filtersVisible = shallowRef(true)
  const [recording, toggleRecording] = useToggle(true)
  const filter = reactive({
    query: '',
    type: TRACE_FILTER_VALUE.ALL as EventTypeFilter,
    status: TRACE_FILTER_VALUE.ALL as StatusFilter,
    agent: TRACE_FILTER_VALUE.ALL,
    onlyErrors: false,
  })
  const timelineHeight = shallowRef(160)
  const detailsWidth = shallowRef(500)
  const dragging = shallowRef<'timeline' | 'details' | ''>('')
  let dragOrigin = 0
  let dragSize = 0
  let cleanup = (): void => {}
  const traces = computed(() => aggregateEvents(events.value))
  const calls = computed(() => traces.value.flatMap(trace => trace.calls))
  const records = computed(() => traces.value.flatMap(trace => [trace, ...trace.calls]))
  const visibleCalls = computed(() => calls.value.filter(call => matchesCall(call, filter)))
  const visibleTraces = computed(() => traces.value.map(trace => ({ trace, calls: visibleCalls.value.filter(call => call.traceId === trace.traceId) })).filter(group => group.calls.length || matchesTrace(group.trace, filter)))
  const selectedRecord = computed(() => records.value.find(record => record.id === selectedId.value)
    ?? records.value.find(record => record.kind === selectedKind.value && record.events.some(event => selectedSources.value.includes(event.eventId))))
  const activeId = computed(() => selectedRecord.value?.id ?? '')
  const agents = computed(() => [TRACE_FILTER_VALUE.ALL, ...new Set(calls.value.map(call => call.agent).filter(agent => agent !== '—'))])
  const totalUsage = computed(() => sumUsage(calls.value))
  const visibleUsage = computed(() => sumUsage(visibleCalls.value))
  const failedCount = computed(() => calls.value.filter(call => call.status === 'failed').length)
  const workspaceStyle = computed(() => ({ gridTemplateRows: `${timelineHeight.value}px 1px minmax(0, 1fr)` }))
  const contentStyle = computed(() => ({ gridTemplateColumns: `minmax(0, 1fr) 1px ${detailsWidth.value}px` }))
  function handleMessage(message: WorkerToPanelMessage): void {
    if (message.type === EXTENSION_MESSAGE_TYPE.TRACE_QUERY_RESULT)
      events.value = [...message.events]
    else if (message.type === EXTENSION_MESSAGE_TYPE.TRACE_EVENTS_APPEND && recording.value)
      events.value = [...events.value, message.event]
    if (!selectedRecord.value && traces.value[0])
      selectEvent(traces.value[0].id)
  }
  function selectEvent(id: string): void {
    const record = records.value.find(record => record.id === id)
    if (!record)
      return
    selectedId.value = id
    selectedSources.value = record.events.map(event => event.eventId)
    selectedKind.value = record.kind
    if (record.kind !== 'trace') {
      const trace = traces.value.find(trace => trace.traceId === record.traceId)
      if (trace)
        collapsedIds.value = collapsedIds.value.filter(id => id !== trace.id)
    }
  }
  function toggleTrace(id: string): void {
    collapsedIds.value = collapsedIds.value.includes(id) ? collapsedIds.value.filter(value => value !== id) : [...collapsedIds.value, id]
  }
  function clearEvents(): void {
    events.value = []
    selectedId.value = ''
    selectedSources.value = []
    collapsedIds.value = []
  }
  function addPreviewEvents(): void {
    if (!isPreview.value)
      return
    const suffix = String(events.value.length)
    const offset = events.value.length * 1000
    events.value = [...events.value, ...previewEvents.map(event => ({
      ...event,
      traceId: `${event.traceId}-${suffix}`,
      eventId: `${event.eventId}-${suffix}`,
      timestamp: new Date(Date.parse(event.timestamp) + offset).toISOString(),
    }))]
  }
  function startResize(kind: 'timeline' | 'details', event: PointerEvent): void {
    dragging.value = kind
    dragOrigin = kind === 'timeline' ? event.clientY : event.clientX
    dragSize = kind === 'timeline' ? timelineHeight.value : detailsWidth.value
    window.addEventListener('pointermove', resize)
    window.addEventListener('pointerup', stopResize, { once: true })
    ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  }
  function resize(event: PointerEvent): void {
    if (!dragging.value)
      return
    const delta = dragging.value === 'timeline' ? event.clientY - dragOrigin : dragOrigin - event.clientX
    if (dragging.value === 'timeline')
      timelineHeight.value = Math.min(360, Math.max(80, dragSize + delta))
    else
      detailsWidth.value = Math.min(520, Math.max(260, dragSize + delta))
  }
  function stopResize(): void {
    dragging.value = ''
    window.removeEventListener('pointermove', resize)
  }
  const navigableIds = computed(() => visibleTraces.value.flatMap(group => [group.trace.id, ...(collapsedIds.value.includes(group.trace.id) ? [] : group.calls.map(call => call.id))]))
  function keyboard(event: KeyboardEvent): void {
    const target = event.target
    if (target instanceof HTMLElement && (target.closest('input, select, textarea, [role="separator"], [role="tablist"]') || target.isContentEditable))
      return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const ids = navigableIds.value
      if (!ids.length)
        return
      event.preventDefault()
      const index = ids.indexOf(activeId.value)
      const next = event.key === 'ArrowDown' ? Math.min(index + 1, ids.length - 1) : Math.max(index - 1, 0)
      selectEvent(ids[next]!)
    }
    if (event.key === 'Escape') {
      selectedId.value = ''
      selectedSources.value = []
    }
  }
  onMounted(() => {
    if (typeof chrome === 'undefined' || !chrome.devtools?.inspectedWindow) {
      isPreview.value = true
      connected.value = true
      events.value = [...previewEvents]
      selectEvent(traces.value[0]!.id)
      return
    }
    const port = chrome.runtime.connect({ name: EXTENSION_PORT_NAME.PANEL })
    port.onMessage.addListener(handleMessage)
    port.postMessage({ type: EXTENSION_MESSAGE_TYPE.PANEL_CONNECT, tabId: chrome.devtools.inspectedWindow.tabId })
    connected.value = true
    cleanup = () => {
      port.onMessage.removeListener(handleMessage)
      port.disconnect()
      connected.value = false
    }
  })
  useEventListener('keydown', keyboard)
  onUnmounted(() => {
    cleanup()
    window.removeEventListener('pointermove', resize)
  })

  return {
    events,
    traces,
    calls,
    selectedId,
    activeId,
    selectedRecord,
    isPreview,
    connected,
    filtersVisible,
    recording,
    filter,
    agents,
    visibleCalls,
    visibleTraces,
    totalUsage,
    visibleUsage,
    failedCount,
    collapsedIds,
    timelineHeight,
    detailsWidth,
    workspaceStyle,
    contentStyle,
    toggleRecording,
    handleMessage,
    selectEvent,
    toggleTrace,
    clearEvents,
    addPreviewEvents,
    startResize,
  }
}
