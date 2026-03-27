import { supabase } from './db';
import { UserRole, UserProfile } from '../types';
import { logger } from './logger';

export const authService = {
    // Helper to format phone as email
    formatEmail: (phone: string) => {
        const cleanPhone = phone.trim();
        if (cleanPhone.includes('@')) {
            return cleanPhone;
        } // Already an email
        return `${cleanPhone}@clinic.com`;
    },

    // Check if user is in allowed_users table
    checkAllowedUser: async (phone: string) => {
        if (!supabase) {
            return null;
        }
        const email = authService.formatEmail(phone);

        const { data, error } = await supabase
            .from('allowed_users')
            .select('role, name')
            .eq('email', email)
            .single();

        if (error || !data) {
            return null;
        }
        return data; // Returns { role, name }
    },

    // Sign Up
    signUp: async (phone: string, password: string, fullName: string, role: UserRole) => {
        if (!supabase) {
            throw new Error('Supabase not configured');
        }

        const email = authService.formatEmail(phone);

        // 1. Sign up the user
        // We pass role in metadata so the trigger can use it initially (optional, but handled by trigger logic)
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role // Note: Trigger might default to 'doctor', we might need to update this manually if trigger ignores it
                }
            }
        });

        if (error) {
            throw error;
        }
        if (!data.user) {
            throw new Error('User creation failed');
        }

        // 2. Ensure profile has correct role (in case trigger defaults to doctor)
        // We manually update to be sure if the user selected something else
        if (role !== 'doctor') {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ role: role })
                .eq('id', data.user.id);

            if (profileError) {
                logger.error('Failed to set user role:', profileError);
            }
        }

        return data;
    },

    // Sign In
    signIn: async (phone: string, password: string) => {
        if (!supabase) {
            throw new Error('Supabase not configured');
        }

        const email = authService.formatEmail(phone);

        const tryLogin = async (attempt: number): Promise<any> => {
            try {
                // Create a timeout promise to fix infinite hang
                const timeoutPromise = new Promise((_, reject) => {
                    // Increase timeout to 45s to allow slow cold starts
                    setTimeout(() => reject(new Error('TIMEOUT')), 45000 + (attempt * 10000));
                });

                const result = await Promise.race([
                    supabase.auth.signInWithPassword({
                        email,
                        password
                    }),
                    timeoutPromise
                ]) as { data: any; error: any };

                const { data, error } = result;

                if (error) {
                    // If it's a network error or 5xx, we might want to retry
                    // For wrong password (400), don't retry
                    if (error.status && error.status >= 500) {
                        throw error; // Throw to trigger retry
                    }
                    if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
                        throw error;
                    }
                    // For other errors (wrong password), return immediately
                    return { data, error };
                }

                // Success
                return { data, error: null };

            } catch (err: any) {
                if (attempt < 3 && (err.message === 'TIMEOUT' || err.message === 'Failed to fetch' || err.status >= 500)) {
                    logger.log(`[Auth] Login attempt ${attempt} failed, retrying...`);
                    await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
                    return tryLogin(attempt + 1);
                }
                throw err;
            }
        };

        try {
            logger.log('[Auth] Attempting login...');
            const { data, error } = await tryLogin(1);

            if (error) {
                logger.error('[Auth] Login error details:', error);
                throw error;
            }

            // AUTO-FIX: Sync Role from allowed_users
            // This ensures allowed_users is the SINGLE SOURCE OF TRUTH
            const user = data.user;
            if (user && user.email) {
                // 1. Check what role they SHOULD have based on allowed_users
                const { data: allowedUser } = await supabase
                    .from('allowed_users')
                    .select('role, name')
                    .eq('email', user.email) // Email is the key
                    .single();

                if (allowedUser) {
                    logger.log(`[Auth] Syncing role for ${user.email}: Expected ${allowedUser.role}`);

                    // 2. Check what role they CURRENTLY have in profiles
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();

                    // 3. Update if mismatch
                    if (!profile || profile.role !== allowedUser.role) {
                        logger.warn(`[Auth] Role mismatch! Updating profile to match allowed_users.`);
                        await supabase.from('profiles').upsert({
                            id: user.id,
                            email: user.email,
                            role: allowedUser.role,
                            full_name: allowedUser.name || user.user_metadata.full_name || 'Staff Member'
                        });
                    }
                } else {
                    logger.warn(`[Auth] User ${user.email} not found in allowed_users! They might have limited access.`);
                }
            }

            return data;
        } catch (error: any) {
            if (error.message === 'TIMEOUT') {
                throw new Error('انتهت مهلة الاتصال. يرجى التحقق من الإنترنت والمحاولة مجدداً');
            }
            throw error;
        }
    },

    // Sign Out
    signOut: async () => {
        if (!supabase) {
            return;
        }

        // Create a timeout promise - if server doesn't respond in 10s, just clear local state
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                logger.warn('[Auth] SignOut timed out (10s), forcing local cleanup');
                resolve('TIMEOUT');
            }, 10000);
        });

        try {
            // Attempt server-side sign out, but don't wait forever
            await Promise.race([
                supabase.auth.signOut(),
                timeoutPromise
            ]);
        } catch (e) {
            logger.error('[Auth] Error during sign out:', e);
        }
        // Note: Session cleanup is handled by Supabase client with our storageAdapter
        // Profile cache is cleared by AuthContext on SIGNED_OUT event
    },

    // Get Current User Profile
    getUserProfile: async (userId: string): Promise<UserProfile | null> => {
        if (!supabase) {
            return null;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            logger.error('Error fetching profile:', error);
            return null;
        }
        return data as UserProfile;
    }
};
