'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, Navigation } from 'lucide-react';
import { Listing } from '@/types';
import {
  formatPrice, discountPercent, formatPickupWindow, CATEGORY_EMOJI,
  STATUS_LABEL, timeUntil, ALLERGEN_LABEL, FOOD_CONDITION_LABEL, FOOD_CONDITION_ICON,
  formatDistance, cn,
} from '@/lib/utils';

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

export function ListingCard({ listing }: ListingCardProps) {
  const {
    id, title, businessName, businessType, category, tags, price, originalPrice,
    quantity, quantityReserved, status, pickupStartTime, pickupEndTime,
    imageUrl, expiresAt, distance, allergens, isRescueBundle, isSurpriseBox,
    surpriseBoxSize, foodCondition,
  } = listing;

  const remaining = quantity - quantityReserved;
  const discount = originalPrice ? discountPercent(price, originalPrice) : null;
  const isLow = remaining <= 2 && status === 'available';
  const providerColor = businessType ? (PROVIDER_TYPE_COLOR[businessType] ?? 'bg-gray-50 text-gray-500') : 'bg-gray-50 text-gray-500';
  const firstTag = tags && tags.length > 0 ? tags[0] : null;

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
          {isSurpriseBox && (
            <div className="absolute top-2 left-2 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg leading-tight">
              🎁 {surpriseBoxSize === 'small' ? 'S' : surpriseBoxSize === 'medium' ? 'M' : 'L'} Mystery
            </div>
          )}
          {isRescueBundle && !isSurpriseBox && (
            <div className="absolute top-2 left-2 bg-brand-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg leading-tight">
              🎁 Rescue
            </div>
          )}
          {discount && !isRescueBundle && !isSurpriseBox && (
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

          {/* Distance pill — top right */}
          {distance !== undefined && status === 'available' && (
            <div className="absolute top-2 right-2">
              {distancePill(distance)}
            </div>
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
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <p className="text-[11px] text-gray-400 truncate max-w-[100px]">{businessName}</p>
            {businessType && (
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0', providerColor)}>
                {businessType}
              </span>
            )}
          </div>

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
          <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-2">
            <Clock size={10} />
            <span>{formatPickupWindow(pickupStartTime, pickupEndTime)}</span>
          </div>

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
