import type { TraceEventEnvelope } from '@trace-script/metadata'
import type { TRACE_FILTER_VALUE, TRACE_STATUS } from '@/utils/ui-model'

export type EventTypeFilter = typeof TRACE_FILTER_VALUE.ALL | TraceEventEnvelope['type']
export type StatusFilter = typeof TRACE_FILTER_VALUE.ALL | typeof TRACE_STATUS[keyof typeof TRACE_STATUS]

export interface TracePanelFilter {
  query: string
  type: EventTypeFilter
  status: StatusFilter
  agent: string
  onlyErrors: boolean
}

export type DetailTab = 'Overview' | 'Usage' | 'Payload' | 'Timing' | 'Relations' | 'Raw'
