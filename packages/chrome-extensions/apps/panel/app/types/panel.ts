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
  duration: number
  traceId: string
  sessionId: string
  parentId: string
  payload: Record<string, string | number | boolean>
  timing: { queue: number, model: number, tool: number }
}
export interface TraceRow { event: PanelEvent, start: number }
export type DetailTab = 'Overview' | 'Usage' | 'Payload' | 'Timing' | 'Relations' | 'Raw'
