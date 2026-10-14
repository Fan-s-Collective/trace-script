if (typeof chrome !== 'undefined' && chrome.devtools) {
  chrome.devtools.panels.create('Agent Trace', '', 'panel.html')
}
