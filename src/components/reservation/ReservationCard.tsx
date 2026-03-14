'use client';

import Image from 'next/image';
import { CheckCircle, Clock, XCircle, Package, ShieldCheck, Timer } from 'lucide-react';
import { Reservation } from '@/types';
import { formatPrice, formatPickupWindow, timeUntilMs } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ReservationCardProps {
  reservation: Reservation;
  onCancel?: (id: string) => void;
  onConfirmPickup?: (id: string) => void;
  onCancelAtPickup?: (id: string) => void;
}

const STATUS_ICON = {
  confirmed: CheckCircle,
  picked_up: Package,
  cancelled: XCircle,
  cancelled_at_pickup: XCircle,
};

const STATUS_COLOR = {
  confirmed: 'text-brand-600',
  picked_up: 'text-blue-500',
  cancelled: 'text-gray-400',
  cancelled_at_pickup: 'text-amber-500',
};

const STATUS_BG = {
  confirmed: 'bg-brand-50 border-brand-100',
  picked_up: 'bg-blue-50 border-blue-100',
  cancelled: 'bg-gray-50 border-gray-100',
  cancelled_at_pickup: 'bg-amber-50 border-amber-100',
};

const STATUS_LABEL = {
  confirmed: 'Confirmed',
  picked_up: 'Picked Up',
  cancelled: 'Cancelled',
  cancelled_at_pickup: 'Cancelled at Pickup',
};

export function ReservationCard({ reservation, onCancel, onConfirmPickup, onCancelAtPickup }: ReservationCardProps) {
  const { id, listing, quantity, totalPrice, status, confirmationCode, createdAt } = reservation;
  const Icon = STATUS_ICON[status];
  const date = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });

  // Pickup window countdown for confirmed reservations
  const pickupEndMs = status === 'confirmed'
    ? timeUntilMs(`${new Date().toISOString().split('T')[0]}T${listing.pickupEndTime}:00`)
    : null;
  const pickupWindowActive = pickupEndMs !== null && pickupEndMs > 0 && pickupEndMs < 7_200_000;
  const pickupCountdownLabel = pickupEndMs !== null && pickupEndMs > 0
    ? (() => {
        const h = Math.floor(pickupEndMs / 3_600_000);
        const m = Math.floor((pickupEndMs % 3_600_000) / 60_000);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
      })()
    : null;

  return (
    <div className={cn('rounded-2xl border p-4', STATUS_BG[status])}>
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
          <Image src={listing.imageUrl} alt={listing.title} fill className="object-cover" sizes="64px" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">
              {listing.title}
            </h3>
            <div className={cn('flex items-center gap-1 shrink-0', STATUS_COLOR[status])}>
              <Icon size={14} />
              <span className="text-xs font-medium">{STATUS_LABEL[status]}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-0.5 mb-2">{listing.businessName}</p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">{formatPrice(totalPrice)}</span>
            <span>Qty: {quantity}</span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatPickupWindow(listing.pickupStartTime, listing.pickupEndTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Pickup window countdown */}
      {pickupWindowActive && pickupCountdownLabel && (
        <div className="mt-2 flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          <Timer size={12} className="text-red-500 animate-pulse shrink-0" />
          <p className="text-xs text-red-700 font-semibold">
            Pickup window closes in <span className="font-bold">{pickupCountdownLabel}</span> — head over now!
          </p>
        </div>
      )}
      {status === 'confirmed' && pickupCountdownLabel && !pickupWindowActive && (
        <div className="mt-2 flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2">
          <Timer size={12} className="text-gray-400 shrink-0" />
          <p className="text-xs text-gray-500">
            Pickup window ends at <span className="font-medium">{listing.pickupEndTime}</span>
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-white/60 flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Confirmation</p>
          <p className="text-sm font-mono font-bold text-gray-800">{confirmationCode}</p>
          <p className="text-[10px] text-gray-400 mt-1">{date}</p>
          {status === 'confirmed' && onCancel && (
            <button
              onClick={() => onCancel(id)}
              className="text-xs text-red-500 hover:text-red-600 font-medium mt-1"
            >
              Cancel
            </button>
          )}
        </div>
        {/* QR code for confirmed reservations */}
        {status === 'confirmed' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=${encodeURIComponent(confirmationCode)}&margin=4`}
            alt={`QR code for ${confirmationCode}`}
            width={72}
            height={72}
            className="rounded-lg border border-gray-200 shrink-0"
          />
        )}
      </div>

      {/* Pickup action buttons — shown for confirmed reservations */}
      {status === 'confirmed' && (onConfirmPickup || onCancelAtPickup) && (
        <div className="mt-3 pt-3 border-t border-white/60 space-y-2">
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide flex items-center gap-1">
            <ShieldCheck size={11} className="text-brand-500" />
            At pickup
          </p>
          <div className="flex gap-2">
            {onConfirmPickup && (
              <button
                onClick={() => onConfirmPickup(id)}
                className="flex-1 text-xs font-semibold text-brand-700 bg-brand-100 hover:bg-brand-200 rounded-xl py-2 transition-colors"
              >
                ✓ Confirm Pickup
              </button>
            )}
            {onCancelAtPickup && (
              <button
                onClick={() => onCancelAtPickup(id)}
                className="flex-1 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-xl py-2 transition-colors"
              >
                Item doesn't match
              </button>
            )}
          </div>
        </div>
      )}

      {status === 'cancelled_at_pickup' && (
        <div className="mt-3 pt-3 border-t border-amber-200">
          <p className="text-xs text-amber-700 leading-relaxed">
            This reservation was cancelled at pickup because the item did not match the listing. No charge applies.
          </p>
        </div>
      )}
    </div>
  );
}
