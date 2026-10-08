# Trace protocol core

`@trace-script/core` validates the minimal event and single-event page bridge used by the SDK. `safeParseTraceEvent` and `safeParseBridgeMessage` return validation issues; `parseTraceEvent` and `parseBridgeMessage` throw `ProtocolValidationError`. Both boundaries enforce UTF-8 size limits.

See [the stage 2 design](../../docs/02-trace-protocol-and-sdk.md) for event shapes and application responsibilities.
