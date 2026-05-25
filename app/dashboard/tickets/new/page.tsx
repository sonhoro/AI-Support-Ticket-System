import { createClient } from '@/lib/supabase/server'
import { TicketForm } from '@/components/tickets/TicketForm'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Nuevo ticket | AI Support',
}

export default async function NewTicketPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, color')
    .eq('is_active', true)
    .order('name')

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <a
            href="/dashboard/tickets"
            className="text-sm text-slate-500 hover:text-slate-700 transition"
          >
            ← Volver a tickets
          </a>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Nuevo ticket</h1>
          <p className="mt-1 text-sm text-slate-500">
            La IA analizará tu ticket automáticamente al enviarlo.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-8 shadow-sm">
          <TicketForm categories={categories ?? []} />
        </div>
      </div>
    </main>
  )
}