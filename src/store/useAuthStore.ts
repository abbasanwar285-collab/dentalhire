'use client';

// ============================================
// DentalHire - Auth Store with Supabase
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, UserType } from '@/types';
import { getSupabaseClient } from '@/lib/supabase';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<boolean>;
    loginWithOAuth: (provider: 'google' | 'linkedin') => Promise<boolean>;
    register: (data: RegisterData) => Promise<boolean>;
    logout: () => Promise<void>;
    updateProfile: (updates: Partial<User['profile']>) => Promise<void>;
    checkSession: () => Promise<void>;
    clearError: () => void;
}

interface RegisterData {
    email: string;
    password: string;
    role: UserRole;
    userType: UserType;
    firstName: string;
    lastName: string;
    phone: string;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                console.log('[Auth] Login attempt starting for:', email);
                console.log('[Auth] Environment Check:', {
                    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                    key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                });

                set({ isLoading: true, error: null });

                try {
                    const supabase = getSupabaseClient();
                    console.log('[Auth] Supabase client obtained');

                    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                    console.log('[Auth] SignIn result:', {
                        user: authData?.user?.id,
                        error: authError?.message
                    });

                    if (authError) {
                        console.warn('[Auth] Login failed:', authError.message); // Use warn to avoid error overlay
                        let errorMessage = 'auth.login_failed';
                        if (authError.message.includes('Invalid login credentials')) {
                            errorMessage = 'auth.invalid_credentials';
                        } else if (authError.message.includes('Email not confirmed')) {
                            errorMessage = 'auth.email_not_confirmed';
                        }
                        set({ error: errorMessage, isLoading: false });
                        return false;
                    }

                    if (authData.user) {
                        // Fetch user profile from users table
                        const { data: userData, error: userError } = await supabase
                            .from('users')
                            .select('*')
                            .eq('auth_id', authData.user.id)
                            .single() as { data: any; error: any };

                        if (userError && userError.code !== 'PGRST116') {
                            // PGRST116 = no rows returned, which means new user
                            console.error('Error fetching user:', userError);
                        }

                        const user: User = userData ? {
                            id: userData.id,
                            email: userData.email,
                            role: userData.role as UserRole,
                            userType: userData.user_type as UserType,
                            profile: {
                                firstName: userData.first_name,
                                lastName: userData.last_name,
                                phone: userData.phone,
                                avatar: userData.avatar,
                                city: userData.city,
                                verified: userData.verified,
                            },
                            createdAt: new Date(userData.created_at),
                            updatedAt: new Date(userData.updated_at),
                        } : {
                            id: authData.user.id,
                            email: authData.user.email!,
                            role: 'job_seeker',
                            userType: 'dental_assistant',
                            profile: {
                                firstName: '',
                                lastName: '',
                                verified: false,
                            },
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };

                        set({
                            user,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null,
                        });

                        return true;
                    }

                    set({ isLoading: false });
                    return false;
                } catch (error) {
                    set({
                        error: 'auth.login_error',
                        isLoading: false,
                    });
                    return false;
                }
            },

            loginWithOAuth: async (provider: 'google' | 'linkedin') => {
                set({ isLoading: true, error: null });
                try {
                    const supabase = getSupabaseClient();
                    const { error } = await supabase.auth.signInWithOAuth({
                        provider,
                        options: {
                            redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
                        },
                    });

                    if (error) {
                        set({ error: 'auth.oauth_failed', isLoading: false });
                        return false;
                    }

                    return true;
                } catch (error) {
                    set({ error: 'auth.oauth_failed', isLoading: false });
                    return false;
                }
            },

            register: async (data) => {
                set({ isLoading: true, error: null });

                try {
                    const supabase = getSupabaseClient();

                    // Create auth user
                    const { data: authData, error: authError } = await supabase.auth.signUp({
                        email: data.email,
                        password: data.password,
                        options: {
                            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
                            data: {
                                first_name: data.firstName,
                                last_name: data.lastName,
                                role: data.role,
                                user_type: data.userType,
                                phone: data.phone,
                            },
                        },
                    });

                    if (authError) {
                        // Handle rate limiting error
                        let errorMessage = authError.message; // Show raw error for debugging
                        /*
                        let errorMessage = 'auth.registration_failed';
                        if (authError.message.includes('security purposes')) {
                            errorMessage = 'auth.rate_limit';
                        } else if (authError.message.includes('already registered')) {
                            errorMessage = 'auth.email_exists';
                        }
                        */
                        set({ error: errorMessage, isLoading: false });
                        return false;
                    }

                    if (authData.user) {
                        // Wait briefly for trigger to complete (100ms)
                        await new Promise(resolve => setTimeout(resolve, 100));

                        // 1. Fetch the placeholder profile created by the trigger
                        const { data: profileData, error: profileError } = await supabase
                            .from('users')
                            .select('*')
                            .eq('auth_id', authData.user.id)
                            .single();

                        if (profileError || !profileData) {
                            console.error('Failed to fetch created profile:', profileError);
                            set({ error: 'auth.registration_failed_profile', isLoading: false });
                            return false;
                        }

                        // 2. IMMEDIATE UPDATE: Fill in the missing details
                        const { error: updateError } = await (supabase
                            .from('users') as any) // Type assertion if needed
                            .update({
                                first_name: data.firstName,
                                last_name: data.lastName,
                                role: data.role,
                                user_type: data.userType,
                                phone: data.phone,
                                verified: false // Explicitly set verified false
                            })
                            .eq('id', profileData.id);

                        if (updateError) {
                            console.error('Failed to update profile details:', updateError);
                            // We continue, but warn. The user exists but has empty name.
                        }

                        const user: User = {
                            id: authData.user.id,
                            email: data.email,
                            role: data.role,
                            userType: data.userType,
                            profile: {
                                firstName: data.firstName,
                                lastName: data.lastName,
                                phone: data.phone,
                                verified: false,
                                avatar: undefined,
                                city: undefined
                            },
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };

                        set({
                            user,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null,
                        });

                        return true;
                    }

                    set({ isLoading: false });
                    return false;
                } catch (error) {
                    set({
                        error: 'auth.registration_error',
                        isLoading: false,
                    });
                    return false;
                }
            },

            logout: async () => {
                set({ isLoading: true });

                try {
                    const supabase = getSupabaseClient();
                    await supabase.auth.signOut();
                    // Clear onboarding flag to allow role selection again on next visit/login attempt
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('has_onboarded');
                        localStorage.removeItem('user_role');
                        localStorage.removeItem('user_sub_role');
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                }

                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null,
                });
            },

            updateProfile: async (updates) => {
                const { user } = get();
                if (!user) return;

                set({ isLoading: true });

                try {
                    const supabase = getSupabaseClient();

                    const result = await (supabase
                        .from('users') as any)
                        .update({
                            first_name: updates.firstName,
                            last_name: updates.lastName,
                            phone: updates.phone,
                            avatar: updates.avatar,
                            city: updates.city,
                        })
                        .eq('id', user.id);

                    const { error } = result;

                    if (error) {
                        set({ error: error.message, isLoading: false });
                        return;
                    }

                    set({
                        user: {
                            ...user,
                            profile: { ...user.profile, ...updates },
                            updatedAt: new Date(),
                        },
                        isLoading: false,
                    });
                } catch (error) {
                    set({
                        error: 'An error occurred updating profile',
                        isLoading: false,
                    });
                }
            },

            checkSession: async () => {
                set({ isLoading: true });

                try {
                    const supabase = getSupabaseClient();
                    const { data: { session } } = await supabase.auth.getSession();

                    if (session?.user) {
                        const { data: userData, error } = await supabase
                            .from('users')
                            .select('*')
                            .eq('auth_id', session.user.id)
                            .single() as { data: any; error: any };

                        if (userData) {
                            const user: User = {
                                id: userData.id,
                                email: userData.email,
                                role: userData.role as UserRole,
                                userType: userData.user_type as UserType,
                                profile: {
                                    firstName: userData.first_name,
                                    lastName: userData.last_name,
                                    phone: userData.phone,
                                    avatar: userData.avatar,
                                    city: userData.city,
                                    verified: userData.verified,
                                },
                                createdAt: new Date(userData.created_at),
                                updatedAt: new Date(userData.updated_at),
                            };

                            set({
                                user,
                                isAuthenticated: true,
                                isLoading: false,
                            });
                            return;
                        }
                    }

                    set({ isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'dentalhire-auth',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
