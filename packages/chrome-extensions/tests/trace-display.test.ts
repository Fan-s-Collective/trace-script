import type { TraceEventEnvelope } from '@trace-script/metadata'
import { describe, expect, it } from 'vitest'
import { eventSummary, eventTitle } from '@/trace-display'

const common = {
  eventId: 'event-1',
  traceId: 'trace-1',
  sequence: 2,
  timestamp: '2026-01-01T00:00:00.000Z',
} satisfies Omit<Extract<TraceEventEnvelope, { type: 'trace.start' }>, 'type'>

describe('openAI Responses trace display', () => {
  it('summarizes a model response using its original Responses fields', () => {
    const event = {
      ...common,
      type: 'model.response',
      payload: {
        id: 'resp_1',
        object: 'response',
        model: 'gpt-4.1',
        output: [{ type: 'message', content: [{ type: 'output_text', text: 'Sunny.' }] }],
        usage: { input_tokens: 12, output_tokens: 8, total_tokens: 20 },
      },
    } satisfies TraceEventEnvelope

    expect(eventTitle(event)).toBe('model.response · gpt-4.1')
    expect(eventSummary(event)).toContain('20 tokens')
    expect(eventSummary(event)).toContain('Sunny.')

    const compact = {
      ...event,
      payload: { ...event.payload, output_text: 'Sunny.' },
    } satisfies TraceEventEnvelope
    expect(eventSummary(compact)).toBe('20 tokens · Sunny.')
  })

  it('summarizes tool results and terminal errors without changing payloads', () => {
    const tool = {
      ...common,
      type: 'tool.result',
      payload: { callId: 'call_1', output: '{"temperature":22}' },
    } satisfies TraceEventEnvelope
    const error = {
      ...common,
      type: 'trace.error',
      payload: { message: 'model failed' },
    } satisfies TraceEventEnvelope

    expect(eventTitle(tool)).toBe('tool.result · call_1')
    expect(eventSummary(tool)).toContain('temperature')
    expect(eventTitle(error)).toBe('trace.error')
    expect(eventSummary(error)).toBe('model failed')
  })
})
