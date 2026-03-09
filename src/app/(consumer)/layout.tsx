'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BottomNav } from '@/components/layout/BottomNav';

export default function ConsumerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (!user.city) { router.replace('/onboarding'); return; }
    // If an approved provider has switched to provider mode, send them to provider tools
    if (user.providerStatus === 'approved' && user.currentMode === 'provider') {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  // Approved providers need extra space for the mode switcher strip above the nav
  const hasModeSwitcher = user.providerStatus === 'approved';

  return (
    <div className="min-h-full bg-gray-50">
      <main className={hasModeSwitcher ? 'pb-[96px]' : 'pb-[76px]'}>{children}</main>
      <BottomNav />
    </div>
  );
}
