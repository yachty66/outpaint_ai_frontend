import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const authToken = requestUrl.searchParams.get('auth_token');
  
  if (authToken) {
    const response = NextResponse.redirect(`${requestUrl.origin}?payment_success=true`);
    
    // Set the auth cookie
    response.cookies.set('sb-auth-token', authToken, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    console.log("Auth token set:", authToken);
    console.log("Response:", response);
    
    return response;
  }
  
  return NextResponse.redirect(requestUrl.origin);
}