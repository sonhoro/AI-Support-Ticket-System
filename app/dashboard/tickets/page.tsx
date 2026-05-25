import { createClient } from '@/lib/supabase/server'
import { TicketList } from '@/components/tickets/TicketList'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Mis tickets | AI Support',
}

export default async function TicketsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tickets</h1>
            <p className="mt-1 text-sm text-slate-500">
              Gestiona y sigue el estado de tus solicitudes de soporte.
            </p>
          </div>
          <Link
            href="/dashboard/tickets/new"
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white
              transition hover:bg-indigo-700 focus:outline-none focus:ring-2
              focus:ring-indigo-500 focus:ring-offset-2"
          >
            + Nuevo ticket
          </Link>
        </div>

        {/* Leyenda de riesgo IA */}
        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200
          bg-white px-4 py-3 text-xs text-slate-500">
          <span className="font-medium text-slate-700">Nivel de riesgo IA:</span>
          {[
            { level: 'low',      label: 'Bajo',     dot: 'bg-emerald-400' },
            { level: 'medium',   label: 'Medio',    dot: 'bg-amber-400' },
            { level: 'high',     label: 'Alto',     dot: 'bg-orange-500' },
            { level: 'critical', label: 'Crítico',  dot: 'bg-red-500' },
          ].map(({ level, label, dot }) => (
            <span key={level} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${dot}`} />
              {label}
            </span>
          ))}
        </div>

        {/* Lista (Client Component con fetch propio) */}
        <TicketList />
      </div>
    </main>
  )
}