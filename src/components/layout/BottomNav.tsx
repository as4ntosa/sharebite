'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, User, Zap } from 'lucide-react';
import { cn, timeUntilMs } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { ModeSwitcher } from './ModeSwitcher';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/reservations', label: 'Orders', icon: ShoppingBag },
  { href: '/rescue', label: 'Rescue', icon: Zap },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { getListings } = useData();
  const hasModeSwitcher = user?.providerStatus === 'approved';

  const urgentCount = getListings().filter((l) => {
    const ms = timeUntilMs(l.expiresAt);
    return l.status === 'available' && ms > 0 && ms <= 3_600_000;
  }).length;

  return (
    <>
      {/* Mode switcher strip — only visible to approved providers */}
      <ModeSwitcher />

      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100',
        )}
      >
        <div className="flex items-stretch">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            const showBadge = href === '/rescue' && urgentCount > 0;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium transition-colors',
                  active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-[8px] font-bold text-white">{urgentCount > 9 ? '9+' : urgentCount}</span>
                    </span>
                  )}
                </div>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
