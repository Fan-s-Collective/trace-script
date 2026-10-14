import type { TraceEventEnvelope } from '@trace-script/metadata'
import { describe, expect, it } from 'vitest'
import { eventAgent, eventDuration, eventStatus, eventTokens, eventUsage, TRACE_STATUS } from '@/utils/ui-model'

describe('extension UI event model', () => {
  const response = {
    eventId: 'e1',
    traceId: 't1',
    sequence: 2,
    timestamp: '2026-01-01T00:00:00.000Z',
    type: 'model.response',
    payload: {
      model: 'gpt-4.1-mini',
      output_text: 'Done',
      usage: { total_tokens: 12 },
    },
  } satisfies TraceEventEnvelope

  it('keeps event identity stable for selection', () => {
    expect(response.eventId).toBe('e1')
    expect(response.traceId).toBe('t1')
  })

  it('normalizes Responses metadata for the table and details tabs', () => {
    expect(eventAgent(response)).toBe('—')
    expect(eventStatus(response)).toBe(TRACE_STATUS.SUCCESS)
    expect(eventTokens(response)).toBe(12)
    expect(eventUsage(response).total_tokens).toBe(12)
    expect(eventDuration(response)).toBe(0)
  })
})
