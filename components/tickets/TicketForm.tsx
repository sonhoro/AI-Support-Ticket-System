'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { CreateTicketPayload, CreateTicketResponse, TicketPriority } from '@/lib/types/ticket'

interface Category {
  id: string
  name: string
  color: string
}

interface TicketFormProps {
  categories: Category[]
}

const PRIORITY_OPTIONS: { value: TicketPriority; label: string; color: string }[] = [
  { value: 'low',      label: 'Baja',     color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'medium',   label: 'Media',    color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'high',     label: 'Alta',     color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'critical', label: 'Crítica',  color: 'bg-red-50 text-red-700 border-red-200' },
]

const RISK_COLORS: Record<string, string> = {
  low:      'bg-emerald-50 border-emerald-200 text-emerald-800',
  medium:   'bg-amber-50 border-amber-200 text-amber-800',
  high:     'bg-orange-50 border-orange-200 text-orange-800',
  critical: 'bg-red-50 border-red-200 text-red-800',
}

const RISK_ICONS: Record<string, string> = {
  low: '●', medium: '◆', high: '▲', critical: '⬟',
}

export function TicketForm({ categories }: TicketFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState<CreateTicketPayload>({
    title: '',
    description: '',
    category_id: undefined,
    priority: 'medium',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CreateTicketPayload, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<CreateTicketResponse['analysis'] | null>(null)

  function validate(): boolean {
    const next: typeof errors = {}
    if (form.title.trim().length < 5)
      next.title = 'El título debe tener al menos 5 caracteres.'
    if (form.description.trim().length < 20)
      next.description = 'La descripción debe tener al menos 20 caracteres.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setServerError(null)
    setAnalysis(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })

        const data = await res.json()

        if (!res.ok) {
          setServerError(data.error ?? 'Error al crear el ticket.')
          return
        }

        const response = data as CreateTicketResponse
        setAnalysis(response.analysis)

        // Redirige al listado después de 2.5s para que el usuario vea el análisis
        setTimeout(() => {
          router.push('/dashboard/tickets')
          router.refresh()
        }, 2500)
      } catch {
        setServerError('Error de conexión. Verifica tu red e intenta nuevamente.')
      }
    })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Título */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Ej: No puedo acceder a mi factura del mes de mayo"
            maxLength={150}
            className={`w-full rounded-lg border px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400
              outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              ${errors.title ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'}`}
          />
          {errors.title && (
            <p className="text-xs text-red-600">{errors.title}</p>
          )}
          <p className="text-right text-xs text-slate-400">{form.title.length}/150</p>
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Descripción <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe el problema con el mayor detalle posible: pasos para reproducirlo, mensajes de error, cuándo comenzó..."
            rows={6}
            maxLength={5000}
            className={`w-full rounded-lg border px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400
              outline-none transition resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              ${errors.description ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'}`}
          />
          {errors.description && (
            <p className="text-xs text-red-600">{errors.description}</p>
          )}
          <p className="text-right text-xs text-slate-400">{form.description.length}/5000</p>
        </div>

        {/* Categoría + Prioridad */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Categoría</label>
            <select
              value={form.category_id ?? ''}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value || undefined }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm
                text-slate-900 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Sin categoría</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Prioridad</label>
            <div className="grid grid-cols-2 gap-1.5">
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, priority: opt.value }))}
                  className={`rounded-md border px-2 py-1.5 text-xs font-medium transition
                    ${form.priority === opt.value
                      ? opt.color + ' ring-2 ring-offset-1 ring-indigo-400'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error servidor */}
        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* Resultado análisis IA */}
        {analysis && (
          <div className={`rounded-lg border px-4 py-4 space-y-3 ${RISK_COLORS[analysis.riskLevel]}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Análisis IA
              </span>
              <span className="flex items-center gap-1 text-xs font-bold uppercase">
                {RISK_ICONS[analysis.riskLevel]} Riesgo {analysis.riskLevel}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{analysis.summary}</p>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Sugerencias</p>
              <ul className="space-y-1">
                {analysis.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="opacity-50">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            {analysis.isFallback && (
              <p className="text-xs opacity-60 italic">
                * Análisis generado con datos de respaldo. El ticket fue creado correctamente.
              </p>
            )}
            <p className="text-xs opacity-60">Redirigiendo a tus tickets...</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || !!analysis}
          className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white
            transition hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analizando con IA...
            </span>
          ) : analysis ? (
            '✓ Ticket creado'
          ) : (
            'Crear ticket'
          )}
        </button>
      </form>
    </div>
  )
}