'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole, ProviderStatus, ProviderType, Allergen } from '@/types';
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
  applyForProvider: (data: {
    providerType: ProviderType;
    businessName?: string;
    safetyPolicyAccepted: boolean;
    integrityPolicyAccepted: boolean;
    foodSafetyAccepted: boolean;
  }) => void;
  approveProvider: () => void; // demo-only instant approval
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'nibblen_user';

const DEMO_PASSWORDS: Record<string, string> = {
  'demo@nibblen.com': 'demo123',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setLoading(false);
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const login = async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 600));
    const demo = DEMO_USERS.find((u) => u.email === email);
    if (demo && DEMO_PASSWORDS[email] === password) {
      persist(demo);
      return;
    }
    const stored = localStorage.getItem(`nibblen_account_${email}`);
    if (stored) {
      const account = JSON.parse(stored);
      if (account.password === password) {
        persist(account.user);
        return;
      }
    }
    throw new Error('Invalid email or password');
  };

  const signup = async (email: string, password: string, name: string) => {
    await new Promise((r) => setTimeout(r, 600));
    const existing = DEMO_USERS.find((u) => u.email === email);
    if (existing || localStorage.getItem(`nibblen_account_${email}`)) {
      throw new Error('An account with this email already exists');
    }
    const newUser: User = {
      id: generateId(),
      email,
      name,
      role: 'consumer',
      providerStatus: 'none',
    };
    localStorage.setItem(
      `nibblen_account_${email}`,
      JSON.stringify({ password, user: newUser })
    );
    persist(newUser);
  };

  const logout = () => persist(null);

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    persist(updated);
    const stored = localStorage.getItem(`nibblen_account_${user.email}`);
    if (stored) {
      const account = JSON.parse(stored);
      account.user = updated;
      localStorage.setItem(`nibblen_account_${user.email}`, JSON.stringify(account));
    }
  };

  const setRole = (role: UserRole) => updateProfile({ role });

  const applyForProvider = (data: {
    providerType: ProviderType;
    businessName?: string;
    safetyPolicyAccepted: boolean;
    integrityPolicyAccepted: boolean;
    foodSafetyAccepted: boolean;
  }) => {
    updateProfile({ ...data, providerStatus: 'pending' });
  };

  const approveProvider = () => {
    updateProfile({ providerStatus: 'approved', role: 'provider' });
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, updateProfile, setRole, applyForProvider, approveProvider }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
