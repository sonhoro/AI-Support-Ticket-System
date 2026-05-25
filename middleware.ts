import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/register', '/auth/callback']

const ROLE_PROTECTED_ROUTES: Record<string, string[]> = {
  '/admin': ['admin'],
  '/dashboard/agent': ['agent', 'admin'],
  '/dashboard': ['user', 'agent', 'admin'],
}

function getRequiredRoles(pathname: string): string[] | null {
  const match = Object.keys(ROLE_PROTECTED_ROUTES)
    .sort((a, b) => b.length - a.length)
    .find(route => pathname.startsWith(route))
  return match ? ROLE_PROTECTED_ROUTES[match] : null
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: nunca ejecutar lógica entre createServerClient y getUser()
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route)

  // 1. Sin sesión → redirige a login
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Con sesión en login/register → redirige a dashboard
  if (user && (pathname === '/login' || pathname === '/register')) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // 3. Verificación de rol para rutas protegidas
  if (user) {
    const requiredRoles = getRequiredRoles(pathname)

    if (requiredRoles) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('[middleware] Profile not found for user:', user.id)
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        return NextResponse.redirect(loginUrl)
      }

      const userRole = profile.role

      if (!requiredRoles.includes(userRole)) {
        // Rol insuficiente → redirige a /unauthorized
        const unauthorizedUrl = request.nextUrl.clone()
        unauthorizedUrl.pathname = '/unauthorized'
        return NextResponse.redirect(unauthorizedUrl)
      }

      // Propaga el rol en headers para que Server Components lo lean sin otra query a BD
      supabaseResponse.headers.set('x-user-role', userRole)
      supabaseResponse.headers.set('x-user-id', user.id)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}