import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Jika belum login dan mencoba masuk ke dashboard/portal, arahkan ke login
  if (!user && (path.startsWith('/dashboard') || path.startsWith('/portal'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika sudah login, cek role pengguna dari tabel profiles
  if (user && (path.startsWith('/dashboard') || path.startsWith('/portal'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'Staff';

    // Jika mencoba akses /dashboard tapi rolenya BUKAN Admin GA / Manager, lempar ke /portal
    if (path.startsWith('/dashboard') && role === 'Staff') {
      return NextResponse.redirect(new URL('/portal', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*'],
};