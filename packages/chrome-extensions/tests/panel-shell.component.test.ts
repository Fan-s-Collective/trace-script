// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import PanelShell from '@/panel/app/components/foundation/PanelShell.vue'

it('renders the panel identity, build version, and standalone preview status', () => {
  const wrapper = mount(PanelShell)

  expect(wrapper.get('h1').text()).toBe('Agent Trace')
  expect(wrapper.text()).toContain('v0.1.0')
  expect(wrapper.get('[aria-label="Raw trace events"]').text()).toContain('Open this panel in Chrome DevTools')
  wrapper.unmount()
})
