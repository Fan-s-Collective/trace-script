// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { nextTick } from 'vue'
import PanelShell from '@/panel/app/components/foundation/PanelShell.vue'

it('starts empty and exposes the real event filters', async () => {
  const wrapper = mount(PanelShell)
  expect(wrapper.findAll('.trace-row')).toHaveLength(0)
  await wrapper.get('input[aria-label="Search events"]').setValue('real-event')
  await nextTick()
  expect(wrapper.text()).toContain('No events match these filters')
  wrapper.unmount()
})
