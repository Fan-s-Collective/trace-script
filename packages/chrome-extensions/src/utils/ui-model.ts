import type { CallRecord, Timing, TokenAmount, TraceSummary } from '@trace-script/core'
import type { TracePanelFilter } from '@/types/trace-panel'

export const TRACE_FILTER_VALUE = { ALL: 'all' } as const
export const TRACE_STATUS = {
  SUCCESS: 'success',
  RUNNING: 'running',
  WAITING: 'waiting',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  INCOMPLETE: 'incomplete',
  INTERRUPTED: 'interrupted',
  UNKNOWN: 'unknown',
  CONFLICT: 'conflict',
} as const

export function matchesCall(call: CallRecord, filter: TracePanelFilter): boolean {
  const haystack = `${call.name} ${call.traceId} ${call.callId} ${call.agent} ${call.events.map(event => event.eventId).join(' ')}`.toLowerCase()
  return (!filter.query || haystack.includes(filter.query.toLowerCase()))
    && (filter.type === 'all' || call.kind === filter.type)
    && (filter.status === 'all' || call.status === filter.status)
    && (filter.agent === 'all' || call.agent === filter.agent)
    && (!filter.onlyErrors || call.status === 'failed')
}

export function matchesTrace(trace: TraceSummary, filter: TracePanelFilter): boolean {
  const haystack = `${trace.traceId} ${trace.events.map(event => event.eventId).join(' ')} ${trace.errors.join(' ')}`.toLowerCase()
  const queryMatches = !filter.query || haystack.includes(filter.query.toLowerCase())
  const statusMatches = filter.status === 'all' || trace.status === filter.status
  if (filter.onlyErrors)
    return (trace.status === 'failed' || trace.errors.length > 0) && queryMatches && statusMatches
  return queryMatches && statusMatches && filter.type === 'all' && filter.agent === 'all'
    && (!trace.calls.length || filter.status !== 'all')
}

export function formatDuration(value: number): string {
  return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`
}

export function timingText(timing: Timing, running = false): string {
  if (timing.anomalous)
    return 'Time anomaly'
  if (timing.duration !== undefined)
    return formatDuration(timing.duration)
  return running && timing.start ? 'Running' : '—'
}

export function tokenText(value?: number): string {
  return value === undefined ? '—' : value.toLocaleString('en-US')
}

export function amountText(amount: TokenAmount): string {
  return `${tokenText(amount.value)}${amount.value !== undefined && !amount.complete ? ' (known; incomplete)' : ''}`
}
