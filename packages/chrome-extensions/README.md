# Chrome extension

This package receives envelopes emitted by `@trace-script/sdk` and displays them in a Manifest V3 DevTools panel. The transport is deliberately small:

```text
SDK window.postMessage -> content script -> service worker -> Agent Trace panel
```

The worker validates every event with `@trace-script/core`, keeps events isolated by inspected tab, and sends an initial snapshot plus live additions to the panel. Invalid event shapes are ignored. Valid older events without model request IDs are retained and conservatively paired.

Run `pnpm build` from this package to assemble `dist`, or `pnpm dev` to assemble the development extension in `dist-dev`. Load the chosen directory from Chrome's extensions page with developer mode enabled, then open a page's DevTools and select **Agent Trace**. Reload the extension after rebuilding. Use `pnpm dev:panel` for the live Vite preview at `index.html`; it does not rebuild the unpacked extension directory.


The panel derives its display through core aggregation: a flat list of model and tool calls ordered by time, one timeline lane per type with calls positioned horizontally, and continuous Input / Output details. Timeline labels place the type on the left and matched call count on the right. Overview, Usage, Timing, Relations and Raw Events expose completeness, timing boundaries, parent links and complete source payloads. Filters, keyboard navigation, matched counts and consumption use the same call records. Only-errors mode shows failed calls; Trace summaries remain accessible through Relations. Source-based selection keeps an orphan legacy result selected when its input arrives; live updates preserve the active detail tab and scroll container.
