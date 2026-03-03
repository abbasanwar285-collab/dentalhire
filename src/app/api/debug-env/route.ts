
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'DEFINED' : 'MISSING',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'DEFINED' : 'MISSING',
        nodeEnv: process.env.NODE_ENV,
        urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL, // Temporarily viewing this to confirm project ID
    });
}
