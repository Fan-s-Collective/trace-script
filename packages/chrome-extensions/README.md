# Chrome extension

This package receives envelopes emitted by `@trace-script/sdk` and displays them in a Manifest V3 DevTools panel. The transport is deliberately small:

```text
SDK window.postMessage -> content script -> service worker -> Agent Trace panel
```

The worker validates every event with `@trace-script/core`, keeps events isolated by inspected tab, and sends an initial snapshot plus live additions to the panel. Invalid or legacy event shapes are ignored so the panel renders the SDK protocol.

Run `pnpm build` from this package to assemble `dist`. Load the chosen directory from Chrome's extensions page with developer mode enabled, then open a page's DevTools and select **Agent Trace**. Reload the extension after rebuilding. `pnpm dev` watches the extension entry points and produces fresh development assets in `dist-dev`.
