'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, Gift } from 'lucide-react';
import { Listing } from '@/types';
import { formatPrice, discountPercent, formatPickupWindow, CATEGORY_EMOJI, STATUS_COLOR, STATUS_LABEL, timeUntil, SURPRISE_BOX_LABELS } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const {
    id, title, businessName, category, price, originalPrice,
    quantity, quantityReserved, status, pickupStartTime, pickupEndTime,
    pickupCity, imageUrl, expiresAt, distance, tags,
    isSurpriseBox, surpriseBoxSize,
  } = listing;

  const remaining = quantity - quantityReserved;
  const discount = originalPrice ? discountPercent(price, originalPrice) : null;
  const isLow = remaining <= 2 && status === 'available';

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
          {/* Surprise box badge */}
          {isSurpriseBox && surpriseBoxSize && (
            <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Gift size={11} />
              {SURPRISE_BOX_LABELS[surpriseBoxSize]}
            </div>
          )}
          {/* Discount badge */}
          {!isSurpriseBox && discount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-lg">
              -{discount}%
            </div>
          )}
          {/* Status badge */}
          {status !== 'available' && (
            <div className={`absolute inset-0 flex items-center justify-center bg-black/40`}>
              <span className="bg-white text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                {STATUS_LABEL[status]}
              </span>
            </div>
          )}
          {/* Expiry */}
          {status === 'available' && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
              <Clock size={9} />
              {timeUntil(expiresAt)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-1 mb-1">
            <span className="text-[11px] text-gray-400 font-medium">
              {CATEGORY_EMOJI[category]} {category}
            </span>
            {isLow && (
              <span className="text-[10px] text-red-500 font-semibold shrink-0">
                Only {remaining} left!
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-0.5 line-clamp-2">
            {title}
          </h3>
          <p className="text-xs text-gray-400 mb-2 truncate">{businessName}</p>

          {/* Price row */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-bold text-brand-600">{formatPrice(price)}</span>
            {originalPrice && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(originalPrice)}</span>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatPickupWindow(pickupStartTime, pickupEndTime)}
            </span>
            {distance !== undefined && (
              <span className="flex items-center gap-1 ml-auto">
                <MapPin size={11} />
                {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
