export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'
export type AIClassification = 'billing' | 'technical' | 'general' | 'urgent'
export type AIRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface TicketListItem {
  id: string
  title: string
  status: TicketStatus
  priority: TicketPriority
  created_at: string
  updated_at: string
  categories: { id: string; name: string; color: string } | null
  profiles: { id: string; full_name: string; avatar_url: string | null } | null
  ai_analyses: {
    risk_level: AIRiskLevel
    classification: AIClassification
    summary: string
    created_at: string
  }[]
}

export interface CreateTicketPayload {
  title: string
  description: string
  category_id?: string
  priority: TicketPriority
}

export interface CreateTicketResponse {
  ticket: {
    id: string
    title: string
    status: TicketStatus
    priority: TicketPriority
    created_at: string
  }
  analysis: {
    summary: string
    classification: AIClassification
    suggestions: string[]
    riskLevel: AIRiskLevel
    isFallback: boolean
  }
}