'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProviderNav } from '@/components/layout/ProviderNav';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (!user.city) { router.replace('/onboarding'); return; }
    // Hard gate: provider tools require approved status — mode alone is not enough
    if (user.providerStatus !== 'approved') {
      router.replace('/become-a-provider');
      return;
    }
    // Soft gate: if the user has switched back to consumer mode, send them home
    if (user.currentMode === 'consumer') {
      router.replace('/home');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-full bg-gray-50">
      {/* Extra bottom padding: mode switcher strip (24px) + nav bar (60px) */}
      <main className="pb-[84px]">{children}</main>
      <ProviderNav />
    </div>
  );
}
