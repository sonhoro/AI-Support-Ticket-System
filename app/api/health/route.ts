import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down'
  timestamp: string
  version: string
  checks: {
    database: 'ok' | 'error'
    ai_api_configured: boolean
    n8n_configured: boolean
  }
  latency_ms: {
    database: number | null
  }
}

export async function GET() {
  const start = Date.now()
  const health: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    checks: {
      database: 'ok',
      ai_api_configured: !!process.env.ANTHROPIC_API_KEY,
      n8n_configured: !!process.env.N8N_ESCALATION_WEBHOOK_URL,
    },
    latency_ms: {
      database: null,
    },
  }

  // Verificar conexión a Supabase
  try {
    const supabase = createAdminClient()
    const dbStart = Date.now()

    const { error } = await supabase
      .from('categories')
      .select('id')
      .limit(1)
      .single()

    health.latency_ms.database = Date.now() - dbStart

    // PGRST116 = no rows found — la tabla existe, está bien
    if (error && error.code !== 'PGRST116') {
      health.checks.database = 'error'
      health.status = 'degraded'
    }
  } catch {
    health.checks.database = 'error'
    health.status = 'down'
  }

  const httpStatus = health.status === 'down' ? 503
    : health.status === 'degraded' ? 207
    : 200

  return NextResponse.json(health, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store',
      'X-Response-Time': `${Date.now() - start}ms`,
    },
  })
}