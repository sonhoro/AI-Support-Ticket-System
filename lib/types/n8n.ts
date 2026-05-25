export type N8nEventType =
  | 'ticket.escalation.critical'
  | 'ticket.status.changed'
  | 'ticket.assigned'
  | 'ticket.comment.added'

export interface N8nWebhookPayload {
  event: N8nEventType
  timestamp: string
  ticketId: string
  userId: string
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  classification?: 'billing' | 'technical' | 'general' | 'urgent'
  summary?: string
  metadata?: Record<string, unknown>
}

export interface N8nInboundPayload {
  event: 'notification.send' | 'ticket.update'
  ticketId: string
  secret: string
  notification?: {
    userId: string
    type: string
    title: string
    body: string
  }
  ticketUpdate?: {
    status?: string
    assigned_to?: string
  }
}