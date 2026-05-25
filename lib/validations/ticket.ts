import { z } from 'zod'

export const CreateTicketSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(150),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres').max(5000),
  category_id: z.string().uuid('category_id debe ser un UUID válido').optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
})

export const AIResponseSchema = z.object({
  summary: z.string().min(1),
  classification: z.enum(['billing', 'technical', 'general', 'urgent']),
  suggestions: z.array(z.string()).min(1).max(5),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
})

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>
export type AIAnalysisResult = z.infer<typeof AIResponseSchema>
