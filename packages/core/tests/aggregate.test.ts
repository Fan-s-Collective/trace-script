import type { TraceEventEnvelope, TraceEventType } from '@trace-script/metadata'
import { describe, expect, it } from 'vitest'
import { aggregateEvents, parseTraceEvent } from '@/index'

function event(sequence: number, type: TraceEventType, payload: object = {}, options: { requestId?: string, traceId?: string, ms?: number, id?: string, status?: 'cancelled' } = {}): TraceEventEnvelope {
  const traceId = options.traceId ?? 'trace-1'
  return parseTraceEvent({
    eventId: options.id ?? `${traceId}-${sequence}`,
    traceId,
    sequence,
    timestamp: new Date(Date.UTC(2026, 0, 1) + (options.ms ?? sequence * 100)).toISOString(),
    type,
    ...(type === 'trace.start' || type === 'trace.end' ? {} : { payload }),
    ...(options.requestId ? { requestId: options.requestId } : {}),
    ...(options.status ? { status: options.status } : {}),
  })
}

function request(sequence: number, requestId = 'request-1', options: { traceId?: string, ms?: number } = {}) {
  return event(sequence, 'model.request', { model: 'gpt-4.1', agent: 'planner', input: 'Weather?' }, { ...options, requestId })
}

function response(sequence: number, requestId = 'request-1', payload: object = { status: 'completed', output: [], usage: { input_tokens: 2, output_tokens: 3 } }, options: { traceId?: string, ms?: number } = {}) {
  return event(sequence, 'model.response', payload, { ...options, requestId })
}

const toolCall = { type: 'function_call', call_id: 'tool-1', name: 'get_weather', arguments: '{"city":"Beijing"}' }

describe('call aggregation acceptance', () => {
  it('shows four events as one Trace and one model call, retaining both payloads', () => {
    const input = [event(1, 'trace.start'), request(2), response(3), event(4, 'trace.end')]
    const [trace] = aggregateEvents(input)
    expect(trace.calls).toHaveLength(1)
    expect(trace.events).toEqual(input)
    expect(trace.calls[0].events).toEqual(input.slice(1, 3))
    expect(JSON.parse(trace.calls[0].input!)).toEqual({ model: 'gpt-4.1', agent: 'planner', input: 'Weather?' })
    expect(JSON.parse(trace.calls[0].output!)).toMatchObject({ status: 'completed', output: [] })
    expect(trace.calls[0].timing.duration).toBe(100)
    expect(trace.timing.duration).toBe(300)
  })

  it('shows seven events as two model calls and one tool, without repeating history', () => {
    const input = [
      event(1, 'trace.start'),
      request(2),
      response(3, 'request-1', { output: [toolCall], usage: { input_tokens: 12, output_tokens: 8 } }),
      event(4, 'tool.result', { callId: 'tool-1', output: '' }),
      event(5, 'model.request', { input: [toolCall, { type: 'function_call_output', call_id: 'tool-1', output: '' }] }, { requestId: 'request-2' }),
      response(6, 'request-2'),
      event(7, 'trace.end'),
    ]
    const [trace] = aggregateEvents(input)
    expect(trace.calls.map(call => call.kind)).toEqual(['model', 'tool', 'model'])
    const tool = trace.calls[1]
    expect(tool.name).toBe('get_weather')
    expect(tool.input).toBe(toolCall.arguments)
    expect(tool.output).toBe('')
    expect(tool.status).toBe('success')
    expect(tool.parentId).toBe(trace.calls[0].id)
    expect(tool.timing.duration).toBe(100)
    expect(tool.tokens).toEqual({})
    expect(trace.tokens.total).toEqual({ value: 25, complete: true })
  })

  it('makes independent rows for multiple tools and counts response usage once', () => {
    const [trace] = aggregateEvents([
      request(1),
      response(2, 'request-1', { output: [toolCall, { ...toolCall, call_id: 'tool-2', name: 'search' }], usage: { total_tokens: 42 } }),
      event(3, 'tool.result', { callId: 'tool-2', output: 'second' }),
      event(4, 'tool.result', { callId: 'tool-1', output: 'first' }),
    ])
    expect(trace.calls).toHaveLength(3)
    expect(trace.calls.find(call => call.callId === 'tool-2')?.output).toBe('second')
    expect(trace.calls.find(call => call.callId === 'tool-1')?.output).toBe('first')
    expect(trace.tokens.total).toEqual({ value: 42, complete: true })
  })

  it('pairs concurrent reverse responses by requestId, independently of arrival order', () => {
    const input = [request(1, 'a'), request(2, 'b'), response(3, 'b', { output_text: 'B' }), response(4, 'a', { output_text: 'A' })]
    const result = aggregateEvents(input)
    expect(aggregateEvents([...input].reverse())).toEqual(result)
    expect(result[0].calls.map(call => [call.callId, JSON.parse(call.output!).output_text])).toEqual([['a', 'A'], ['b', 'B']])
  })

  it('pairs only the unique unlabelled request and never mixes explicit identifiers', () => {
    const [legacy] = aggregateEvents([event(1, 'model.request', {}), event(2, 'model.response', {})])
    expect(legacy.calls).toHaveLength(1)
    const [mixed] = aggregateEvents([request(1), event(2, 'model.response', {})])
    expect(mixed.calls).toHaveLength(2)
    expect(mixed.calls[0].output).toBeUndefined()
    const [mismatched] = aggregateEvents([request(1, 'a'), response(2, 'b')])
    expect(mismatched.calls).toHaveLength(2)
  })

  it('does not guess after ambiguous legacy responses, even if another request arrives', () => {
    const [trace] = aggregateEvents([
      event(1, 'model.request'),
      event(2, 'model.request'),
      event(3, 'model.response'),
      event(4, 'model.request'),
      event(5, 'model.response'),
    ])
    expect(trace.calls).toHaveLength(5)
    expect(trace.calls.every(call => !(call.input && call.output))).toBeTruthy()
    expect(trace.calls.filter(call => call.issues.some(issue => issue.includes('Ambiguous')))).toHaveLength(5)
  })

  it('isolates identical model and tool identifiers across Traces', () => {
    const input = [request(1), response(2, 'request-1', { output: [toolCall] }), event(3, 'tool.result', { callId: 'tool-1', output: 'A' })]
    const traces = aggregateEvents([...input, ...input.map(source => ({ ...source, traceId: 'trace-2', eventId: `other-${source.eventId}` }))])
    expect(traces).toHaveLength(2)
    expect(traces.every(trace => trace.calls.length === 2)).toBeTruthy()
    expect(traces[0].calls[0].id).not.toBe(traces[1].calls[0].id)
    expect(traces[0].calls[1].id).not.toBe(traces[1].calls[1].id)
  })

  it('fills output-first identified model and tool records with stable IDs', () => {
    const reply = response(2, 'request-1', { output: [toolCall] })
    const result = event(3, 'tool.result', { callId: 'tool-1', output: 'result' })
    const [before] = aggregateEvents([result, reply])
    const [after] = aggregateEvents([result, reply, request(1)])
    expect(after.calls.map(call => call.id)).toEqual(before.calls.map(call => call.id))
    expect(before.calls[0].input).toBeUndefined()
    expect(after.calls[0].input).toBeDefined()
    expect(before.calls[1].output).toBe('result')
    const [toolOnly] = aggregateEvents([result])
    expect(toolOnly.calls[0].id).toBe(after.calls[1].id)
  })

  it('deduplicates identical events including objects with reordered keys', () => {
    const input = [request(1), response(2)]
    const reply = input[1]
    if (reply.type !== 'model.response')
      throw new Error('Expected response')
    const reordered = { ...reply, payload: { usage: { output_tokens: 3, input_tokens: 2 }, output: [], status: 'completed' } }
    expect(aggregateEvents([...input, ...input, reordered])).toEqual(aggregateEvents(input))
  })

  it('retains the first conflicting event plus inspectable alternate content and excludes usage', () => {
    const reply = response(2)
    const alternate = response(2, 'request-1', { usage: { total_tokens: 999 }, output_text: 'conflict' })
    const [trace] = aggregateEvents([request(1), reply, alternate])
    expect(trace.calls[0].output).toBe(JSON.stringify('payload' in reply ? reply.payload : {}, null, 2))
    expect(trace.calls[0].conflicts).toEqual([alternate])
    expect(trace.calls[0].associationConflict).toBeTruthy()
    expect(trace.tokens.total).toEqual({ complete: false })
  })

  it('reports reused request IDs and multiple final responses without overwriting output', () => {
    const [trace] = aggregateEvents([request(1), request(2), response(3), response(4)])
    expect(trace.calls).toHaveLength(1)
    expect(trace.calls[0].events).toHaveLength(4)
    expect(trace.calls[0].issues).toContain('Request identifier reused: multiple requests')
    expect(trace.calls[0].issues).toContain('Multiple final responses: association conflict')
    expect(trace.calls[0].tokens).toEqual({})
    expect(trace.calls[0].timing.duration).toBeUndefined()
  })

  it('retains reused tool declarations and duplicate results as conflicts', () => {
    const [trace] = aggregateEvents([request(1), response(2, 'request-1', { output: [toolCall, toolCall] }), event(3, 'tool.result', { callId: 'tool-1', output: 'first' }), event(4, 'tool.result', { callId: 'tool-1', output: 'second' })])
    const tool = trace.calls[1]
    expect(tool.output).toBe('first')
    expect(tool.associationConflict).toBeTruthy()
    expect(tool.events).toHaveLength(3)
    expect(tool.declaration).toBeDefined()
  })

  it('locates model and tool failures, preserving other successful calls', () => {
    const [trace] = aggregateEvents([
      request(1, 'a'),
      response(2, 'a', { output: [toolCall] }),
      request(3, 'b'),
      event(4, 'tool.result', { callId: 'tool-1', output: '', status: 'failed', message: 'tool timeout' }),
      event(5, 'trace.error', { requestId: 'b', message: 'model failed' }),
    ])
    expect(trace.status).toBe('failed')
    expect(trace.calls.map(call => call.status)).toEqual(['success', 'failed', 'failed'])
    expect(trace.calls.find(call => call.callId === 'b')?.errors).toContain('model failed')
  })

  it('marks unresolved calls interrupted on an unlocated Trace error', () => {
    const [trace] = aggregateEvents([request(1, 'a'), response(2, 'a'), request(3, 'b'), event(4, 'trace.error', { message: 'disconnected' })])
    expect(trace.calls.map(call => call.status)).toEqual(['success', 'interrupted'])
    expect(trace.calls[1].errors).toEqual([])
    expect(trace.calls[1].timing.duration).toBeUndefined()
  })

  it('shows missing output after a normal terminal without inventing success or duration', () => {
    const [trace] = aggregateEvents([request(1), event(2, 'trace.end')])
    expect(trace.calls[0].status).toBe('incomplete')
    expect(trace.calls[0].output).toBeUndefined()
    expect(trace.calls[0].timing.duration).toBeUndefined()
  })

  it('keeps orphan outputs, marks state unknown unless explicitly reported, and lacks timing', () => {
    const [trace] = aggregateEvents([response(1, 'a', { output_text: 'orphan' }), event(2, 'tool.result', { callId: 'tool-1', output: '' }), response(3, 'b', { status: 'completed' })])
    expect(trace.calls.map(call => call.status)).toEqual(['unknown', 'unknown', 'success'])
    expect(trace.calls.every(call => call.input === undefined && call.timing.duration === undefined)).toBeTruthy()
    expect(trace.calls[1].output).toBe('')
  })

  it('keeps failed attempts and retries separate and includes reported failed usage', () => {
    const [trace] = aggregateEvents([request(1, 'attempt-1'), response(2, 'attempt-1', { status: 'failed', error: { message: 'quota' }, usage: { total_tokens: 2 } }), request(3, 'attempt-2'), response(4, 'attempt-2')])
    expect(trace.calls.map(call => call.status)).toEqual(['failed', 'success'])
    expect(trace.tokens.total).toEqual({ value: 7, complete: true })
  })

  it('keeps a streaming request in one record and applies only final usage', () => {
    const input = request(1)
    const [pending] = aggregateEvents([input])
    const [completed] = aggregateEvents([input, response(2)])
    expect(pending.calls).toHaveLength(1)
    expect(pending.calls[0].status).toBe('running')
    expect(pending.calls[0].timing.duration).toBeUndefined()
    expect(completed.calls).toHaveLength(1)
    expect(completed.calls[0].id).toBe(pending.calls[0].id)
    expect(completed.tokens.total.value).toBe(5)
  })

  it('uses a 1.2 second Trace interval instead of adding two concurrent 1 second calls', () => {
    const [trace] = aggregateEvents([event(1, 'trace.start', {}, { ms: 0 }), request(2, 'a', { ms: 100 }), request(3, 'b', { ms: 100 }), response(4, 'b', { usage: { total_tokens: 1 } }, { ms: 1100 }), response(5, 'a', { usage: { total_tokens: 1 } }, { ms: 1100 }), event(6, 'trace.end', {}, { ms: 1200 })])
    expect(trace.calls.map(call => call.timing.duration)).toEqual([1000, 1000])
    expect(trace.timing.duration).toBe(1200)
  })

  it('flags inverted timestamps while preserving endpoints and never reporting negative duration', () => {
    const [trace] = aggregateEvents([event(1, 'trace.start', {}, { ms: 500 }), request(2, 'a', { ms: 400 }), response(3, 'a', {}, { ms: 300 }), event(4, 'trace.end', {}, { ms: 200 })])
    expect(trace.timing.anomalous).toBeTruthy()
    expect(trace.calls[0].timing.anomalous).toBeTruthy()
    expect(trace.calls[0].timing.start).toBe(new Date(Date.UTC(2026, 0, 1) + 400).toISOString())
    expect(trace.calls[0].timing.duration).toBeUndefined()
    expect(trace.timing.duration).toBeUndefined()
  })

  it.each([
    [{ input_tokens: 0, output_tokens: 0, total_tokens: 0 }, { input: 0, output: 0, total: 0 }],
    [{ prompt_tokens: 2, completion_tokens: 3 }, { input: 2, output: 3, total: 5 }],
    [{ input_tokens: 2, output_tokens: 3, prompt_tokens: 100, completion_tokens: 100, total_tokens: 8 }, { input: 2, output: 3, total: 8 }],
    [{ input_tokens: -1, output_tokens: 1.5, prompt_tokens: 9, completion_tokens: 9 }, {}],
    [{ input_tokens: '2', output_tokens: 3, total_tokens: -1 }, { output: 3 }],
    [{ input_tokens: 2 }, { input: 2 }],
  ])('validates usage and prioritizes fields without duplicate accounting: %j', (usage, expected) => {
    const [trace] = aggregateEvents([request(1), response(2, 'request-1', { usage })])
    expect(trace.calls[0].tokens).toEqual(expected)
  })

  it('ignores nonfinite usage and request estimates', () => {
    const reply: TraceEventEnvelope = {
      eventId: 'reply',
      traceId: 'trace-1',
      sequence: 2,
      timestamp: '2026-01-01T00:00:01.000Z',
      type: 'model.response',
      requestId: 'request-1',
      payload: { usage: { input_tokens: Number.NaN, output_tokens: Number.POSITIVE_INFINITY, total_tokens: Number.NEGATIVE_INFINITY } },
    }
    const [trace] = aggregateEvents([event(1, 'model.request', { usage: { total_tokens: 999 } }, { requestId: 'request-1' }), reply])
    expect(trace.calls[0].tokens).toEqual({})
    expect(trace.tokens.total).toEqual({ complete: false })
  })

  it('marks partial usage incomplete separately for each metric and all unknown as unknown', () => {
    const [trace] = aggregateEvents([request(1, 'a'), response(2, 'a'), request(3, 'b'), response(4, 'b', { usage: { input_tokens: 0 } })])
    expect(trace.tokens.input).toEqual({ value: 2, complete: true })
    expect(trace.tokens.output).toEqual({ value: 3, complete: false })
    expect(trace.tokens.total).toEqual({ value: 5, complete: false })
    expect(aggregateEvents([request(1)])[0].tokens.total).toEqual({ complete: false })
  })

  it('preserves contradictory lifecycle events and marks the Trace conflict', () => {
    const input = [event(1, 'trace.start'), request(2), response(3), event(4, 'trace.end'), event(5, 'trace.error', { message: 'late failure' })]
    const [trace] = aggregateEvents(input)
    expect(trace.status).toBe('conflict')
    expect(trace.events).toEqual(input)
    expect(trace.calls[0].status).toBe('success')
    expect(trace.timing.duration).toBeUndefined()
    expect(trace.issues).toContain('Conflicting Trace terminal events')
  })

  it('does not infer cancellation from waits, only from explicit information', () => {
    expect(aggregateEvents([request(1)])[0].calls[0].status).toBe('running')
    const [cancelled] = aggregateEvents([request(1), event(2, 'trace.end', {}, { status: 'cancelled' })])
    expect(cancelled.status).toBe('cancelled')
    expect(cancelled.calls[0].status).toBe('cancelled')
  })

  it('preserves unassociated declarations in the full response rather than inventing tool records', () => {
    const [trace] = aggregateEvents([request(1), response(2, 'request-1', { output: [{ type: 'function_call', name: 'tool' }] })])
    expect(trace.calls).toHaveLength(1)
    expect(trace.calls[0].issues.join(' ')).toContain('call_id missing')
    expect(JSON.parse(trace.calls[0].output!).output).toHaveLength(1)
  })

  it('uses deterministic event-ID sorting for ties and separates legacy and explicit identities', () => {
    const legacy = event(1, 'model.request', {}, { id: 'same' })
    const explicit = request(2, 'same')
    const a = event(3, 'model.response', { output_text: 'A' }, { requestId: 'same', id: 'a' })
    const b = event(3, 'model.response', { output_text: 'B' }, { requestId: 'same', id: 'b' })
    const [trace] = aggregateEvents([legacy, explicit, b, a])
    expect(new Set(trace.calls.map(call => call.id)).size).toBe(2)
    expect(JSON.parse(trace.calls[1].output!).output_text).toBe('A')
  })

  it('does not confuse a legacy source event ID with a located error requestId', () => {
    const [trace] = aggregateEvents([event(1, 'model.request', {}, { id: 'legacy-id' }), event(2, 'trace.error', { message: 'failure', requestId: 'legacy-id' })])
    expect(trace.calls[0].status).toBe('interrupted')
    expect(trace.calls[0].errors).toEqual([])
    expect(trace.issues).toContain('Error target not found: legacy-id')
  })

  it('keeps custom tool input and a first declaration selected by response order', () => {
    const custom = { type: 'custom_tool_call', call_id: 'custom', name: 'grammar', input: 'literal input' }
    const [trace] = aggregateEvents([
      request(1, 'a'),
      request(2, 'b'),
      response(3, 'b', { output: [toolCall, custom] }),
      response(4, 'a', { output: [{ ...toolCall, name: 'duplicate' }] }),
    ])
    const tool = trace.calls.find(call => call.callId === 'tool-1')!
    const parent = trace.calls.find(call => call.callId === 'b')!
    expect(tool.parentId).toBe(parent.id)
    expect(tool.name).toBe('get_weather')
    expect(tool.associationConflict).toBeTruthy()
    expect(trace.calls.find(call => call.callId === 'custom')?.input).toBe('literal input')
  })

  it('reports multiple endings and same-ID terminal contradictions without guessing a duration', () => {
    const ending = event(2, 'trace.end')
    const [repeated] = aggregateEvents([event(1, 'trace.start'), ending, event(3, 'trace.end')])
    expect(repeated.status).toBe('conflict')
    expect(repeated.timing.duration).toBeUndefined()
    const alternate = event(2, 'trace.error', { message: 'failure' })
    const [contradiction] = aggregateEvents([event(1, 'trace.start'), ending, alternate])
    expect(contradiction.status).toBe('conflict')
    expect(contradiction.conflicts).toEqual([alternate])
    expect(contradiction.timing.duration).toBeUndefined()
  })

  it('sorts timestamps chronologically even when fractional-second precision differs', () => {
    const early = { ...response(2, 'request-1', { output_text: 'early' }), eventId: 'early', timestamp: '2026-01-01T00:00:00.1Z' }
    const late = { ...response(2, 'request-1', { output_text: 'late' }), eventId: 'late', timestamp: '2026-01-01T00:00:00.11Z' }
    const [trace] = aggregateEvents([request(1), late, early])
    expect(JSON.parse(trace.calls[0].output!).output_text).toBe('early')
  })
})
