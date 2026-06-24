import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@pumni/supabase/server';

import { connection } from 'next/server';

export async function GET(request: NextRequest) {
  await connection();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  let next = requestUrl.searchParams.get('next') ?? '/dashboard';

  // Prevent open redirect vulnerabilities by ensuring next is a relative path starting with / and not //
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/dashboard';
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
