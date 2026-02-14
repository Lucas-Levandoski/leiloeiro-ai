import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect /portal routes
  if (request.nextUrl.pathname.startsWith('/portal') && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirect signed-in users away from auth pages
  if (request.nextUrl.pathname.startsWith('/auth') && user) {
     // If user is already logged in, redirect to portal
     if (request.nextUrl.pathname !== '/auth/signout') { // Allow signout
         return NextResponse.redirect(new URL('/portal', request.url))
     }
  }
  
  // If user is at root, redirect to portal if logged in, or stay (landing page?)
  // For now, let's keep root accessible.

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
