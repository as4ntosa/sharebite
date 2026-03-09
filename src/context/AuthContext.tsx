'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole, AppMode, ProviderType } from '@/types';
import { DEMO_USERS } from '@/lib/mock-data';
import { generateId } from '@/lib/utils';
import { supabase, isSupabaseEnabled, dbProfileToUser } from '@/lib/supabase';

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

async function fetchProfile(userId: string): Promise<Record<string, unknown>> {
  if (!supabase) return {};
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return (data as Record<string, unknown>) ?? {};
}

async function upsertProfile(userId: string, fields: Record<string, unknown>) {
  if (!supabase) return;
  await supabase.from('profiles').upsert({ id: userId, ...fields });
}

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
    if (!isSupabaseEnabled || !supabase) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setUser(JSON.parse(stored));
      } catch {}
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(dbProfileToUser(session.user, profile) as User);
      } else {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (isDemoEmail(parsed.email)) setUser(parsed);
          }
        } catch {}
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(dbProfileToUser(session.user, profile) as User);
      } else {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored && isDemoEmail(JSON.parse(stored).email)) return;
        } catch {}
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 400));

    if (isDemoEmail(email)) {
      const demo = DEMO_USERS.find((u) => u.email === email);
      if (demo && DEMO_PASSWORDS[email] === password) { persistLocal(demo); return; }
      throw new Error('Invalid email or password');
    }

    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      // Eagerly hydrate user state so the redirect fires immediately
      // without waiting for the async onAuthStateChange callback.
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        persistLocal(dbProfileToUser(session.user, profile) as User);
      }
      return;
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

    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw new Error(error.message);
      // If email confirmation is required, data.session is null even though
      // data.user exists. Only set the user when we have an actual session.
      if (data.session?.user) {
        await upsertProfile(data.session.user.id, { name });
        const profile = await fetchProfile(data.session.user.id);
        persistLocal(dbProfileToUser(data.session.user, profile) as User);
      } else if (data.user && !data.session) {
        // Confirmation email sent — let the caller decide how to handle this.
        throw new Error('Please check your email to confirm your account, then sign in.');
      }
      return;
    }

    const newUser: User = { id: generateId(), email, name, role: 'consumer', providerStatus: 'none' };
    if (isBrowser) localStorage.setItem(`nibblen_account_${email}`, JSON.stringify({ password, user: newUser }));
    persistLocal(newUser);
  };

  const logout = async () => {
    if (isSupabaseEnabled && supabase && user && !isDemoEmail(user.email)) await supabase.auth.signOut();
    persistLocal(null);
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };

    if (isSupabaseEnabled && supabase && !isDemoEmail(user.email)) {
      upsertProfile(user.id, {
        name: updated.name, role: updated.role, current_mode: updated.currentMode,
        can_provide: updated.canProvide ?? false, city: updated.city ?? null,
        zip_code: updated.zipCode ?? null, avatar_url: updated.avatarUrl ?? null,
        phone: updated.phone ?? null, bio: updated.bio ?? null,
        allergies: updated.allergies ?? [],
        provider_status: updated.providerStatus ?? 'none',
        provider_type: updated.providerType ?? null,
        business_name: updated.businessName ?? null,
        business_type: updated.businessType ?? null,
        safety_policy_accepted: updated.safetyPolicyAccepted ?? false,
        integrity_policy_accepted: updated.integrityPolicyAccepted ?? false,
        food_safety_accepted: updated.foodSafetyAccepted ?? false,
        waiver_signed: updated.waiverSigned ?? false,
        waiver_signed_at: updated.waiverSignedAt ?? null,
      });
    } else {
      updateLocalAccount(user.email, updated);
    }

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
