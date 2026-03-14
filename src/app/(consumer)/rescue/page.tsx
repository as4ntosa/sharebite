'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Zap, Clock, MapPin, AlertTriangle, Users } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { haversineKm, timeUntilMs, timeUntil, formatDistance, CATEGORY_EMOJI, cn } from '@/lib/utils';

const URGENCY_TIERS = [
  { label: 'Critical', maxMs: 1_800_000, color: 'bg-red-500', pill: 'bg-red-50 text-red-700 border-red-200' },
  { label: 'Urgent',   maxMs: 3_600_000, color: 'bg-orange-500', pill: 'bg-orange-50 text-orange-700 border-orange-200' },
  { label: 'Soon',     maxMs: 7_200_000, color: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700 border-amber-200' },
];

function getUrgencyTier(ms: number) {
  return URGENCY_TIERS.find((t) => ms <= t.maxMs) ?? null;
}

export default function RescuePage() {
  const { getListings } = useData();
  const { coords, status: geoStatus, request } = useGeolocation();

  const urgentListings = useMemo(() => {
    const all = getListings();
    return all
      .filter((l) => {
        const ms = timeUntilMs(l.expiresAt);
        return l.status === 'available' && ms > 0 && ms <= 7_200_000;
      })
      .map((l) => ({
        ...l,
        distance: coords && l.pickupLat != null && l.pickupLng != null
          ? haversineKm(coords.latitude, coords.longitude, l.pickupLat, l.pickupLng)
          : l.distance,
        msLeft: timeUntilMs(l.expiresAt),
      }))
      .sort((a, b) => a.msLeft - b.msLeft);
  }, [getListings, coords]);

  return (
    <div>
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2 mb-0.5">
          <Zap size={20} className="text-red-500" />
          <h1 className="text-xl font-bold text-gray-900">Rescue Feed</h1>
        </div>
        <p className="text-xs text-gray-400">Food expiring within 2 hours — needs rescuing now</p>
      </div>

      <div className="px-4 py-4 pb-28 space-y-4">
        {/* Location prompt */}
        {geoStatus === 'idle' && (
          <button
            onClick={request}
            className="w-full flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 text-left hover:bg-brand-100 transition-colors"
          >
            <MapPin size={15} className="text-brand-600 shrink-0" />
            <p className="text-xs text-brand-700 font-medium">Enable location to sort by distance</p>
          </button>
        )}

        {/* Urgency legend */}
        <div className="flex items-center gap-2 flex-wrap">
          {URGENCY_TIERS.map((t) => (
            <span key={t.label} className={cn('flex items-center gap-1.5 text-[11px] font-semibold border px-2.5 py-1 rounded-full', t.pill)}>
              <span className={cn('w-2 h-2 rounded-full shrink-0', t.color)} />
              {t.label}
            </span>
          ))}
        </div>

        {/* Volunteer callout */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Users size={16} className="text-blue-500 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-700">NGO & Volunteer Dispatch</p>
            <p className="text-xs text-blue-500 mt-0.5">
              Reserve unclaimed listings on behalf of your organization. All surplus counts toward community impact.
            </p>
          </div>
        </div>

        {/* Listings */}
        {urgentListings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">Nothing expiring right now</h3>
            <p className="text-sm text-gray-400">Check back later — new listings appear throughout the day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {urgentListings.map((listing) => {
              const tier = getUrgencyTier(listing.msLeft);
              const remaining = listing.quantity - listing.quantityReserved;
              return (
                <Link key={listing.id} href={`/listing/${listing.id}`} className="block">
                  <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow p-4 flex items-start gap-3">
                    {/* Urgency stripe */}
                    <div className={cn('w-1 self-stretch rounded-full shrink-0', tier?.color ?? 'bg-gray-300')} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-1">
                          {listing.title}
                        </h3>
                        {tier && (
                          <span className={cn('text-[10px] font-bold border px-2 py-0.5 rounded-full shrink-0', tier.pill)}>
                            {tier.label}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 mb-2">
                        {CATEGORY_EMOJI[listing.category]} {listing.category} · {listing.businessName}
                      </p>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                          <Clock size={11} />
                          <span>{timeUntil(listing.expiresAt)} left</span>
                        </div>
                        {listing.distance !== undefined && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin size={10} />
                            <span>{formatDistance(listing.distance)}</span>
                          </div>
                        )}
                        <span className="text-xs text-gray-400">{remaining} remaining</span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-base font-bold text-brand-600">
                        {listing.isDonation ? 'Free' : `$${listing.price.toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {urgentListings.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">
              <span className="font-semibold">{urgentListings.length} listing{urgentListings.length > 1 ? 's' : ''}</span> at risk of going to waste — every rescue counts!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
