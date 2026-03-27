import React, { createContext, useContext, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { User, Session } from '@supabase/supabase-js';
import { mapPatientFromDB, mapAppointmentFromDB, mapExpenseFromDB } from '../services/db';
import { authService } from '../services/auth';
import { UserProfile } from '../types';
import { storage } from '../services/storage';
import { Preferences } from '@capacitor/preferences';
import patientsData from '@/src/data/patients.json';
import appointmentsData from '@/src/data/appointments.json';
import expensesData from '@/src/data/expenses.json';
import inventoryData from '@/src/data/inventory_items.json';
import patientScansData from '@/src/data/patient_scans.json';
/* eslint-disable no-console */

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    isDoctor: boolean;
    isAssistant: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    isAdmin: false,
    isDoctor: false,
    isAssistant: false,
    refreshProfile: async () => { },
});

const PROFILE_CACHE_KEY = 'clinic_user_profile';

// Helper functions for profile cache using Capacitor Preferences
const getProfileFromCache = async (): Promise<UserProfile | null> => {
    try {
        const { value } = await Preferences.get({ key: PROFILE_CACHE_KEY });
        return value ? JSON.parse(value) : null;
    } catch (e) {
        console.warn('[Auth] Failed to get profile from cache:', e);
        return null;
    }
};

const saveProfileToCache = async (profile: UserProfile): Promise<void> => {
    try {
        await Preferences.set({ key: PROFILE_CACHE_KEY, value: JSON.stringify(profile) });
    } catch (e) {
        console.warn('[Auth] Failed to save profile to cache:', e);
    }
};

const _clearProfileCache = async (): Promise<void> => {
    try {
        await Preferences.remove({ key: PROFILE_CACHE_KEY });
    } catch (e) {
        console.warn('[Auth] Failed to clear profile cache:', e);
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Helper to fetch profile
    const fetchProfile = async (userId: string, userMetadata?: Record<string, any>) => {
        // CRITICAL: Get cached profile BEFORE making network call
        // This is our "source of truth" if network fails
        const cachedProfile = await getProfileFromCache();

        try {
            // Add 5-second timeout to prevent blocking on slow network
            const timeoutPromise = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('PROFILE_TIMEOUT')), 5000)
            );

            const p = await Promise.race([
                authService.getUserProfile(userId),
                timeoutPromise
            ]) as UserProfile | null;

            if (p) {
                setProfile(p);
                await saveProfileToCache(p);
            }
        } catch (error) {
            console.error('Error fetching profile in context:', error);
            // CRITICAL FIX: Prioritize cached profile over fallback
            // This prevents Manager role from switching to Assistant on network errors
            if (cachedProfile) {
                console.log('[Auth] Keeping cached profile (network error):', cachedProfile.role);
                setProfile(cachedProfile);
                return; // Don't overwrite with fallback!
            }
            // Only if NO cache exists, then use metadata as last resort
            if (userMetadata) {
                const fallbackProfile: UserProfile = {
                    id: userId,
                    email: userMetadata.email || '',
                    full_name: userMetadata.full_name || 'مستخدم',
                    role: userMetadata.role || 'assistant',
                };
                console.warn('[Auth] Using user_metadata as fallback profile:', fallbackProfile.role);
                setProfile(fallbackProfile);
                await saveProfileToCache(fallbackProfile);
            }
        }
    };


    useEffect(() => {
        // MOCK AUTH BYPASS
        const mockInit = async () => {
            console.log('[Auth] Mocking Admin Session (Bypass Login)');

            // 1. Create Mock User
            const mockUser: User = {
                id: 'mock-admin-id',
                app_metadata: { provider: 'email' },
                user_metadata: { full_name: 'مدير النظام' },
                aud: 'authenticated',
                created_at: new Date().toISOString(),
                email: 'admin@clinic.com',
                phone: '',
                confirmed_at: new Date().toISOString(),
                last_sign_in_at: new Date().toISOString(),
                role: 'authenticated',
                updated_at: new Date().toISOString()
            } as User;

            // 2. Create Mock Session (Partial)
            const mockSession: Session = {
                access_token: 'mock-token',
                refresh_token: 'mock-refresh-token',
                expires_in: 3600,
                token_type: 'bearer',
                user: mockUser
            };

            // 3. Set Mock State
            setUser(mockUser);
            setSession(mockSession);

            // 4. Set Mock Profile
            const mockProfile: UserProfile = {
                id: mockUser.id,
                email: mockUser.email || '',
                full_name: 'مدير النظام',
                role: 'admin', // Full access
                created_at: new Date().toISOString()
            };

            setProfile(mockProfile);
            await saveProfileToCache(mockProfile);

            // 5. Bootstrap Data if Empty
            try {
                const existingPatients = await storage.getItem<any[]>('patients');
                if (!existingPatients || (Array.isArray(existingPatients) && existingPatients.length === 0)) {
                    console.log('[Auth] Bootstrapping local patients data from export...');
                    const mappedPatients = (patientsData as any[]).map(mapPatientFromDB);
                    await storage.setItem('patients', mappedPatients);
                    console.log(`[Auth] Bootstrapped ${mappedPatients.length} patients.`);
                }

                const existingAppointments = await storage.getItem<any[]>('appointments');
                if (!existingAppointments || (Array.isArray(existingAppointments) && existingAppointments.length === 0)) {
                    console.log('[Auth] Bootstrapping local appointments data from export...');
                    const mappedAppointments = (appointmentsData as any[]).map(mapAppointmentFromDB);
                    await storage.setItem('appointments', mappedAppointments);
                    console.log(`[Auth] Bootstrapped ${mappedAppointments.length} appointments.`);
                }

                const existingExpenses = await storage.getItem<any[]>('expenses');
                if (!existingExpenses || (Array.isArray(existingExpenses) && existingExpenses.length === 0)) {
                    console.log('[Auth] Bootstrapping local expenses data from export...');
                    const mappedExpenses = (expensesData as any[]).map(mapExpenseFromDB);
                    await storage.setItem('expenses', mappedExpenses);
                    console.log(`[Auth] Bootstrapped ${mappedExpenses.length} expenses.`);
                }

                const existingInventory = await storage.getItem<any[]>('inventory');
                if (!existingInventory || (Array.isArray(existingInventory) && existingInventory.length === 0)) {
                    console.log('[Auth] Bootstrapping local inventory data from export...');
                    // Assuming inventory items match InventoryItem type or raw structure is sufficient
                    await storage.setItem('inventory', inventoryData);
                    console.log(`[Auth] Bootstrapped ${inventoryData.length} inventory items.`);
                }

                const existingScans = await storage.getItem<any[]>('patient_scans');
                if (!existingScans || (Array.isArray(existingScans) && existingScans.length === 0)) {
                    console.log('[Auth] Bootstrapping local patient_scans data from export...');
                    await storage.setItem('patient_scans', patientScansData);
                    console.log(`[Auth] Bootstrapped ${patientScansData.length} patient scans.`);
                }
            } catch (e) {
                console.error('[Auth] Data bootstrap failed:', e);
            }

            setLoading(false);
        };

        mockInit();
    }, []);

    const value = {
        user,
        session,
        profile,
        loading,
        isAdmin: profile?.role === 'admin',
        isDoctor: profile?.role === 'doctor' || profile?.role === 'admin',
        isAssistant: profile?.role === 'assistant',
        refreshProfile: async () => {
            if (user) {
                if (user.id === 'mock-admin-id') return; // Skip fetch for mock user
                await fetchProfile(user.id);
            }
        }
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="min-h-screen flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                        <Loader2 className="w-10 h-10 text-violet-600 animate-spin mx-auto" />
                        <p className="mt-2 text-gray-400">جاري تحميل البيانات...</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
