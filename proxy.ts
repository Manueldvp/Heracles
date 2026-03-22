import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Rutas públicas — nunca redirigir
  if (
    pathname.startsWith('/invite') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/register')
  ) {
    return supabaseResponse
  }

  // Sin sesión — redirigir al login
  if (!user) {
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/client')
    ) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // Con sesión — obtener perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  // Usuario sin rol — puede ser cliente recién registrado
  // Lo dejamos pasar para que el onboarding lo maneje
  if (!role) {
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // Con sesión en login → redirigir según rol
  if (pathname === '/login') {
    if (role === 'client') {
      return NextResponse.redirect(new URL('/client', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Cliente intentando acceder al dashboard del entrenador
  if (role === 'client' && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/client', request.url))
  }

  // Entrenador intentando acceder al dashboard del cliente
  if (role === 'trainer' && pathname.startsWith('/client')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/client/:path*', '/login', '/onboarding/:path*', '/invite/:path*'],
}