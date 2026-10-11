import type { TraceEventEnvelope } from '@trace-script/metadata'
import { TRACE_EVENT_TYPE } from '@trace-script/metadata'
import { isNumber, isObject, isString } from '@trace-script/shared'

export const TRACE_FILTER_VALUE = {
  ALL: 'all',
} as const

export const TRACE_STATUS = {
  SUCCESS: 'success',
  RUNNING: 'running',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

export type TraceStatus = typeof TRACE_STATUS[keyof typeof TRACE_STATUS]

export function eventPayload(event: TraceEventEnvelope): Record<string, unknown> {
  if (!('payload' in event) || !isObject(event.payload) || Array.isArray(event.payload))
    return {}
  return event.payload as Record<string, unknown>
}

function traceOf(event: TraceEventEnvelope): Record<string, unknown> {
  const payload = eventPayload(event)
  return isObject(payload.trace) ? payload.trace as Record<string, unknown> : {}
}

export function eventName(event: TraceEventEnvelope): string {
  const payload = eventPayload(event)
  const name = payload.name
  return isString(name) && name.length > 0 ? name : event.type
}

export function eventAgent(event: TraceEventEnvelope): string {
  const payload = eventPayload(event)
  const trace = traceOf(event)
  const agent = trace.agent ?? payload.agent
  return isString(agent) && agent.length > 0 ? agent : '—'
}

export function eventModel(event: TraceEventEnvelope): string {
  const payload = eventPayload(event)
  const trace = traceOf(event)
  const model = trace.model ?? payload.model
  return isString(model) && model.length > 0 ? model : '—'
}

export function eventStatus(event: TraceEventEnvelope): TraceStatus {
  if (event.type === TRACE_EVENT_TYPE.TRACE_ERROR)
    return TRACE_STATUS.FAILED
  const payload = eventPayload(event)
  const trace = traceOf(event)
  const status = trace.status ?? payload.status
  if (status === TRACE_STATUS.RUNNING || status === TRACE_STATUS.FAILED || status === TRACE_STATUS.CANCELLED)
    return status
  return TRACE_STATUS.SUCCESS
}

export function eventTokens(event: TraceEventEnvelope): number | undefined {
  const payload = eventPayload(event)
  const usage = isObject(payload.usage) ? payload.usage as Record<string, unknown> : payload
  const value = usage.total_tokens ?? payload.tokens
  return isNumber(value) ? value : undefined
}

export function eventUsage(event: TraceEventEnvelope): Record<string, unknown> {
  const usage = eventPayload(event).usage
  return isObject(usage) && !Array.isArray(usage) ? usage as Record<string, unknown> : {}
}

export function eventDuration(event: TraceEventEnvelope): number {
  const payload = eventPayload(event)
  const trace = traceOf(event)
  const duration = trace.duration_ms ?? payload.duration_ms ?? payload.duration
  return isNumber(duration) && duration >= 0 ? duration : 0
}

export function eventTraceId(event: TraceEventEnvelope): string {
  const payload = eventPayload(event)
  const trace = traceOf(event)
  const id = trace.trace_id ?? event.traceId ?? payload.trace_id
  return isString(id) ? id : event.traceId
}

export function eventTimestamp(event: TraceEventEnvelope): number {
  const parsed = Date.parse(event.timestamp)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatDuration(value: number): string {
  return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`
}
