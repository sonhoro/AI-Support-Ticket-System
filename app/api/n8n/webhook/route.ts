import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { N8nInboundPayload } from '@/lib/types/n8n'

const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar secret compartido — previene llamadas externas no autorizadas
    const body = await request.json() as N8nInboundPayload

    if (!N8N_WEBHOOK_SECRET) {
      console.error('[n8n/webhook] N8N_WEBHOOK_SECRET no configurado')
      return NextResponse.json({ error: 'Configuración incorrecta.' }, { status: 500 })
    }

    if (body.secret !== N8N_WEBHOOK_SECRET) {
      console.warn('[n8n/webhook] Secret inválido — posible llamada no autorizada')
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    const { event, ticketId } = body

    if (!event || !ticketId) {
      return NextResponse.json(
        { error: 'Payload inválido: faltan event o ticketId.' },
        { status: 422 }
      )
    }

    const supabase = createAdminClient()

    // 2. Router por tipo de evento
    switch (event) {
      case 'notification.send': {
        if (!body.notification) {
          return NextResponse.json({ error: 'notification requerido para este evento.' }, { status: 422 })
        }

        const { userId, type, title, body: notifBody } = body.notification

        const { error } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            ticket_id: ticketId,
            type,
            title,
            body: notifBody,
            metadata: { source: 'n8n', event },
          })

        if (error) {
          console.error('[n8n/webhook] Error insertando notificación:', error)
          return NextResponse.json({ error: 'Error guardando notificación.' }, { status: 500 })
        }

        return NextResponse.json({ ok: true, event, ticketId }, { status: 200 })
      }

      case 'ticket.update': {
        if (!body.ticketUpdate) {
          return NextResponse.json({ error: 'ticketUpdate requerido para este evento.' }, { status: 422 })
        }

        const allowedFields: Record<string, unknown> = {}
        if (body.ticketUpdate.status) allowedFields.status = body.ticketUpdate.status
        if (body.ticketUpdate.assigned_to) allowedFields.assigned_to = body.ticketUpdate.assigned_to

        if (Object.keys(allowedFields).length === 0) {
          return NextResponse.json({ error: 'No hay campos válidos para actualizar.' }, { status: 422 })
        }

        const { error } = await supabase
          .from('tickets')
          .update(allowedFields)
          .eq('id', ticketId)

        if (error) {
          console.error('[n8n/webhook] Error actualizando ticket:', error)
          return NextResponse.json({ error: 'Error actualizando ticket.' }, { status: 500 })
        }

        return NextResponse.json({ ok: true, event, ticketId }, { status: 200 })
      }

      default:
        return NextResponse.json(
          { error: `Evento desconocido: ${event}` },
          { status: 422 }
        )
    }
  } catch (error) {
    console.error('[n8n/webhook] Error inesperado:', error)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

// n8n solo usa POST — rechazar otros métodos explícitamente
export async function GET() {
  return NextResponse.json({ error: 'Método no permitido.' }, { status: 405 })
}