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

  if (
    pathname.startsWith('/invite') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/auth/callback')
  ) {
    return supabaseResponse
  }

  if (!user) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/client')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role

  if (!role) {
    // Fallback para cuentas antiguas sin role en profiles.
    const { data: clientRow } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const isClientUser = !!clientRow

    if (pathname === '/login') {
      return NextResponse.redirect(new URL(isClientUser ? '/client' : '/dashboard', request.url))
    }

    if (isClientUser && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/client', request.url))
    }

    if (!isClientUser && pathname.startsWith('/client')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return supabaseResponse
  }

  if (pathname === '/login') {
    if (role === 'client') {
      const { data: clientRow } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!clientRow) {
        return supabaseResponse
      }

      return NextResponse.redirect(new URL('/client', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (role === 'client' && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/client', request.url))
  }

  if (role === 'trainer' && pathname.startsWith('/client')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/client/:path*', '/login', '/onboarding/:path*', '/invite/:path*', '/auth/callback'],
}
