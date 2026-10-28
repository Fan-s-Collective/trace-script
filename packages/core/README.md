# Trace protocol core

`@trace-script/core` validates the minimal event and single-event page bridge used by the SDK. `safeParseTraceEvent` and `safeParseBridgeMessage` return validation issues; `parseTraceEvent` and `parseBridgeMessage` throw `ProtocolValidationError`.

See [the stage 2 design](../../docs/02-trace-protocol-and-sdk.md) for event shapes and application responsibilities.

`aggregateEvents(events)` derives `TraceSummary` and model/tool `CallRecord` values from validated raw events. Calls retain full inputs, outputs, source events, conflicts, status, observed timing, and final response usage. Explicit request IDs support concurrent calls; unlabelled events use conservative legacy pairing.

Only model responses contribute tokens. Missing totals can be derived from valid input/output amounts; invalid reported totals remain unknown. `sumUsage` marks incomplete metrics rather than treating unknown usage as zero.
