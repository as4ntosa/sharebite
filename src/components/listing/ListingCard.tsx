'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, Navigation } from 'lucide-react';
import { Listing } from '@/types';
import {
  formatPrice, discountPercent, formatPickupWindow, CATEGORY_EMOJI,
  STATUS_LABEL, timeUntil, timeUntilMs, ALLERGEN_LABEL, FOOD_CONDITION_LABEL, FOOD_CONDITION_ICON,
  formatDistance, formatFoodAge, cn,
} from '@/lib/utils';
import { computeFreshnessScore, getFreshnessLevel, FRESHNESS_CONFIG } from '@/lib/freshness';

interface ListingCardProps {
  listing: Listing;
}

const PROVIDER_TYPE_COLOR: Record<string, string> = {
  Restaurant: 'bg-orange-50 text-orange-600',
  Bakery: 'bg-amber-50 text-amber-600',
  Grocery: 'bg-green-50 text-green-700',
  Household: 'bg-purple-50 text-purple-600',
  Market: 'bg-teal-50 text-teal-600',
};

function distancePill(km: number) {
  const label = formatDistance(km);
  if (km < 1) return <span className="flex items-center gap-0.5 text-[10px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded-full"><Navigation size={8} className="fill-brand-600 text-brand-600" />{label}</span>;
  if (km < 3) return <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full"><MapPin size={8} />{label}</span>;
  return <span className="flex items-center gap-0.5 text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full"><MapPin size={8} />{label}</span>;
}

const BADGE_CONFIG: Record<string, { label: string; style: string }> = {
  verified:         { label: '✓ Verified',       style: 'bg-blue-50 text-blue-600 border-blue-100' },
  'top-rated':      { label: '⭐ Top Rated',      style: 'bg-amber-50 text-amber-600 border-amber-100' },
  'fast-mover':     { label: '⚡ Fast Mover',     style: 'bg-purple-50 text-purple-600 border-purple-100' },
  'eco-champion':   { label: '🌿 Eco Champion',   style: 'bg-brand-50 text-brand-600 border-brand-100' },
  'health-certified': { label: '🏥 Health Cert',  style: 'bg-teal-50 text-teal-600 border-teal-100' },
};

export function ListingCard({ listing }: ListingCardProps) {
  const {
    id, title, businessName, businessType, category, tags, price, originalPrice,
    quantity, quantityReserved, status, pickupStartTime, pickupEndTime,
    imageUrl, expiresAt, distance, allergens, isRescueBundle, isSurpriseBox,
    surpriseBoxSize, foodCondition, preparedAt, isDonation, isEvent, providerBadges,
  } = listing;

  const remaining = quantity - quantityReserved;
  const discount = originalPrice ? discountPercent(price, originalPrice) : null;
  const isLow = remaining <= 2 && status === 'available';
  const providerColor = businessType ? (PROVIDER_TYPE_COLOR[businessType] ?? 'bg-gray-50 text-gray-500') : 'bg-gray-50 text-gray-500';
  const firstTag = tags && tags.length > 0 ? tags[0] : null;

  const freshnessScore = computeFreshnessScore(listing);
  const freshnessLevel = getFreshnessLevel(freshnessScore);
  const freshnessConfig = FRESHNESS_CONFIG[freshnessLevel];
  const isExpiringSoon = status === 'available' && timeUntilMs(expiresAt) < 2 * 3_600_000 && timeUntilMs(expiresAt) > 0;

  return (
    <Link href={`/listing/${id}`} className="block group">
      <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden active:scale-[0.98]">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, 33vw"
          />

          {/* Type badges */}
          {isDonation && (
            <div className="absolute top-2 left-2 bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg leading-tight">
              🤝 Free
            </div>
          )}
          {isEvent && !isDonation && (
            <div className="absolute top-2 left-2 bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg leading-tight">
              🎉 Event
            </div>
          )}
          {isSurpriseBox && !isDonation && !isEvent && (
            <div className="absolute top-2 left-2 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg leading-tight">
              🎁 {surpriseBoxSize === 'small' ? 'S' : surpriseBoxSize === 'medium' ? 'M' : 'L'} Mystery
            </div>
          )}
          {isRescueBundle && !isSurpriseBox && !isDonation && !isEvent && (
            <div className="absolute top-2 left-2 bg-brand-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg leading-tight">
              🎁 Rescue
            </div>
          )}
          {discount && !isRescueBundle && !isSurpriseBox && !isDonation && !isEvent && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
              -{discount}%
            </div>
          )}

          {/* Status overlay */}
          {status !== 'available' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="bg-white text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                {STATUS_LABEL[status]}
              </span>
            </div>
          )}

          {/* Expiry timer */}
          {status === 'available' && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
              <Clock size={9} />
              {timeUntil(expiresAt)}
            </div>
          )}

          {/* Freshness pill — top right (replaces distance for urgency) */}
          {status === 'available' && (
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
              {distance !== undefined && distancePill(distance)}
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', freshnessConfig.pill)}>
                {freshnessConfig.label}
              </span>
            </div>
          )}
          {distance !== undefined && status !== 'available' && (
            <div className="absolute top-2 right-2">{distancePill(distance)}</div>
          )}

          {/* Expiring soon pulse ring */}
          {isExpiringSoon && (
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Category + cuisine */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[10px] text-gray-400 font-medium">
              {CATEGORY_EMOJI[category]} {category}
            </span>
            {firstTag && (
              <span className="text-[10px] text-blue-500 font-medium bg-blue-50 px-1.5 py-0.5 rounded-full">
                {firstTag}
              </span>
            )}
            {isLow && (
              <span className="text-[10px] text-red-500 font-bold ml-auto shrink-0">
                {remaining} left!
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-1 line-clamp-2">
            {title}
          </h3>

          {/* Business name + provider type */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <p className="text-[11px] text-gray-400 truncate max-w-[100px]">{businessName}</p>
            {businessType && (
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0', providerColor)}>
                {businessType}
              </span>
            )}
          </div>

          {/* Reputation badges */}
          {providerBadges && providerBadges.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {providerBadges.slice(0, 2).map((badge) => {
                const cfg = BADGE_CONFIG[badge];
                if (!cfg) return null;
                return (
                  <span key={badge} className={cn('text-[9px] font-semibold border px-1.5 py-0.5 rounded-full', cfg.style)}>
                    {cfg.label}
                  </span>
                );
              })}
              {providerBadges.length > 2 && (
                <span className="text-[9px] font-semibold bg-gray-100 text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded-full">
                  +{providerBadges.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Price row */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-bold text-brand-600">{formatPrice(price)}</span>
            {originalPrice && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(originalPrice)}</span>
            )}
            {/* Food condition badge */}
            {foodCondition && (
              <span className="text-[9px] font-semibold ml-auto text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-full shrink-0">
                {FOOD_CONDITION_ICON[foodCondition]} {FOOD_CONDITION_LABEL[foodCondition]}
              </span>
            )}
          </div>

          {/* Pickup time */}
          <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1">
            <Clock size={10} />
            <span>{formatPickupWindow(pickupStartTime, pickupEndTime)}</span>
          </div>

          {/* Food age */}
          {preparedAt && (
            <div className="flex items-center gap-1 text-[10px] text-brand-600 font-medium mb-2">
              <span>🌿</span>
              <span>{formatFoodAge(preparedAt)}</span>
            </div>
          )}

          {/* Allergen chips */}
          {allergens && allergens.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {allergens.slice(0, 2).map((a) => (
                <span key={a} className="text-[9px] font-semibold bg-red-50 text-red-500 border border-red-100 px-1 py-0.5 rounded-md">
                  {ALLERGEN_LABEL[a]}
                </span>
              ))}
              {allergens.length > 2 && (
                <span className="text-[9px] font-semibold bg-gray-100 text-gray-400 px-1 py-0.5 rounded-md">
                  +{allergens.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
