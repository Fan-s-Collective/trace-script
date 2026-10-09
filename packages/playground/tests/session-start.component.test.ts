import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import App from '@/App.vue'

afterEach(() => vi.restoreAllMocks())

it('sends session.start as mock request data through the existing SDK', async () => {
  const postMessage = vi.spyOn(window, 'postMessage').mockImplementation(() => {})
  const wrapper = mount(App)
  expect(postMessage).not.toHaveBeenCalled()
  expect(wrapper.get('[role="status"]').text()).toBe('还没有发送数据')
  await wrapper.get('button').trigger('click')
  expect(postMessage).toHaveBeenCalledTimes(3)
  expect(postMessage).toHaveBeenNthCalledWith(2, {
    channel: 'trace-script',
    kind: 'trace-event',
    data: {
      eventId: expect.any(String),
      traceId: expect.any(String),
      sequence: 2,
      timestamp: expect.any(String),
      type: 'model.request',
      payload: {
        type: 'session.start',
        sessionId: expect.any(String),
        name: 'Playground debug session',
      },
    },
  }, window.location.origin)
  await wrapper.get('button').trigger('click')
  expect(postMessage).toHaveBeenCalledTimes(6)
  const events = postMessage.mock.calls.map(([message]) => message.data)
  expect(events.map(event => event.type)).toEqual([
    'trace.start',
    'model.request',
    'trace.end',
    'trace.start',
    'model.request',
    'trace.end',
  ])
  expect(events[0].traceId).toBe(events[2].traceId)
  expect(events[0].traceId).not.toBe(events[3].traceId)
  expect(events[1].payload.sessionId).not.toBe(events[4].payload.sessionId)
  expect(wrapper.get('[role="status"]').text()).toContain('已发送 2 条 session.start')
  wrapper.unmount()
})

it('reports SDK delivery failure without counting it as sent', async () => {
  const postMessage = vi.spyOn(window, 'postMessage').mockImplementation(() => {
    throw new Error('delivery failed')
  })
  const wrapper = mount(App)
  await wrapper.get('button').trigger('click')
  expect(wrapper.get('[role="status"]').text()).toBe('发送失败：DELIVERY_FAILED')
  postMessage.mockImplementation(() => {})
  await wrapper.get('button').trigger('click')
  expect(wrapper.get('[role="status"]').text()).toContain('已发送 1 条 session.start')
  wrapper.unmount()
})
