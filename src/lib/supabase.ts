// ============================================
// DentalHire - Supabase Client Configuration
// ============================================

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hbzuewfbqnjddoxukxyp.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhienVld2ZicW5qZGRveHVreHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzgyMTgsImV4cCI6MjA4MDc1NDIxOH0.X38YSYo8UiiSbf9lAfmSc_4zIVp4GMHrynnFy5sdqZA';

    return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}

// Singleton for client-side use
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
    if (!client) {
        client = createClient();
    }
    return client;
}
