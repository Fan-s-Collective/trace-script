import { z } from 'zod'

export const TRACE_CHANNEL = 'trace-script' as const
export const TRACE_BRIDGE_KIND = 'trace-event' as const
export const TRACE_EVENT_TYPE = {
  TRACE_START: 'trace.start',
  MODEL_REQUEST: 'model.request',
  MODEL_RESPONSE: 'model.response',
  TOOL_RESULT: 'tool.result',
  TRACE_END: 'trace.end',
  TRACE_ERROR: 'trace.error',
} as const

export const TRACE_EVENT_TYPES = [
  TRACE_EVENT_TYPE.TRACE_START,
  TRACE_EVENT_TYPE.MODEL_REQUEST,
  TRACE_EVENT_TYPE.MODEL_RESPONSE,
  TRACE_EVENT_TYPE.TOOL_RESULT,
  TRACE_EVENT_TYPE.TRACE_END,
  TRACE_EVENT_TYPE.TRACE_ERROR,
] as const

const identifierSchema = z.string().min(1).max(200)
const eventFields = {
  eventId: identifierSchema,
  traceId: identifierSchema,
  sequence: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  timestamp: z.iso.datetime({ offset: false }),
}

const jsonObjectSchema = z.record(z.string(), z.json())

export const traceEventEnvelopeSchema = z.discriminatedUnion('type', [
  z.strictObject({ ...eventFields, type: z.literal(TRACE_EVENT_TYPE.TRACE_START) }),
  z.strictObject({ ...eventFields, type: z.literal(TRACE_EVENT_TYPE.MODEL_REQUEST), payload: jsonObjectSchema }),
  z.strictObject({ ...eventFields, type: z.literal(TRACE_EVENT_TYPE.MODEL_RESPONSE), payload: jsonObjectSchema }),
  z.strictObject({
    ...eventFields,
    type: z.literal(TRACE_EVENT_TYPE.TOOL_RESULT),
    payload: z.strictObject({ callId: identifierSchema, output: z.string() }),
  }),
  z.strictObject({ ...eventFields, type: z.literal(TRACE_EVENT_TYPE.TRACE_END) }),
  z.strictObject({
    ...eventFields,
    type: z.literal(TRACE_EVENT_TYPE.TRACE_ERROR),
    payload: z.strictObject({ message: z.string() }),
  }),
])

export const traceBridgeMessageSchema = z.strictObject({
  channel: z.literal(TRACE_CHANNEL),
  kind: z.literal(TRACE_BRIDGE_KIND),
  data: traceEventEnvelopeSchema,
})

export type TraceEventEnvelope = z.infer<typeof traceEventEnvelopeSchema>
export type TraceBridgeMessage = z.infer<typeof traceBridgeMessageSchema>
export type TraceEventType = TraceEventEnvelope['type']
