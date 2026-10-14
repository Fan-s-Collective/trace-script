// @vitest-environment happy-dom

import type { TraceEventEnvelope } from '@trace-script/metadata'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { useTracePanel } from '@/hooks/use-trace-panel'
import { EXTENSION_MESSAGE_TYPE } from '@/messages'

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
})
