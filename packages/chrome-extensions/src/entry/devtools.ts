import { isUndefined } from '@trace-script/shared'

if (!isUndefined(chrome) && chrome.devtools) {
  chrome.devtools.panels.create('Agent Trace', '', 'panel.html')
}
