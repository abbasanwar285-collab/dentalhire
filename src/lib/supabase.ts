// ============================================
// DentalHire - Supabase Client Configuration
// ============================================

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

export function createClient() {
    return createBrowserClient<Database>(
        'https://hbzuewfbqnjddoxukxyp.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhienVld2ZicW5qZGRveHVreHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzgyMTgsImV4cCI6MjA0ODA3NTQyMTh9.X38YSYo8UiiSbf9lAfmSc_4zIVp4GMHrynnFy5sdqZA'
    );
}

// Singleton for client-side use
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
    if (!client) {
        client = createClient();
    }
    return client;
}
