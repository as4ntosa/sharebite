'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, List, PlusCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeSwitcher } from './ModeSwitcher';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/listings', label: 'Listings', icon: List },
  { href: '/listings/create', label: 'Add', icon: PlusCircle },
  { href: '/provider-profile', label: 'Profile', icon: User },
];

export function ProviderNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mode switcher strip — always shown in provider layout (user is always approved here) */}
      <ModeSwitcher />

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100">
        <div className="flex items-stretch">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium transition-colors',
                  active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
