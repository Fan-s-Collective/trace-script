import { describe, expect, it } from 'vitest'
import { isContentToWorkerMessage, isPanelToWorkerMessage } from '../src/messages'

describe('extension message guards', () => {
  it('accepts an event envelope candidate from content scripts', () => {
    expect(isContentToWorkerMessage({ type: 'INGEST_EVENT', event: { type: 'trace.start' } })).toBeTruthy()
  })

  it('rejects malformed content messages', () => {
    expect(isContentToWorkerMessage({ type: 'INGEST_EVENT', event: 'event' })).toBeFalsy()
    expect(isContentToWorkerMessage({ type: 'OTHER' })).toBeFalsy()
  })

  it('accepts panel registration and query messages', () => {
    expect(isPanelToWorkerMessage({ type: 'PANEL_CONNECT', tabId: 7 })).toBeTruthy()
    expect(isPanelToWorkerMessage({ type: 'TRACE_QUERY' })).toBeTruthy()
  })

  it('rejects invalid panel registration', () => {
    expect(isPanelToWorkerMessage({ type: 'PANEL_CONNECT', tabId: '7' })).toBeFalsy()
    expect(isPanelToWorkerMessage({ type: 'TRACE_QUERY', tabId: 7 })).toBeTruthy()
  })
})
