import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function middleware(request: NextRequest) {
  // ឆែកមើល Session តាម Supabase client ធម្មតា
  const { data: { session } } = await supabase.auth.getSession();
  const url = request.nextUrl;

  // បើអត់ទាន់ Login ព្យាយាមចូល Root (/) ➔ ឱ្យបោះទៅ /login
  if (!session && url.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // បើ Login ហើយ តែនៅតែចូល /login ➔ ឱ្យរត់មក / វិញ
  if (session && url.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login'],
};