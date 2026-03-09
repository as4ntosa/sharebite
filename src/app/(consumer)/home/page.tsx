'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Navigation, Loader2, Leaf, AlertCircle, LayoutGrid, Map } from 'lucide-react';
import Link from 'next/link';
import { ListingCard } from '@/components/listing/ListingCard';
import { ListingCardSkeleton } from '@/components/listing/ListingCardSkeleton';
import { ListingsMap } from '@/components/map/ListingsMap';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Category, Listing } from '@/types';
import { isSupabaseEnabled } from '@/lib/supabase';
import { CATEGORIES, CATEGORY_EMOJI, cn, haversineKm } from '@/lib/utils';
import { useGeolocation } from '@/hooks/useGeolocation';

type ViewMode = 'list' | 'map';

export default function HomePage() {
  const { user } = useAuth();
  const { getListings, listingsFetchStatus } = useData();
  const searchParams = useSearchParams();
  const { coords, status, request } = useGeolocation();

  const [activeCategory, setActiveCategory] = useState<Category | ''>(() => {
    const cat = searchParams.get('category');
    return (cat as Category) || '';
  });
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const userAllergies = user?.allergies && user.allergies.length > 0 ? user.allergies : undefined;
  const rawListings = getListings({
    ...(activeCategory ? { category: activeCategory } : {}),
    ...(userAllergies ? { excludeAllergens: userAllergies } : {}),
  });

  // Enrich with real distances when we have coords, then sort nearest first
  const listings: Listing[] = coords
    ? [...rawListings]
        .map((l) =>
          l.pickupLat != null && l.pickupLng != null
            ? { ...l, distance: haversineKm(coords.latitude, coords.longitude, l.pickupLat, l.pickupLng) }
            : l
        )
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    : rawListings;

  // Split into live vs sample listings (only relevant when Supabase is configured)
  const liveListings = listings.filter((l) => !l.isSample);
  const sampleListings = listings.filter((l) => l.isSample);
  const hasLiveSplit = isSupabaseEnabled && listingsFetchStatus === 'live' && liveListings.length > 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400">{greeting()}</p>
            <h1 className="text-lg font-bold text-gray-900">
              {user?.name?.split(' ')[0] || 'Welcome'} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Location pill */}
            {status === 'granted' ? (
              <div className="flex items-center gap-1 text-xs text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-1.5 rounded-full">
                <Navigation size={11} className="fill-brand-600 text-brand-600" />
                Near you
              </div>
            ) : status === 'loading' ? (
              <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1.5 rounded-full">
                <Loader2 size={11} className="animate-spin" />
                Locating…
              </div>
            ) : status === 'denied' ? (
              <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2.5 py-1.5 rounded-full">
                <MapPin size={11} />
                {user?.city || 'Location off'}
              </div>
            ) : (
              // idle or unavailable — show city or "Use location" button
              user?.city ? (
                <button
                  onClick={request}
                  className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <MapPin size={11} />
                  {user.city}
                </button>
              ) : (
                <button
                  onClick={request}
                  className="flex items-center gap-1 text-xs text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-1.5 rounded-full hover:bg-brand-100 transition-colors"
                >
                  <Navigation size={11} />
                  Use location
                </button>
              )
            )}
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-brand-700 font-semibold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <Link href="/search">
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-3">
            <Search size={16} className="text-gray-400" />
            <span className="text-sm text-gray-400">Search food, restaurants…</span>
          </div>
        </Link>

        {/* Category scroll */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => setActiveCategory('')}
            className={cn(
              'shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors border',
              activeCategory === ''
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            )}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors border',
                activeCategory === cat
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              )}
            >
              <span>{CATEGORY_EMOJI[cat]}</span>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            {activeCategory ? activeCategory : status === 'granted' ? 'Nearest to you' : 'Nearby Listings'}
            <span className="text-gray-400 font-normal ml-1">({listings.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            {/* List / Map toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors',
                  viewMode === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'
                )}
                aria-label="List view"
              >
                <LayoutGrid size={12} />
                List
              </button>
              <button
                onClick={() => { setViewMode('map'); if (status === 'idle') request(); }}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors',
                  viewMode === 'map' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'
                )}
                aria-label="Map view"
              >
                <Map size={12} />
                Map
              </button>
            </div>
            <Link href="/search" className="text-xs text-brand-600 font-medium">
              See all
            </Link>
          </div>
        </div>

        {/* Impact counter */}
        <div className="flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mb-4">
          <Leaf size={16} className="text-brand-600 shrink-0" />
          <p className="text-xs text-brand-700">
            <span className="font-bold">1,284 meals rescued</span> in San Francisco this week · saving an estimated <span className="font-bold">3.2 tonnes CO₂</span>
          </p>
        </div>

        {/* Allergen filter active banner */}
        {userAllergies && userAllergies.length > 0 && (
          <Link href="/profile" className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4 hover:bg-amber-100 transition-colors">
            <AlertCircle size={15} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 flex-1">
              <span className="font-semibold">Allergen filter active</span> — hiding listings with {userAllergies.slice(0, 2).join(', ')}{userAllergies.length > 2 ? ` +${userAllergies.length - 2} more` : ''}
            </p>
            <span className="text-[10px] text-amber-500 font-medium shrink-0">Manage →</span>
          </Link>
        )}

        {/* Location permission prompt */}
        {status === 'idle' && (
          <button
            onClick={request}
            className="w-full flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mb-4 text-left hover:bg-brand-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
              <Navigation size={15} className="text-brand-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-700">Find providers near you</p>
              <p className="text-xs text-brand-500">Tap to sort listings by your distance</p>
            </div>
          </button>
        )}

        {status === 'denied' && (
          <div className="w-full flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4">
            <MapPin size={15} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">Location access denied. Enable it in your browser settings to sort by distance.</p>
          </div>
        )}

        {viewMode === 'map' ? (
          /* ── Map view ─────────────────────────────────────────── */
          <ListingsMap
            listings={listings}
            userCoords={coords}
            className="w-full"
            style={{ height: 'calc(100vh - 320px)', minHeight: 360 }}
          />
        ) : listingsFetchStatus === 'loading' ? (
          /* ── Skeleton while Supabase fetches ──────────────────── */
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          /* ── Empty state ──────────────────────────────────────── */
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🍃</div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">No listings found</h3>
            <p className="text-sm text-gray-400">Try a different category or check back later</p>
          </div>
        ) : hasLiveSplit ? (
          /* ── Live + sample split (Supabase mode) ─────────────── */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {liveListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            {sampleListings.length > 0 && (
              <>
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">
                    Sample Listings · Demo
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {sampleListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          /* ── List view (mock-only / no live data) ─────────────── */
          <div className="grid grid-cols-2 gap-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
