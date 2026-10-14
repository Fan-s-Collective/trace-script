import { beforeEach, describe, expect, it, vi } from 'vitest'

interface FakePort {
  name: string
  sender?: { tab?: { id?: number } }
  postMessage: (message: object) => void
  onMessage: { addListener: (listener: (message: object) => void) => void }
  onDisconnect: { addListener: (listener: () => void) => void }
}

let connect: (port: chrome.runtime.Port) => void = () => {}

function createPort(name: string, tabId?: number): { port: chrome.runtime.Port, send: (message: object) => void, received: object[] } {
  let listener: (message: object) => void = () => {}
  const received: object[] = []
  const fake: FakePort = {
    name,
    sender: typeof tabId === 'number' ? { tab: { id: tabId } } : undefined,
    postMessage: message => received.push(message),
    onMessage: { addListener: next => listener = next },
    onDisconnect: { addListener: () => {} },
  }
  const port = fake as chrome.runtime.Port
  connect(port)
  return { port, send: message => listener(message), received }
}

beforeEach(async () => {
  vi.resetModules()
  vi.stubGlobal('chrome', {
    runtime: {
      onConnect: { addListener: (listener: (port: chrome.runtime.Port) => void) => connect = listener },
    },
  })
  await import('../src/entry/background')
})

describe('background trace transport', () => {
  it('keeps tab data isolated and broadcasts validated SDK events', () => {
    const panelA = createPort('trace-panel')
    panelA.send({ type: 'PANEL_CONNECT', tabId: 1 })
    const panelB = createPort('trace-panel')
    panelB.send({ type: 'PANEL_CONNECT', tabId: 2 })
    const content = createPort('trace-content', 1)

    content.send({
      type: 'INGEST_EVENT',
      event: {
        eventId: 'event-1',
        traceId: 'trace-1',
        sequence: 1,
        timestamp: '2026-01-01T00:00:00.000Z',
        type: 'trace.start',
      },
    })
    content.send({ type: 'INGEST_EVENT', event: { type: 'not-an-sdk-event' } })

    expect(panelA.received.map(message => 'type' in message ? message.type : '')).toEqual([
      'TRACE_QUERY_RESULT',
      'TRACE_EVENTS_APPEND',
    ])
    expect(panelB.received).toHaveLength(1)
    const append = panelA.received[1]
    expect(append).toMatchObject({ type: 'TRACE_EVENTS_APPEND', event: { eventId: 'event-1' } })
  })

  it('returns the tab snapshot when a panel reconnects', () => {
    const content = createPort('trace-content', 7)
    content.send({
      type: 'INGEST_EVENT',
      event: {
        eventId: 'event-2',
        traceId: 'trace-2',
        sequence: 1,
        timestamp: '2026-01-01T00:00:00.000Z',
        type: 'trace.end',
      },
    })
    const panel = createPort('trace-panel')
    panel.send({ type: 'PANEL_CONNECT', tabId: 7 })
    expect(panel.received[0]).toMatchObject({
      type: 'TRACE_QUERY_RESULT',
      events: [{ eventId: 'event-2' }],
    })
  })
})
