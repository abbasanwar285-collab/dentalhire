import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'
    const type = searchParams.get('type')

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const isLocal = process.env.NODE_ENV === 'development'

            // Force production URL in production environment
            const baseUrl = isLocal ? origin : 'https://dentalhire.vercel.app';

            // Force password recovery flow
            if (type === 'recovery') {
                return NextResponse.redirect(`${baseUrl}/update-password`)
            }

            return NextResponse.redirect(`${baseUrl}${next}`)
        } else {
            console.error('Auth callback error:', error)
            return NextResponse.redirect(`${origin}/login?error=exchange_failed&details=${encodeURIComponent(error.message)}`)
        }
    }

    // If no code but we have error params from Supabase (e.g. otp_expired)
    const errorParam = searchParams.get('error')
    const errorDesc = searchParams.get('error_description')

    if (errorParam) {
        return NextResponse.redirect(`${origin}/login?error=${errorParam}&details=${encodeURIComponent(errorDesc ?? '')}`)
    }

    // Auth Code Error Redirect (Generic)
    return NextResponse.redirect(`${origin}/login?error=no_code_provided`)
}
