# Chrome extension

This package receives envelopes emitted by `@trace-script/sdk` and displays them in a Manifest V3 DevTools panel. The transport is deliberately small:

```text
SDK window.postMessage -> content script -> service worker -> Agent Trace panel
```

The worker validates every event with `@trace-script/core`, keeps events isolated by inspected tab, and sends an initial snapshot plus live additions to the panel. Invalid or legacy event shapes are ignored so the panel renders the SDK protocol.

Run `pnpm build` from this package to assemble `dist`, or `pnpm build:dev` to assemble the development extension in `dist-dev`. Load the chosen directory from Chrome's extensions page with developer mode enabled, then open a page's DevTools and select **Agent Trace**. Reload the extension after rebuilding. Use `pnpm dev` for the live Vite preview at `panel.html`; it does not rebuild the unpacked extension directory.
