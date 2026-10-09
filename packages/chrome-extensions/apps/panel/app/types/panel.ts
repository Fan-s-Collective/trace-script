export type PanelStatus = 'success' | 'running' | 'failed' | 'cancelled'
export interface PanelEvent {
  id: string
  sequence: number
  timestamp: number
  name: string
  type: string
  status: PanelStatus
  agent: string
  model: string
  tokens: number
  tokensReported: boolean
  duration: number
  durationReported: boolean
  traceId: string
  sessionId: string
  parentId: string
  payload: Record<string, string | number | boolean>
}
export interface TraceRow { event: PanelEvent, start: number }
export type DetailTab = 'Overview' | 'Payload' | 'Relations' | 'Raw'
