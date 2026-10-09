// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import PanelShell from '@/panel/app/components/foundation/PanelShell.vue'

afterEach(() => vi.unstubAllGlobals())

it('forwards complete page events into pre elements with tab isolation and replay', async () => {
  let receiveRuntime = (message: object, sender: { id: string, tab: { id: number } }) => {
    void message
    void sender
  }
  let connect = (port: object) => {
    void port
  }
  const panelListeners: Array<(message: object) => void> = []
  const readyListeners: Array<(message: object) => void> = []
  const disconnectListeners: Array<() => void> = []
  const disconnect = vi.fn()
  const port = {
    name: 'trace-script-panel',
    onMessage: { addListener: (listener: (message: object) => void) => readyListeners.push(listener) },
    onDisconnect: { addListener: (listener: () => void) => disconnectListeners.push(listener) },
    postMessage: (message: object) => panelListeners.forEach(listener => listener(message)),
  }
  let senderTabId = 7
  vi.stubGlobal('chrome', {
    runtime: {
      id: 'test-extension',
      onMessage: { addListener: (listener: typeof receiveRuntime) => { receiveRuntime = listener } },
      onConnect: { addListener: (listener: typeof connect) => { connect = listener } },
      sendMessage: vi.fn((message: object) => {
        receiveRuntime(message, { id: 'test-extension', tab: { id: senderTabId } })
        return Promise.resolve()
      }),
      connect: () => {
        connect(port)
        return {
          onMessage: { addListener: (listener: (message: object) => void) => panelListeners.push(listener) },
          onDisconnect: { addListener: (listener: () => void) => disconnectListeners.push(listener) },
          postMessage: (message: object) => readyListeners.forEach(listener => listener(message)),
          disconnect,
        }
      },
    },
    tabs: { onRemoved: { addListener: vi.fn() } },
    devtools: { inspectedWindow: { tabId: 7 } },
  })
  await import('../apps/extension/background/index')
  await import('../apps/extension/content/index')
  const event = {
    eventId: 'event-1',
    traceId: 'trace-1',
    sequence: 1,
    timestamp: '2026-01-01T00:00:00.000Z',
    type: 'model.request',
    payload: { input: '<script>alert(1)</script>', nested: { list: [1, false, null] } },
  }
  const send = (data: object, source = window) => window.dispatchEvent(new MessageEvent('message', {
    data,
    source,
    origin: window.location.origin,
  }))
  const message = { channel: 'trace-script', kind: 'trace-event', data: event }
  send(message)
  const wrapper = mount(PanelShell)
  await nextTick()
  expect(wrapper.findAll('pre')).toHaveLength(1)
  expect(wrapper.get('pre').element.textContent).toBe(JSON.stringify(event, null, 2))
  expect(wrapper.find('pre script').exists()).toBeFalsy()
  senderTabId = 8
  send(message)
  senderTabId = 7
  send({ ...message, channel: 'other' })
  send({ ...message, data: { ...event, sequence: -1 } })
  await nextTick()
  expect(wrapper.findAll('pre')).toHaveLength(1)
  send({ ...message, data: { ...event, eventId: 'event-2', sequence: 2 } })
  await nextTick()
  expect(wrapper.findAll('pre')).toHaveLength(2)
  disconnectListeners.forEach(listener => listener())
  await nextTick()
  expect(wrapper.text()).toContain('Disconnected')
  wrapper.unmount()
  expect(disconnect).toHaveBeenCalledOnce()
})
