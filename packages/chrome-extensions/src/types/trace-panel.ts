import type { CallRecord, CallStatus, TraceStatus, TraceSummary } from '@trace-script/core'

export type EventTypeFilter = 'all' | 'model' | 'tool'
export type StatusFilter = 'all' | CallStatus | TraceStatus
export interface TracePanelFilter {
  query: string
  type: EventTypeFilter
  status: StatusFilter
  agent: string
  onlyErrors: boolean
}
export interface VisibleTrace {
  trace: TraceSummary
  calls: CallRecord[]
}
export type DetailTab = 'Input / Output' | 'Overview' | 'Usage' | 'Timing' | 'Relations' | 'Raw Events'
