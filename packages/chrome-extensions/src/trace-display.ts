import type { TraceEventEnvelope } from '@trace-script/metadata'
import { TRACE_EVENT_TYPE } from '@trace-script/metadata'
import { isArray, isNumber, isObject, isString } from '@trace-script/shared'

/** OpenAI Responses payload keys used by the display adapter. */
const OPENAI_RESPONSE_FIELD = {
  MODEL: 'model',
  USAGE: 'usage',
  TOTAL_TOKENS: 'total_tokens',
  OUTPUT_TEXT: 'output_text',
  OUTPUT: 'output',
} as const

function payloadText(event: TraceEventEnvelope): string {
  if (!('payload' in event))
    return ''
  const serialized = JSON.stringify(event.payload)
  return serialized ?? ''
}

function modelOf(event: Extract<TraceEventEnvelope, { type: typeof TRACE_EVENT_TYPE.MODEL_REQUEST | typeof TRACE_EVENT_TYPE.MODEL_RESPONSE }>): string {
  const model = event.payload[OPENAI_RESPONSE_FIELD.MODEL]
  return isString(model) ? model : 'unknown model'
}

function totalTokensOf(event: Extract<TraceEventEnvelope, { type: typeof TRACE_EVENT_TYPE.MODEL_RESPONSE }>): string {
  const usage = event.payload[OPENAI_RESPONSE_FIELD.USAGE]
  if (isObject(usage) && OPENAI_RESPONSE_FIELD.TOTAL_TOKENS in usage && isNumber(usage[OPENAI_RESPONSE_FIELD.TOTAL_TOKENS]))
    return `${usage[OPENAI_RESPONSE_FIELD.TOTAL_TOKENS]} tokens`
  return 'token usage unavailable'
}

function responseOutputOf(event: Extract<TraceEventEnvelope, { type: typeof TRACE_EVENT_TYPE.MODEL_RESPONSE }>): string {
  const outputText = event.payload[OPENAI_RESPONSE_FIELD.OUTPUT_TEXT]
  if (isString(outputText))
    return outputText
  if (isArray(event.payload[OPENAI_RESPONSE_FIELD.OUTPUT]))
    return JSON.stringify(event.payload[OPENAI_RESPONSE_FIELD.OUTPUT]) ?? 'response output unavailable'
  return 'response output unavailable'
}

export function eventTitle(event: TraceEventEnvelope): string {
  if (event.type === TRACE_EVENT_TYPE.MODEL_REQUEST || event.type === TRACE_EVENT_TYPE.MODEL_RESPONSE)
    return `${event.type} · ${modelOf(event)}`
  if (event.type === TRACE_EVENT_TYPE.TOOL_RESULT)
    return `${event.type} · ${event.payload.callId}`
  return event.type
}

export function eventSummary(event: TraceEventEnvelope): string {
  switch (event.type) {
    case TRACE_EVENT_TYPE.TRACE_START:
      return 'Trace started'
    case TRACE_EVENT_TYPE.TRACE_END:
      return 'Trace ended'
    case TRACE_EVENT_TYPE.TRACE_ERROR:
      return event.payload.message
    case TRACE_EVENT_TYPE.TOOL_RESULT:
      return event.payload.output
    case TRACE_EVENT_TYPE.MODEL_REQUEST:
      return `${modelOf(event)} request · ${payloadText(event)}`
    case TRACE_EVENT_TYPE.MODEL_RESPONSE:
      return `${totalTokensOf(event)} · ${responseOutputOf(event)}`
  }
}
