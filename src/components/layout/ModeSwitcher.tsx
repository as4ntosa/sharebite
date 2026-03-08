'use client';

import { useRouter } from 'next/navigation';
import { ShoppingBag, Store, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/**
 * Mode switcher banner shown ONLY to approved providers.
 * Regular users never see this — they are always in consumer mode.
 *
 * Renders as a thin strip above the bottom nav bar.
 * Clicking "Switch" toggles the mode and navigates to the appropriate home screen.
 */
export function ModeSwitcher() {
  const { user, switchMode } = useAuth();
  const router = useRouter();

  // Only approved providers see this control
  if (user?.providerStatus !== 'approved') return null;

  const isProviderMode = user?.currentMode === 'provider';

  const handleSwitch = () => {
    if (isProviderMode) {
      switchMode('consumer');
      router.replace('/home');
    } else {
      switchMode('provider');
      router.replace('/dashboard');
    }
  };

  return (
    <div
      className={`fixed left-0 right-0 z-30 flex items-center justify-between px-4 py-1.5 text-xs font-medium select-none transition-colors ${
        isProviderMode
          ? 'bg-amber-500 text-white bottom-[60px]'
          : 'bg-brand-600 text-white bottom-[60px]'
      }`}
    >
      {/* Current mode label */}
      <div className="flex items-center gap-1.5">
        {isProviderMode ? (
          <>
            <Store size={13} />
            <span>Provider Mode</span>
          </>
        ) : (
          <>
            <ShoppingBag size={13} />
            <span>Consumer Mode</span>
          </>
        )}
      </div>

      {/* Switch button */}
      <button
        onClick={handleSwitch}
        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
          isProviderMode
            ? 'bg-white text-amber-600 hover:bg-amber-50'
            : 'bg-white text-brand-700 hover:bg-brand-50'
        }`}
        aria-label={isProviderMode ? 'Switch to Consumer Mode' : 'Switch to Provider Mode'}
      >
        <ArrowLeftRight size={10} />
        {isProviderMode ? 'Consumer' : 'Provider'}
      </button>
    </div>
  );
}
