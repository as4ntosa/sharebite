'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole, AppMode, ProviderType } from '@/types';
import { DEMO_USERS } from '@/lib/mock-data';
import { generateId } from '@/lib/utils';
import { supabase, isSupabaseEnabled, dbProfileToUser, profileDataToDb } from '@/lib/supabase';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  setRole: (role: UserRole) => void;
  switchMode: (mode: AppMode) => void;
  applyForProvider: (data: {
    providerType: ProviderType;
    businessName?: string;
    address?: string;
    licenseNumber?: string;
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
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
    if (isSupabaseEnabled && supabase) {
      // Seed from localStorage instantly so the UI is never blocked waiting for Supabase
      if (isBrowser) {
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) setUser(JSON.parse(cached));
        } catch {}
      }

      // Bootstrap session from Supabase
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          setAccessToken(session.access_token);
          setLoading(false); // unblock UI immediately; localStorage already seeded user above
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profile) setUser(dbProfileToUser(profile, session.user));
        } else {
          setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setAccessToken(null);
          return;
        }
        if (session?.user) {
          setAccessToken(session.access_token);
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profile) {
            const u = dbProfileToUser(profile, session.user);
            setUser(u);
            if (isBrowser) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
          }
        }
      });

      // Watch for admin-driven profile changes (e.g. provider approval/rejection)
      // so the user's local state stays in sync without requiring a sign-out/sign-in.
      let profileChannel: ReturnType<typeof supabase.channel> | null = null;

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user) return;
        profileChannel = supabase
          .channel('auth-profile-sync')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` },
            (payload) => {
              setUser((prev) => {
                if (!prev) return prev;
                const updated = dbProfileToUser(payload.new, { id: prev.id, email: prev.email });
                if (isBrowser) localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
              });
            }
          )
          .subscribe();
      });

      return () => {
        subscription.unsubscribe();
        if (profileChannel) supabase.removeChannel(profileChannel);
      };
    } else {
      // Mock / localStorage mode
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setUser(JSON.parse(stored));
      } catch {}
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Demo user always uses localStorage path
    if (isDemoEmail(email)) {
      await new Promise((r) => setTimeout(r, 400));
      const demo = DEMO_USERS.find((u) => u.email === email);
      if (demo && DEMO_PASSWORDS[email] === password) { persistLocal(demo); return; }
      throw new Error('Invalid email or password');
    }

    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      return;
    }

    // localStorage mode
    await new Promise((r) => setTimeout(r, 400));
    const stored = isBrowser ? localStorage.getItem(`nibblen_account_${email}`) : null;
    if (stored) {
      const account = JSON.parse(stored);
      if (account.password === password) { persistLocal(account.user); return; }
    }
    throw new Error('Invalid email or password');
  };

  const signup = async (email: string, password: string, name: string) => {
    if (isDemoEmail(email)) throw new Error('An account with this email already exists');

    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw new Error(error.message);
      // If email confirmation is disabled, session is immediate
      if (data.session && data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (profile) {
          const u = dbProfileToUser(profile, data.user);
          if (isBrowser) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
          setUser(u);
        }
        return;
      }
      // Email confirmation required
      throw new Error('Check your email to confirm your account before signing in.');
    }

    // localStorage mode
    await new Promise((r) => setTimeout(r, 400));
    const existingAccount = isBrowser ? localStorage.getItem(`nibblen_account_${email}`) : null;
    if (existingAccount) throw new Error('An account with this email already exists');
    const newUser: User = { id: generateId(), email, name, role: 'consumer', providerStatus: 'none' };
    if (isBrowser) localStorage.setItem(`nibblen_account_${email}`, JSON.stringify({ password, user: newUser }));
    persistLocal(newUser);
  };

  const logout = async () => {
    persistLocal(null);
    if (isSupabaseEnabled && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };

    // Update local state immediately (optimistic) so callers don't need to await
    persistLocal(updated);
    if (!isDemoEmail(user.email)) updateLocalAccount(user.email, updated);

    if (isSupabaseEnabled && accessToken) {
      const dbData = profileDataToDb(data);
      void fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify(dbData),
      });
    }
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
    address?: string;
    licenseNumber?: string;
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
    <AuthContext.Provider value={{ user, accessToken, loading, login, signup, logout, updateProfile, setRole, switchMode, applyForProvider, approveProvider }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
