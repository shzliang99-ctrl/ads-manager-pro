import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // ឆែកមើល Session របស់ User
  const { data: { session } } = await supabase.auth.getSession();

  const url = request.nextUrl;

  // បើអតិថិជនអត់ទាន់ Login ហើយព្យាយាមចូល Website (Root /) ➔ ឱ្យបោះទៅកាន់ /login ជាមុនសិន
  if (!session && url.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // បើអតិថិជន Login រួចហើយ តែនៅតែព្យាយាមដើរចូល /login ទៀត ➔ ឱ្យរត់មក Dashboard (/) វិញ
  if (session && url.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/', '/login'],
};