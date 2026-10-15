// @vitest-environment happy-dom

import type { TraceEventEnvelope } from '@trace-script/metadata'
import { aggregateEvents } from '@trace-script/core'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, nextTick } from 'vue'
import App from '@/App.vue'
import PayloadTab from '@/components/details/PayloadTab.vue'
import { useTracePanel } from '@/hooks/use-trace-panel'
import { EXTENSION_MESSAGE_TYPE } from '@/messages'
import { previewEvents } from '@/preview'
import EventDetails from '@/views/EventDetails.vue'
import TraceTimeline from '@/views/TraceTimeline.vue'

vi.mock('@iconify/vue', () => ({ Icon: { template: '<span />' } }))

const event = {
  eventId: 'event-1',
  traceId: 'trace-1',
  sequence: 1,
  timestamp: '2026-01-01T00:00:00.000Z',
  type: 'trace.start',
} satisfies TraceEventEnvelope

describe('trace panel state', () => {
  it('loads a query snapshot even when recording is paused', () => {
    const PanelState = defineComponent({
      setup() {
        return useTracePanel()
      },
      template: '<div />',
    })
    const wrapper = mount(PanelState)

    wrapper.vm.toggleRecording()
    wrapper.vm.handleMessage({ type: EXTENSION_MESSAGE_TYPE.TRACE_QUERY_RESULT, events: [event] })

    expect(wrapper.vm.events).toEqual([event])
    wrapper.unmount()
  })

  it('keeps explicit output-first selection and legacy source selection when input arrives', async () => {
    for (const explicit of [true, false]) {
      const wrapper = mount(defineComponent({ setup: useTracePanel, template: '<div />' }))
      const response: TraceEventEnvelope = {
        eventId: 'response',
        traceId: 't',
        sequence: 2,
        timestamp: '2026-01-01T00:00:01.000Z',
        type: 'model.response',
        ...(explicit ? { requestId: 'r' } : {}),
        payload: { output_text: 'Result' },
      }
      const request: TraceEventEnvelope = {
        eventId: 'request',
        traceId: 't',
        sequence: 1,
        timestamp: '2026-01-01T00:00:00.000Z',
        type: 'model.request',
        ...(explicit ? { requestId: 'r' } : {}),
        payload: { input: 'Question' },
      }
      wrapper.vm.handleMessage({ type: EXTENSION_MESSAGE_TYPE.TRACE_QUERY_RESULT, events: [response] })
      wrapper.vm.selectEvent(wrapper.vm.calls[0]!.id)
      const before = wrapper.vm.activeId
      wrapper.vm.handleMessage({ type: EXTENSION_MESSAGE_TYPE.TRACE_EVENTS_APPEND, event: request })
      await nextTick()
      expect(wrapper.vm.calls).toHaveLength(1)
      expect(wrapper.vm.selectedRecord?.kind).toBe('model')
      expect(wrapper.vm.activeId).toBe(wrapper.vm.calls[0]!.id)
      expect(wrapper.vm.selectedRecord && 'input' in wrapper.vm.selectedRecord ? wrapper.vm.selectedRecord.input : '').toContain('Question')
      if (explicit)
        expect(wrapper.vm.activeId).toBe(before)
      wrapper.unmount()
    }
  })

  it('retains conflicting arrivals for aggregation rather than discarding them in transport', () => {
    const wrapper = mount(defineComponent({ setup: useTracePanel, template: '<div />' }))
    const response = previewEvents.find(event => event.type === 'model.response')!
    wrapper.vm.handleMessage({ type: EXTENSION_MESSAGE_TYPE.TRACE_QUERY_RESULT, events: [response] })
    wrapper.vm.handleMessage({ type: EXTENSION_MESSAGE_TYPE.TRACE_EVENTS_APPEND, event: { ...response, timestamp: '2024-01-01T12:00:09.000Z' } })
    expect(wrapper.vm.events).toHaveLength(2)
    expect(wrapper.vm.calls).toHaveLength(2)
    expect(wrapper.vm.calls[0]!.associationConflict).toBeTruthy()
    expect(wrapper.vm.totalUsage.total.value).toBeUndefined()
    wrapper.unmount()
  })

  it('renders a flat call list and one timeline lane per type, with shared filtering and selection', async () => {
    const wrapper = mount(App)
    await nextTick()
    expect(wrapper.find('.trace-summary').exists()).toBeFalsy()
    expect(wrapper.find('.collapse-button').exists()).toBeFalsy()
    expect(wrapper.find('.timeline-trace').exists()).toBeFalsy()
    expect(wrapper.findAll('.event-row')).toHaveLength(3)
    expect(wrapper.findAll('.event-table-body > .event-row')).toHaveLength(3)
    expect(wrapper.findAll('.timeline-row')).toHaveLength(2)
    expect(wrapper.findAll('.timeline-bar')).toHaveLength(3)
    expect(wrapper.findAll('.timeline-row')[0]!.findAll('.timeline-bar')).toHaveLength(2)
    expect(wrapper.findAll('.timeline-row')[1]!.findAll('.timeline-bar')).toHaveLength(1)
    expect(wrapper.findAll('.timeline-label').map(group => group.text())).toEqual(['model 2 calls', 'tool 1 calls'])
    expect(wrapper.find('.event-row.selected').text()).toContain('900ms')
    await wrapper.find('select[aria-label="Type"]').setValue('tool')
    expect(wrapper.findAll('.event-row')).toHaveLength(1)
    expect(wrapper.findAll('.timeline-label').map(group => group.text())).toEqual(['tool 1 calls'])
    await wrapper.find('.timeline-bar').trigger('click')
    expect(wrapper.find('.event-row.selected').text()).toContain('get_weather')
    expect(wrapper.find('.details-content').text()).toContain('Beijing')
    await wrapper.find('select[aria-label="Type"]').setValue('all')
    expect(wrapper.findAll('.event-row')).toHaveLength(3)
    await wrapper.find('.event-row').trigger('click')
    expect(wrapper.find('.timeline-bar.selected').attributes('aria-label')).toContain('gpt-4.1-mini')
    await wrapper.find('input[aria-label="Search name or ID"]').setValue('no matching call')
    expect(wrapper.findAll('.event-row')).toHaveLength(0)
    expect(wrapper.findAll('.timeline-row')).toHaveLength(0)
    expect(wrapper.findAll('.empty-state').filter(state => state.text() === 'No calls match these filters')).toHaveLength(2)
    wrapper.unmount()
  })

  it('orders interleaved calls across Traces by time and combines equal types in the timeline', async () => {
    const wrapper = mount(defineComponent({ setup: useTracePanel, template: '<div />' }))
    const events = ['z-early', 'a-later'].flatMap((traceId, index) => previewEvents.map(event => ({
      ...event,
      traceId,
      eventId: `${traceId}-${event.eventId}`,
      timestamp: new Date(Date.parse(event.timestamp) + index * 500).toISOString(),
    })))
    wrapper.vm.handleMessage({ type: EXTENSION_MESSAGE_TYPE.TRACE_QUERY_RESULT, events: events.reverse() })
    expect(wrapper.vm.visibleCalls.map(call => `${call.traceId}:${call.callId}`)).toEqual([
      'z-early:request-1',
      'a-later:request-1',
      'z-early:call-weather',
      'a-later:call-weather',
      'z-early:request-2',
      'a-later:request-2',
    ])
    const timeline = mount(TraceTimeline, { props: { calls: wrapper.vm.visibleCalls, selectedId: '' } })
    expect(timeline.findAll('.timeline-row')).toHaveLength(2)
    expect(timeline.findAll('.timeline-label').map(group => group.text())).toEqual(['model 4 calls', 'tool 2 calls'])
    expect(timeline.findAll('.timeline-bar')).toHaveLength(6)
    expect(timeline.findAll('.timeline-row')[0]!.findAll('.timeline-bar')).toHaveLength(4)
    expect(timeline.findAll('.timeline-row')[1]!.findAll('.timeline-bar')).toHaveLength(2)
    expect(timeline.find('.timeline-bar').attributes('style')).toContain('left: 0%')
    timeline.unmount()
    wrapper.unmount()
  })

  it('keeps the active detail tab and scroll container when output arrives', async () => {
    const state = mount(defineComponent({ setup: useTracePanel, template: '<div />' }))
    const request = previewEvents[1]!
    const response = previewEvents[2]!
    state.vm.handleMessage({ type: EXTENSION_MESSAGE_TYPE.TRACE_QUERY_RESULT, events: [request] })
    const details = mount(defineComponent({
      components: { EventDetails },
      setup: () => ({ record: computed(() => state.vm.calls[0]), traces: computed(() => state.vm.traces) }),
      template: '<EventDetails :record="record" :traces="traces" />',
    }))
    const usageTab = details.findAll('[role="tab"]').find(tab => tab.text() === 'Usage')!
    await usageTab.trigger('click')
    const scroll = details.find('.details-content').element
    scroll.scrollTop = 80
    state.vm.handleMessage({ type: EXTENSION_MESSAGE_TYPE.TRACE_EVENTS_APPEND, event: response })
    await nextTick()
    expect(details.find('[role="tab"][aria-selected="true"]').text()).toBe('Usage')
    expect(details.find('.details-content').element).toBe(scroll)
    expect(scroll.scrollTop).toBe(80)
    expect(details.text()).toContain('36')
    details.unmount()
    state.unmount()
  })

  it('navigates only flat visible calls and keeps Trace and related-call jumps available', async () => {
    const wrapper = mount(defineComponent({ setup: useTracePanel, template: '<div />' }))
    const trace = wrapper.vm.traces[0]!
    wrapper.vm.selectEvent(trace.id)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    await nextTick()
    expect(wrapper.vm.activeId).toBe(trace.calls[0]!.id)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    await nextTick()
    expect(wrapper.vm.activeId).toBe(trace.calls[1]!.id)
    wrapper.vm.filter.type = 'model'
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    await nextTick()
    expect(wrapper.vm.activeId).toBe(trace.calls[0]!.id)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    await nextTick()
    expect(wrapper.vm.activeId).toBe(trace.calls[2]!.id)
    wrapper.vm.selectEvent(trace.calls[1]!.id)
    expect(wrapper.vm.activeId).toBe(trace.calls[1]!.id)
    wrapper.vm.selectEvent(trace.id)
    expect(wrapper.vm.selectedRecord?.kind).toBe('trace')
    wrapper.unmount()
  })

  it('renders payload markup as text without creating executable elements', () => {
    const malicious: TraceEventEnvelope = {
      eventId: 'malicious',
      traceId: 't',
      sequence: 1,
      timestamp: '2026-01-01T00:00:00.000Z',
      type: 'model.response',
      payload: { output_text: '<img src=x onerror="alert(1)"><script>alert(1)</script>' },
    }
    const wrapper = mount(PayloadTab, { props: { record: aggregateEvents([malicious])[0]!.calls[0]! } })
    expect(wrapper.text()).toContain('<img')
    expect(wrapper.find('img').exists()).toBeFalsy()
    expect(wrapper.find('script').exists()).toBeFalsy()
    wrapper.unmount()
  })
})
