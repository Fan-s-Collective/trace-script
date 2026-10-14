# Trace protocol core

`@trace-script/core` validates the minimal event and single-event page bridge used by the SDK. `safeParseTraceEvent` and `safeParseBridgeMessage` return validation issues; `parseTraceEvent` and `parseBridgeMessage` throw `ProtocolValidationError`.

See [the stage 2 design](../../docs/02-trace-protocol-and-sdk.md) for event shapes and application responsibilities.


`aggregateEvents(events)` derives Trace summaries and stable model/tool call records from validated envelopes. It orders each Trace by sequence, timestamp and event ID, deduplicates equivalent events, retains conflicting arrivals, and pairs models by Trace ID plus request ID. Unlabelled legacy responses match only a unique unlabelled pending request. Tool declarations come only from Responses `output` function calls, never from request history.

Records preserve complete source events and formatted input/output for safe text rendering. Trace state and call state are separate; conflicts, missing endpoints, partial usage and interrupted calls are explicit. Tools expose a return interval, not execution time. Only model response usage contributes to `sumUsage`, with per-metric completeness. No mutable secondary ledger, streaming deltas, provider execution timing or text-based token estimates are introduced.
