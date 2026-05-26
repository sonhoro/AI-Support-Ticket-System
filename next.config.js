/** @type {import('next').NextConfig} */
const nextConfig = {
    // ── Security Headers ───────────────────────────────────────
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            // Previene clickjacking
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            // Previene MIME-type sniffing
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            // Fuerza HTTPS por 1 año, incluye subdomains
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains',
            },
            // Controla info del Referer
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            // Deshabilita permisos de APIs del browser no necesarias
            {
              key: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=()',
            },
            // Content Security Policy
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                // Supabase realtime + storage
                `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com`,
                "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval requerido por Next.js dev
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https://*.supabase.co",
                "font-src 'self'",
                "frame-ancestors 'none'",
              ].join('; '),
            },
          ],
        },
        // Headers específicos para API routes — sin cache
        {
          source: '/api/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, no-cache, must-revalidate',
            },
          ],
        },
      ]
    },
  
    // ── Redirects ─────────────────────────────────────────────
    async redirects() {
      return [
        {
          source: '/dashboard',
          destination: '/dashboard/tickets',
          permanent: false,
        },
      ]
    },
  
    // ── Imágenes ──────────────────────────────────────────────
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '*.supabase.co',
          pathname: '/storage/v1/object/public/**',
        },
      ],
    },
  
    // ── Build ─────────────────────────────────────────────────
    // Falla el build si hay errores de TypeScript o ESLint
    typescript: {
      ignoreBuildErrors: false,
    },
    eslint: {
      ignoreDuringBuilds: false,
    },
  
    // Reduce el tamaño del bundle eliminando propTypes en producción
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
    },
  }
  
  module.exports = nextConfig