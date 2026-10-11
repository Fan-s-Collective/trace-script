# `@trace-script/sdk`

The Trace Script page SDK records model and tool events from a browser page and publishes them to the Trace Script page bridge. It does not call a model, execute tools, inspect `response.output`, or depend on `chrome.*` APIs.

## Install

```sh
pnpm add @trace-script/sdk
```

The package exports `createTraceSdk`, `TraceHandle`, and `RecordResult`. The published build includes protocol validation, so applications do not need the private workspace packages.

## Quick start

Create one SDK instance when the page is initialized and one trace for each user request. Use the same request object for the model call and `recordRequest`.

```ts
import { createTraceSdk } from '@trace-script/sdk'

const traceSdk = createTraceSdk()

async function answer(input: string) {
  const trace = traceSdk.startTrace()
  const request = {
    model: 'gpt-4.1',
    input: [{ role: 'user', content: input }],
  }

  try {
    trace.recordRequest(request)
    const response = await openai.responses.create(request)
    trace.recordResponse(response)
    trace.end()
    return response
  }
  catch (error) {
    trace.fail(error instanceof Error ? error : String(error))
    throw error
  }
}
```

All record methods return a result instead of throwing. Recording is best effort and does not replace the application's model, tool, or error handling.

## Tool-call flow

The SDK records complete request and response objects. The application decides whether a response contains a tool call, executes the tool, and builds the next model request.

```ts
async function answerWithWeather(input: string) {
  const trace = traceSdk.startTrace()

  try {
    const firstRequest = {
      model: 'gpt-4.1',
      input: [{ role: 'user', content: input }],
      tools: [{ type: 'function', name: 'get_weather' }],
    }
    trace.recordRequest(firstRequest)

    const firstResponse = await openai.responses.create(firstRequest)
    trace.recordResponse(firstResponse)

    const call = firstResponse.output.find(item => item.type === 'function_call')
    if (!call)
      throw new Error('Expected a function call')

    const weather = await getWeather(JSON.parse(call.arguments).city)
    const output = JSON.stringify(weather)
    trace.recordToolResult({ callId: call.call_id, output })

    const secondRequest = {
      model: 'gpt-4.1',
      input: [
        ...firstRequest.input,
        ...firstResponse.output,
        { type: 'function_call_output', call_id: call.call_id, output },
      ],
      tools: firstRequest.tools,
    }
    trace.recordRequest(secondRequest)

    const secondResponse = await openai.responses.create(secondRequest)
    trace.recordResponse(secondResponse)
    trace.end()
    return secondResponse
  }
  catch (error) {
    trace.fail(error instanceof Error ? error : String(error))
    throw error
  }
}
```

For a final response, call `end()` after `recordResponse`. For a model or tool failure, call `fail(error)` once and keep the application's normal error flow.

## API

### `createTraceSdk()`

Returns `{ startTrace }`. A unique `traceId` is generated for each trace.

### `startTrace()`

Returns a `TraceHandle` and attempts to publish `trace.start`.

```ts
interface TraceHandle {
  readonly traceId: string
  recordRequest: (request: object) => RecordResult
  recordResponse: (response: object) => RecordResult
  recordToolResult: (result: { callId: string, output: string }) => RecordResult
  end: () => RecordResult
  fail: (error: Error | string) => RecordResult
}
```

`recordRequest` and `recordResponse` accept the JSON object sent to or returned from the model and preserve its fields, including `output`, `usage`, and JSON `null` values. `recordToolResult` records the model's `function_call.call_id` as `callId` and the exact submitted output string.

`end()` publishes `trace.end`. `fail(error)` publishes `trace.error` with `{ message }`, using `error.message` for an `Error`. Both are terminal: further record calls return `TRACE_ENDED`. Repeating either method is harmless and returns success without another event.

### `RecordResult`

```ts
type RecordResult
  = | { success: true }
    | {
      success: false
      reason:
        | 'INVALID_EVENT'
        | 'INVALID_BRIDGE'
        | 'DELIVERY_FAILED'
        | 'TRACE_ENDED'
    }
```

Only successful events consume a sequence number. A failed record does not interrupt the application or advance the trace sequence.

## Events and transport

Each successful call publishes one message:

```ts
const message = {
  channel: 'trace-script',
  kind: 'trace-event',
  data: {
    eventId: 'event-1',
    traceId: 'trace-1',
    sequence: 1,
    timestamp: '2026-01-01T00:00:00.000Z',
    type: 'model.request',
    payload: { model: 'gpt-4.1' },
  },
}
```

`trace.start` and `trace.end` have no payload. Model events contain the supplied JSON object. `tool.result` contains `{ callId, output }`; an error contains `{ message }`.

Messages are sent individually with:

```ts
window.postMessage(message, window.location.origin)
```

The SDK does not buffer, retry, batch, or persist events. If `postMessage` throws, the call returns `DELIVERY_FAILED`; the SDK is suitable for diagnostics, not guaranteed delivery.

The protocol validates event data and creates a JSON snapshot at record time. Non-serializable values or invalid payloads return a failure result. The SDK does not redact secrets automatically, so do not record sensitive fields.

## Development

From the repository root:

```sh
pnpm --filter @trace-script/sdk typecheck
pnpm --filter @trace-script/sdk build
```

The lifecycle tests cover no-tool and tool-call traces, snapshots, terminal errors, invalid payloads, large JSON responses, and failed page delivery.
