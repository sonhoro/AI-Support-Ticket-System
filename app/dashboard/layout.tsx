import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'AI Support Ticket System',
  description: 'Sistema de tickets de soporte con análisis de IA',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}