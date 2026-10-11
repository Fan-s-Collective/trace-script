# Trace Script Playground

Run `pnpm dev` from the repository root and open `http://127.0.0.1:4317`.

The playground is a private workspace used for SDK scenarios and Chrome extension acceptance. It is excluded from extension packaging. The weather Agent flow runs two Responses-style model calls with a tool execution and records every request, response, tool result, and terminal event through `@trace-script/sdk`.

Run `pnpm build` for a static playground and the production extension. Load `packages/chrome-extensions/dist` as an unpacked extension, then open this page's DevTools and select Agent Trace.
