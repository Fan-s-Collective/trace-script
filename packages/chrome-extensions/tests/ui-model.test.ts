import type { TracePanelFilter } from '@/types/trace-panel'
import { aggregateEvents } from '@trace-script/core'
import { describe, expect, it } from 'vitest'
import { previewEvents } from '@/preview'
import { amountText, matchesCall, matchesTrace, timingText, tokenText } from '@/utils/ui-model'

const filter: TracePanelFilter = { query: '', type: 'all', status: 'all', agent: 'all', onlyErrors: false }
const [trace] = aggregateEvents(previewEvents)

describe('aggregated UI model', () => {
  it('filters calls by type, status, agent, name, Trace ID, call ID and source event ID', () => {
    expect(trace.calls.filter(call => matchesCall(call, { ...filter, type: 'tool' }))).toHaveLength(1)
    expect(trace.calls.filter(call => matchesCall(call, { ...filter, status: 'success' }))).toHaveLength(3)
    expect(trace.calls.filter(call => matchesCall(call, { ...filter, agent: 'planner' }))).toHaveLength(3)
    for (const query of ['get_weather', 'call-weather', 'preview-tool'])
      expect(trace.calls.filter(call => matchesCall(call, { ...filter, query }))).toHaveLength(1)
    expect(trace.calls.filter(call => matchesCall(call, { ...filter, query: 'preview-trace' }))).toHaveLength(3)
  })

  it('includes failed Trace summaries with no failed calls without relabelling successful calls', () => {
    const events = previewEvents.filter(event => event.type !== 'trace.end')
    const [failed] = aggregateEvents([...events, {
      eventId: 'error',
      traceId: 'preview-trace',
      sequence: 7,
      timestamp: '2024-01-01T12:00:02.100Z',
      type: 'trace.error',
      payload: { message: 'late failure' },
    }])
    expect(matchesTrace(failed, { ...filter, onlyErrors: true })).toBeTruthy()
    expect(failed.calls.filter(call => matchesCall(call, { ...filter, onlyErrors: true }))).toHaveLength(0)
    expect(failed.calls.every(call => call.status === 'success')).toBeTruthy()
  })

  it('keeps unknown, zero, partial usage and missing or anomalous timing distinct', () => {
    expect(tokenText()).toBe('—')
    expect(tokenText(0)).toBe('0')
    expect(amountText({ value: 0, complete: false })).toBe('0 (known; incomplete)')
    expect(amountText({ complete: false })).toBe('—')
    expect(timingText({ anomalous: false })).toBe('—')
    expect(timingText({ duration: 0, anomalous: false })).toBe('0ms')
    expect(timingText({ anomalous: true })).toBe('Time anomaly')
  })
})
