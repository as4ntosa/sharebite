'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole, AppMode, ProviderType } from '@/types';
import { DEMO_USERS } from '@/lib/mock-data';
import { generateId } from '@/lib/utils';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  setRole: (role: UserRole) => void;
  switchMode: (mode: AppMode) => void;
  applyForProvider: (data: {
    providerType: ProviderType;
    businessName?: string;
    safetyPolicyAccepted: boolean;
    integrityPolicyAccepted: boolean;
    foodSafetyAccepted: boolean;
  }) => void;
  approveProvider: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'nibblen_user';
const DEMO_PASSWORDS: Record<string, string> = { 'demo@nibblen.com': 'demo123' };
const isDemoEmail = (email: string) => DEMO_USERS.some((u) => u.email === email);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isBrowser = typeof window !== 'undefined';

  const persistLocal = (u: User | null) => {
    setUser(u);
    if (!isBrowser) return;
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const updateLocalAccount = (email: string, updated: User) => {
    if (!isBrowser) return;
    const stored = localStorage.getItem(`nibblen_account_${email}`);
    if (stored) {
      const account = JSON.parse(stored);
      account.user = updated;
      localStorage.setItem(`nibblen_account_${email}`, JSON.stringify(account));
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 400));

    if (isDemoEmail(email)) {
      const demo = DEMO_USERS.find((u) => u.email === email);
      if (demo && DEMO_PASSWORDS[email] === password) { persistLocal(demo); return; }
      throw new Error('Invalid email or password');
    }

    const stored = isBrowser ? localStorage.getItem(`nibblen_account_${email}`) : null;
    if (stored) {
      const account = JSON.parse(stored);
      if (account.password === password) { persistLocal(account.user); return; }
    }
    throw new Error('Invalid email or password');
  };

  const signup = async (email: string, password: string, name: string) => {
    await new Promise((r) => setTimeout(r, 400));

    const existingAccount = isBrowser ? localStorage.getItem(`nibblen_account_${email}`) : null;
    if (isDemoEmail(email) || existingAccount) throw new Error('An account with this email already exists');

    const newUser: User = { id: generateId(), email, name, role: 'consumer', providerStatus: 'none' };
    if (isBrowser) localStorage.setItem(`nibblen_account_${email}`, JSON.stringify({ password, user: newUser }));
    persistLocal(newUser);
  };

  const logout = async () => {
    persistLocal(null);
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    updateLocalAccount(user.email, updated);
    persistLocal(updated);
  };

  const setRole = (role: UserRole) => updateProfile({ role });

  const switchMode = (mode: AppMode) => {
    if (!user) return;
    if (mode === 'provider' && user.providerStatus !== 'approved') return;
    updateProfile({ currentMode: mode });
  };

  const applyForProvider = (data: {
    providerType: ProviderType;
    businessName?: string;
    safetyPolicyAccepted: boolean;
    integrityPolicyAccepted: boolean;
    foodSafetyAccepted: boolean;
  }) => {
    updateProfile({ ...data, providerStatus: 'pending', currentMode: 'consumer' });
  };

  const approveProvider = () => {
    updateProfile({ providerStatus: 'approved', canProvide: true, currentMode: 'consumer' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile, setRole, switchMode, applyForProvider, approveProvider }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
