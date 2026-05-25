# AI Support Ticket System

Sistema de tickets de soporte con Next.js, Supabase, análisis con Claude y webhooks n8n.

## Requisitos

- Node.js 18+
- Cuenta Supabase
- API key de Anthropic (opcional para análisis IA)
- n8n (opcional, escalado crítico)

## Configuración

1. Clona el repositorio e instala dependencias:

```bash
npm install
```

2. Copia las variables de entorno:

```bash
cp .env.example .env.local
```

3. Completa `.env.local` con tus credenciales.

4. Inicia el servidor de desarrollo:

```bash
npx next dev -p 3000
```

## Estructura principal

- `app/api/tickets` — API REST (crear y listar tickets)
- `app/api/n8n/webhook` — Webhook entrante desde n8n
- `app/dashboard/tickets` — UI de listado y formulario
- `lib/supabase` — Clientes Supabase (browser y server)
- `middleware.ts` — Autenticación y roles
