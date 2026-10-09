// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import PanelShell from '@/panel/app/components/foundation/PanelShell.vue'

it('renders the complete DevTools workbench', () => {
  const wrapper = mount(PanelShell)

  expect(wrapper.text()).toContain('Agent Trace')
  expect(wrapper.get('[aria-label="Event timeline"]').exists()).toBeTruthy()
  expect(wrapper.get('[aria-label="Trace events"]').exists()).toBeTruthy()
  expect(wrapper.get('.details-empty').exists()).toBeTruthy()
  expect(wrapper.text()).toContain('0 events')
  wrapper.unmount()
})
