import Link from 'next/link'

export const metadata = {
  title: 'Acceso denegado | AI Support',
}

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Acceso denegado</h1>
          <p className="mt-2 text-sm text-slate-500">
            No tienes permisos para acceder a esta sección.
            Contacta a un administrador si crees que esto es un error.
          </p>
          <Link
            href="/dashboard/tickets"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm
              font-semibold text-white transition hover:bg-indigo-700"
          >
            Volver a mis tickets
          </Link>
        </div>
      </div>
    </main>
  )
}