import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const paymentSuccess = requestUrl.searchParams.get('payment_success')
  const uploadedImage = requestUrl.searchParams.get('uploadedImage')
  const processedImage = requestUrl.searchParams.get('processedImage')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Construct redirect URL with all parameters
  const searchParams = new URLSearchParams()
  if (paymentSuccess) searchParams.set('payment_success', paymentSuccess)
  if (uploadedImage) searchParams.set('uploadedImage', uploadedImage)
  if (processedImage) searchParams.set('processedImage', processedImage)

  return NextResponse.redirect(`${requestUrl.origin}/?${searchParams.toString()}`)
}