import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { analyzeTicketWithAI } from '@/lib/services/ai-analysis'
import { CreateTicketSchema } from '@/lib/validations/ticket'

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticación — cliente con anon key para verificar sesión
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // 2. Validación del body con Zod
    const body = await request.json()
    const parsed = CreateTicketSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { title, description, category_id, priority } = parsed.data

    // 3. Admin client para bypassear RLS en inserts del sistema
    const adminSupabase = await createAdminClient()

    // 4. Crear el ticket
    const { data: ticket, error: ticketError } = await adminSupabase
      .from('tickets')
      .insert({
        title,
        description,
        category_id: category_id ?? null,
        priority,
        status: 'open',
        created_by: user.id,
      })
      .select('id, title, status, priority, created_at')
      .single()

    if (ticketError || !ticket) {
      console.error('[tickets/POST] Error creando ticket:', ticketError)
      return NextResponse.json(
        { error: 'Error al crear el ticket. Intenta nuevamente.' },
        { status: 500 }
      )
    }

    // 5. Análisis de IA (no bloquea la respuesta si falla — fallback garantizado)
    const aiResult = await analyzeTicketWithAI({ title, description })

    // 6. Persistir observabilidad en ai_analyses
    const { error: analysisError } = await adminSupabase
      .from('ai_analyses')
      .insert({
        ticket_id: ticket.id,
        model_name: 'claude-sonnet-4-20250514',
        model_version: '20250514',
        provider: 'anthropic',
        prompt_system: null,            // omitido por longitud; se puede activar en debug
        prompt_user: aiResult.promptUser,
        prompt_tokens: aiResult.promptTokens,
        completion_tokens: aiResult.completionTokens,
        result: aiResult.result,
        latency_ms: aiResult.latencyMs,
        http_status: aiResult.httpStatus,
        is_fallback: aiResult.isFallback,
        error_message: aiResult.errorMessage,
        triggered_by: user.id,
      })

    if (analysisError) {
      // Log pero no falla la request — el ticket ya fue creado
      console.error('[tickets/POST] Error guardando ai_analysis:', analysisError)
    }

    // 7. Si riskLevel es critical → notificación para n8n (webhook)
    if (aiResult.result.riskLevel === 'critical') {
      await triggerN8nEscalation({
        ticketId: ticket.id,
        userId: user.id,
        riskLevel: aiResult.result.riskLevel,
        classification: aiResult.result.classification,
        summary: aiResult.result.summary,
      }).catch(err => {
        console.error('[tickets/POST] Error disparando escalado n8n:', err)
      })
    }

    // 8. Respuesta exitosa
    return NextResponse.json(
      {
        ticket,
        analysis: {
          summary: aiResult.result.summary,
          classification: aiResult.result.classification,
          suggestions: aiResult.result.suggestions,
          riskLevel: aiResult.result.riskLevel,
          isFallback: aiResult.isFallback,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[tickets/POST] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const rawPage = parseInt(searchParams.get('page') ?? '1', 10)
    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage)
    const pageSize = 20
    const offset = (page - 1) * pageSize

    // RLS se aplica automáticamente según el rol del usuario
    let query = supabase
      .from('tickets')
      .select(`
        id, title, status, priority, created_at, updated_at,
        categories ( id, name, color ),
        profiles!tickets_assigned_to_fkey ( id, full_name, avatar_url ),
        ai_analyses ( risk_level, classification, summary, created_at )
      `, { count: 'exact' })
      .order('created_at', { ascending: false, foreignTable: 'ai_analyses' })
      .limit(1, { foreignTable: 'ai_analyses' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)

    const { data: tickets, error, count } = await query

    if (error) {
      console.error('[tickets/GET] Error:', error)
      return NextResponse.json({ error: 'Error al obtener tickets.' }, { status: 500 })
    }

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    })
  } catch (error) {
    console.error('[tickets/GET] Error inesperado:', error)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

// ─── Helper: dispara webhook n8n para escalado crítico ───────────────────────
async function triggerN8nEscalation(payload: {
  ticketId: string
  userId: string
  riskLevel: string
  classification: string
  summary: string
}) {
  const webhookUrl = process.env.N8N_ESCALATION_WEBHOOK_URL
  if (!webhookUrl) return

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'ticket.escalation.critical',
      timestamp: new Date().toISOString(),
      ...payload,
    }),
  })
}