import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { AppUser, UserPermissions, UserRole, DEFAULT_PERMISSIONS } from '../types';
import { generateId } from '../lib/security';
import { parseJSON } from '../lib/security';
import * as db from '../lib/supabaseService';

const STORAGE_KEY = 'clinic_users';
const SESSION_KEY = 'clinic_current_user';
const CREDENTIALS_KEY = 'clinic_saved_credentials';

// Default admin user
const DEFAULT_ADMIN: AppUser = {
  id: 'admin-001',
  username: 'admin',
  phone: '0000',
  displayName: 'المدير',
  role: 'admin',
  permissions: DEFAULT_PERMISSIONS.admin,
  isActive: true,
  createdAt: new Date().toISOString(),
};

interface AuthContextType {
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  users: AppUser[];
  login: (username: string, phone: string) => { success: boolean; error?: string };
  logout: () => void;
  hasPermission: (key: keyof UserPermissions) => boolean;
  addUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  updateUser: (id: string, updates: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
  toggleUserActive: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseJSON(stored, []);
      // Ensure admin account always exists
      if (!parsed.find((u: AppUser) => u.role === 'admin')) {
        return [DEFAULT_ADMIN, ...parsed];
      }
      return parsed;
    }
    return [DEFAULT_ADMIN];
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const sessionId = localStorage.getItem(SESSION_KEY);
    if (sessionId) {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allUsers = stored ? parseJSON(stored, [DEFAULT_ADMIN]) : [DEFAULT_ADMIN];
      return allUsers.find((u: AppUser) => u.id === sessionId && u.isActive) || null;
    }
    return null;
  });

  // Load users from Supabase on mount
  useEffect(() => {
    let mounted = true;
    db.fetchUsers().then((usersData) => {
      if (!mounted) return;
      if (usersData && usersData.length > 0) {
        // Ensure admin account always exists
        if (!usersData.find((u: AppUser) => u.role === 'admin')) {
          setUsers([DEFAULT_ADMIN, ...usersData]);
        } else {
          setUsers(usersData);
        }
      }
    }).catch(console.error);
    return () => { mounted = false; };
  }, []);

  // Persist users locally
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  // Update session when currentUser changes
  useEffect(() => {
    if (currentUser) {
      // Keep session user in sync with latest user data
      const latestUser = users.find(u => u.id === currentUser.id);
      if (latestUser && JSON.stringify(latestUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(latestUser);
      }
    }
  }, [users]);

  const login = useCallback((username: string, phone: string) => {
    const trimUser = username.trim().toLowerCase();
    const trimPhone = phone.trim();

    if (!trimUser || !trimPhone) {
      return { success: false, error: 'يرجى إدخال اسم المستخدم ورقم الهاتف' };
    }

    const user = users.find(
      u => u.username.toLowerCase() === trimUser && u.phone === trimPhone
    );

    if (!user) {
      return { success: false, error: 'اسم المستخدم أو رقم الهاتف غير صحيح' };
    }

    if (!user.isActive) {
      return { success: false, error: 'هذا الحساب معطّل. تواصل مع المدير' };
    }

    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, user.id);
    // Save credentials for auto-login
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ username: user.username, phone: user.phone }));
    return { success: true };
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CREDENTIALS_KEY);
  }, []);

  const hasPermission = useCallback((key: keyof UserPermissions): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true; // Admin always has full access
    return currentUser.permissions[key] === true;
  }, [currentUser]);

  const addUser = useCallback((userData: Omit<AppUser, 'id' | 'createdAt'>) => {
    // Check for duplicate username
    const exists = users.some(u => u.username.toLowerCase() === userData.username.toLowerCase());
    if (exists) {
      return { success: false, error: 'اسم المستخدم موجود بالفعل' };
    }

    const newUser: AppUser = {
      ...userData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
    db.upsertUser(newUser);
    return { success: true };
  }, [users]);

  const updateUser = useCallback((id: string, updates: Partial<AppUser>) => {
    setUsers(prev => {
      const updated = prev.map(u => u.id === id ? { ...u, ...updates } : u);
      const user = updated.find(u => u.id === id);
      if (user) db.upsertUser(user);
      return updated;
    });
  }, []);

  const deleteUser = useCallback((id: string) => {
    // Cannot delete admin
    setUsers(prev => prev.filter(u => !(u.id === id && u.role !== 'admin')));
    db.deleteUserDB(id);
  }, []);

  const toggleUserActive = useCallback((id: string) => {
    setUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === id && u.role !== 'admin') {
          return { ...u, isActive: !u.isActive };
        }
        return u;
      });
      const user = updated.find(u => u.id === id);
      if (user) db.upsertUser(user);
      return updated;
    });
  }, []);

  const contextValue = useMemo<AuthContextType>(() => ({
    currentUser,
    isAuthenticated: !!currentUser,
    users,
    login,
    logout,
    hasPermission,
    addUser,
    updateUser,
    deleteUser,
    toggleUserActive,
  }), [currentUser, users, login, logout, hasPermission, addUser, updateUser, deleteUser, toggleUserActive]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
