'use client';

// ============================================
// DentalHire - Supabase Auth Provider
// ============================================

import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
    supabaseUser: SupabaseUser | null;
    isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType>({
    supabaseUser: null,
    isInitialized: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const { checkSession } = useAuthStore();

    useEffect(() => {
        const supabase = getSupabaseClient();

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSupabaseUser(session?.user ?? null);
            if (session?.user) {
                checkSession();
            } else {
                // If no session, ensure store is cleared
                useAuthStore.getState().logout();
            }
            setIsInitialized(true);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSupabaseUser(session?.user ?? null);

                if (event === 'SIGNED_IN') {
                    checkSession();
                } else if (event === 'SIGNED_OUT') {
                    // Auth store will handle cleanup
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [checkSession]);

    return (
        <AuthContext.Provider value={{ supabaseUser, isInitialized }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
