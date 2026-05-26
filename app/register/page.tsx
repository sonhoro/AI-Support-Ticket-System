'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    startTransition(async () => {
      const supabase = createClient()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })

      if (signUpError) {
        setError(
          signUpError.message.includes('already registered')
            ? 'Este email ya está registrado.'
            : signUpError.message
        )
        return
      }

      // Si la sesión ya está activa (email confirmation desactivado en Supabase)
      if (data.session) {
        router.push('/dashboard/tickets')
        router.refresh()
        return
      }

      // Si requiere confirmación de email
      setSuccess(true)
    })
  }

  if (success) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-8 py-10">
            <p className="text-3xl">✉️</p>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Revisa tu email</h2>
            <p className="mt-2 text-sm text-slate-600">
              Enviamos un enlace de confirmación a <strong>{email}</strong>.
              Confirma tu cuenta para continuar.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Volver al login →
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">AI Support</h1>
          <p className="mt-1 text-sm text-slate-500">Crea tu cuenta</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Juan García"
                required
                autoComplete="name"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5
                  text-sm text-slate-900 placeholder-slate-400 outline-none transition
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5
                  text-sm text-slate-900 placeholder-slate-400 outline-none transition
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                autoComplete="new-password"
                minLength={8}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5
                  text-sm text-slate-900 placeholder-slate-400 outline-none transition
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold
                text-white transition hover:bg-indigo-700 disabled:opacity-60
                disabled:cursor-not-allowed focus:outline-none focus:ring-2
                focus:ring-indigo-500 focus:ring-offset-2"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creando cuenta...
                </span>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}