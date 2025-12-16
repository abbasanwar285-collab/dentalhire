import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'
    const type = searchParams.get('type')

    if (code) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            request.cookies.set(name, value)
                        )
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocal = process.env.NODE_ENV === 'development'

            // Determine the base URL: prefer env var, then forwarded host, then hardcoded production
            let baseUrl = isLocal ? origin : 'https://dentalhire.vercel.app';

            if (!isLocal && process.env.NEXT_PUBLIC_SITE_URL) {
                baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
            }

            // Force password recovery flow
            if (type === 'recovery') {
                return NextResponse.redirect(`${baseUrl}/update-password`)
            }

            return NextResponse.redirect(`${baseUrl}${next}`)
        }
    }

    // Auth Code Error Redirect
    return NextResponse.redirect(`${origin}/login?error=auth_code_error`)
}
