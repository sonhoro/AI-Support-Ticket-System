'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { TicketListItem, TicketStatus, TicketPriority, AIRiskLevel } from '@/lib/types/ticket'

const STATUS_STYLES: Record<TicketStatus, string> = {
  open:        'bg-sky-50 text-sky-700 border-sky-200',
  in_progress: 'bg-violet-50 text-violet-700 border-violet-200',
  resolved:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed:      'bg-slate-100 text-slate-500 border-slate-200',
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  open:        'Abierto',
  in_progress: 'En progreso',
  resolved:    'Resuelto',
  closed:      'Cerrado',
}

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low:      'text-slate-500',
  medium:   'text-amber-600',
  high:     'text-orange-600',
  critical: 'text-red-600 font-bold',
}

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica',
}

const RISK_DOT: Record<AIRiskLevel, string> = {
  low:      'bg-emerald-400',
  medium:   'bg-amber-400',
  high:     'bg-orange-500',
  critical: 'bg-red-500 animate-pulse',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

export function TicketList() {
  const [tickets, setTickets] = useState<TicketListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })

  const [filters, setFilters] = useState<{
    status: string
    priority: string
    page: number
  }>({ status: '', priority: '', page: 1 })

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.priority) params.set('priority', filters.priority)
      params.set('page', String(filters.page))

      const res = await fetch(`/api/tickets?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al cargar los tickets.')
        return
      }

      setTickets(data.tickets ?? [])
      setPagination({
        page: data.pagination.page,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      })
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  function setFilter(key: keyof typeof filters, value: string | number) {
    setFilters(f => ({ ...f, [key]: value, page: key !== 'page' ? 1 : (value as number) }))
  }

  return (
    <div className="space-y-4">

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.status}
          onChange={e => setFilter('status', e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700
            outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los estados</option>
          <option value="open">Abierto</option>
          <option value="in_progress">En progreso</option>
          <option value="resolved">Resuelto</option>
          <option value="closed">Cerrado</option>
        </select>

        <select
          value={filters.priority}
          onChange={e => setFilter('priority', e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700
            outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todas las prioridades</option>
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
          <option value="critical">Crítica</option>
        </select>

        <span className="ml-auto text-sm text-slate-500">
          {pagination.total} ticket{pagination.total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Estados */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-sm text-slate-500">No hay tickets con los filtros seleccionados.</p>
          <Link
            href="/dashboard/tickets/new"
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Crear el primero →
          </Link>
        </div>
      )}

      {/* Lista */}
      {!loading && tickets.length > 0 && (
        <div className="space-y-2">
          {tickets.map(ticket => {
            const latestAnalysis = ticket.ai_analyses?.[0] ?? null
            return (
              <Link
                key={ticket.id}
                href={`/dashboard/tickets/${ticket.id}`}
                className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white
                  px-5 py-4 transition hover:border-indigo-300 hover:shadow-sm"
              >
                {/* Risk dot */}
                <div className="mt-1.5 flex-shrink-0">
                  {latestAnalysis ? (
                    <span
                      className={`block h-2.5 w-2.5 rounded-full ${RISK_DOT[latestAnalysis.risk_level]}`}
                      title={`Riesgo IA: ${latestAnalysis.risk_level}`}
                    />
                  ) : (
                    <span className="block h-2.5 w-2.5 rounded-full bg-slate-200" />
                  )}
                </div>

                {/* Contenido principal */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-900 group-hover:text-indigo-700">
                      {ticket.title}
                    </p>
                    <span className={`flex-shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium
                      ${STATUS_STYLES[ticket.status]}`}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {ticket.categories && (
                      <span className="flex items-center gap-1">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: ticket.categories.color }}
                        />
                        {ticket.categories.name}
                      </span>
                    )}
                    <span className={PRIORITY_STYLES[ticket.priority]}>
                      {PRIORITY_LABELS[ticket.priority]}
                    </span>
                    {ticket.profiles && (
                      <span>Asignado a {ticket.profiles.full_name}</span>
                    )}
                    {latestAnalysis && (
                      <span className="italic text-slate-400">
                        IA: {latestAnalysis.classification}
                      </span>
                    )}
                    <span className="ml-auto">{formatDate(ticket.created_at)}</span>
                  </div>

                  {latestAnalysis?.summary && (
                    <p className="mt-1.5 truncate text-xs text-slate-400 italic">
                      {latestAnalysis.summary}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => setFilter('page', pagination.page - 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600
              hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <span className="text-sm text-slate-500">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setFilter('page', pagination.page + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600
              hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}