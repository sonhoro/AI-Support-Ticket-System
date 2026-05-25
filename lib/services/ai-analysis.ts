import { AIAnalysisResult, AIResponseSchema } from '@/lib/validations/ticket'

const SYSTEM_PROMPT = `Eres un sistema experto de clasificación de tickets de soporte técnico.
Analiza el ticket proporcionado y responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin backticks.
El JSON debe seguir exactamente este esquema:
{
  "summary": "resumen conciso del problema en 1-2 oraciones",
  "classification": "billing" | "technical" | "general" | "urgent",
  "suggestions": ["acción sugerida 1", "acción sugerida 2"],
  "riskLevel": "low" | "medium" | "high" | "critical"
}
Criterios de clasificación:
- billing: pagos, facturas, cobros, suscripciones, reembolsos
- technical: bugs, errores, integraciones, rendimiento, caídas del servicio
- urgent: pérdida de datos, sistema completamente caído, impacto masivo en usuarios
- general: consultas, dudas, solicitudes de información
Criterios de riskLevel:
- critical: sistema caído, pérdida de datos, impacto en múltiples usuarios
- high: funcionalidad core bloqueada para el usuario
- medium: funcionalidad degradada, existe workaround
- low: consulta informativa, impacto mínimo`

const AI_FALLBACK: AIAnalysisResult = {
  summary: 'No fue posible analizar el ticket automáticamente.',
  classification: 'general',
  suggestions: [
    'Revisar el ticket manualmente',
    'Contactar al usuario para obtener más información',
  ],
  riskLevel: 'medium',
}

interface AnalyzeTicketParams {
  title: string
  description: string
}

interface AnalyzeTicketResult {
  result: AIAnalysisResult
  isFallback: boolean
  promptTokens: number | null
  completionTokens: number | null
  latencyMs: number
  httpStatus: number
  errorMessage: string | null
  promptUser: string
}

export async function analyzeTicketWithAI(
  params: AnalyzeTicketParams
): Promise<AnalyzeTicketResult> {
  const promptUser = `Título del ticket: ${params.title}\n\nDescripción:\n${params.description}`
  const startTime = Date.now()

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: promptUser }],
      }),
    })

    const latencyMs = Date.now() - startTime
    const httpStatus = response.status

    if (!response.ok) {
      const errorBody = await response.text()
      return {
        result: AI_FALLBACK,
        isFallback: true,
        promptTokens: null,
        completionTokens: null,
        latencyMs,
        httpStatus,
        errorMessage: `HTTP ${httpStatus}: ${errorBody}`,
        promptUser,
      }
    }

    const data = await response.json()
    const rawText = data.content?.[0]?.text ?? ''

    const parsed = JSON.parse(rawText)
    const validated = AIResponseSchema.safeParse(parsed)

    if (!validated.success) {
      return {
        result: AI_FALLBACK,
        isFallback: true,
        promptTokens: data.usage?.input_tokens ?? null,
        completionTokens: data.usage?.output_tokens ?? null,
        latencyMs,
        httpStatus,
        errorMessage: `Schema inválido: ${validated.error.message}`,
        promptUser,
      }
    }

    return {
      result: validated.data,
      isFallback: false,
      promptTokens: data.usage?.input_tokens ?? null,
      completionTokens: data.usage?.output_tokens ?? null,
      latencyMs,
      httpStatus,
      errorMessage: null,
      promptUser,
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

    return {
      result: AI_FALLBACK,
      isFallback: true,
      promptTokens: null,
      completionTokens: null,
      latencyMs,
      httpStatus: 0,
      errorMessage,
      promptUser,
    }
  }
}