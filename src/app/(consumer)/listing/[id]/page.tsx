'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, MapPin, Clock, Store, ShoppingBag, Minus, Plus, CheckCircle, Share2, Gift
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import {
  formatPrice, discountPercent, formatPickupWindow, CATEGORY_EMOJI,
  STATUS_LABEL, timeUntil, cn, SURPRISE_BOX_LABELS, SURPRISE_BOX_DESCRIPTIONS,
} from '@/lib/utils';

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { getListing, reserveListing } = useData();
  const { user } = useAuth();

  const listing = getListing(params.id);
  const [qty, setQty] = useState(1);
  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState<{ code: string; total: number } | null>(null);

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 text-center">
        <div className="text-5xl mb-4">🍃</div>
        <h2 className="text-lg font-bold text-gray-800">Listing not found</h2>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const {
    title, businessName, businessType, description, category, tags, price, originalPrice,
    quantity, quantityReserved, status, pickupAddress, pickupCity, pickupZip,
    pickupStartTime, pickupEndTime, pickupInstructions, imageUrl, expiresAt, distance,
    isSurpriseBox, surpriseBoxSize,
  } = listing;

  const remaining = quantity - quantityReserved;
  const discount = originalPrice ? discountPercent(price, originalPrice) : null;
  const maxQty = Math.min(remaining, 5);
  const isAvailable = status === 'available' && remaining > 0;

  const handleReserve = async () => {
    if (!user || !isAvailable) return;
    setReserving(true);
    await new Promise((r) => setTimeout(r, 800));
    const res = reserveListing(listing, user.id, user.name, qty);
    setReserved({ code: res.confirmationCode, total: res.totalPrice });
    setReserving(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero image */}
      <div className="relative aspect-[4/3] bg-gray-100">
        <Image src={imageUrl} alt={title} fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>

        {/* Share */}
        <button className="absolute top-12 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
          <Share2 size={16} className="text-gray-700" />
        </button>

        {/* Surprise box / Discount */}
        {isSurpriseBox && surpriseBoxSize ? (
          <div className="absolute bottom-4 left-4 bg-purple-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Gift size={14} />
            {SURPRISE_BOX_LABELS[surpriseBoxSize]}
          </div>
        ) : discount ? (
          <div className="absolute bottom-4 left-4 bg-red-500 text-white text-sm font-bold px-2.5 py-1 rounded-xl">
            -{discount}% off
          </div>
        ) : null}

        {/* Timer */}
        {isAvailable && (
          <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
            <Clock size={11} />
            {timeUntil(expiresAt)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-5 pb-32">
        {/* Category + status */}
        <div className="flex flex-wrap gap-2 mb-3">
          {isSurpriseBox && (
            <Badge variant="purple">Surprise Box</Badge>
          )}
          <Badge>{CATEGORY_EMOJI[category]} {category}</Badge>
          {tags.map((tag) => (
            <Badge key={tag} variant="blue">{tag}</Badge>
          ))}
          {status !== 'available' && (
            <Badge variant={status === 'sold_out' ? 'gray' : 'red'}>
              {STATUS_LABEL[status]}
            </Badge>
          )}
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">{title}</h1>

        {/* Business */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
            <Store size={12} className="text-gray-400" />
          </div>
          <span className="text-sm text-gray-500">{businessName}</span>
          {businessType && (
            <span className="text-xs text-gray-300">·</span>
          )}
          {businessType && <span className="text-xs text-gray-400">{businessType}</span>}
        </div>

        {/* Price */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl font-extrabold text-brand-600">{formatPrice(price)}</span>
          {originalPrice && (
            <span className="text-base text-gray-400 line-through">{formatPrice(originalPrice)}</span>
          )}
          <span className="text-sm text-gray-400">per item</span>
        </div>

        {/* Description */}
        <div className="mb-5">
          {isSurpriseBox && surpriseBoxSize ? (
            <>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Surprise Box</h2>
              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Gift size={18} className="text-purple-500" />
                  <span className="text-sm font-semibold text-purple-700">{SURPRISE_BOX_LABELS[surpriseBoxSize]}</span>
                </div>
                <p className="text-sm text-purple-600 mb-2">
                  {SURPRISE_BOX_DESCRIPTIONS[surpriseBoxSize]}
                </p>
                <p className="text-xs text-purple-400">
                  Contents are a surprise! You won&apos;t know exactly what&apos;s inside until pickup.
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">About this listing</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </>
          )}
        </div>

        {/* Pickup info */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Pickup Details</h2>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
              <MapPin size={14} className="text-brand-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{pickupAddress}</p>
              <p className="text-xs text-gray-400">{pickupCity}, {pickupZip}</p>
              {distance !== undefined && (
                <p className="text-xs text-brand-600 mt-0.5">
                  {distance < 1 ? `${(distance * 1000).toFixed(0)}m away` : `${distance.toFixed(1)}km away`}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
              <Clock size={14} className="text-brand-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {formatPickupWindow(pickupStartTime, pickupEndTime)}
              </p>
              <p className="text-xs text-gray-400">Pickup window</p>
            </div>
          </div>

          {pickupInstructions && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-1">Instructions</p>
              <p className="text-sm text-gray-600">{pickupInstructions}</p>
            </div>
          )}
        </div>

        {/* Availability */}
        <div className="flex items-center justify-between bg-brand-50 rounded-xl px-4 py-3 mb-4">
          <span className="text-sm text-gray-600">Available</span>
          <span className="text-sm font-semibold text-brand-700">
            {remaining} of {quantity} remaining
          </span>
        </div>
      </div>

      {/* Sticky reserve bar */}
      {isAvailable && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-40">
          <div className="max-w-lg mx-auto flex items-center gap-4">
            {/* Quantity picker */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center disabled:opacity-40"
                disabled={qty <= 1}
              >
                <Minus size={14} className="text-gray-600" />
              </button>
              <span className="w-6 text-center text-sm font-semibold">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center disabled:opacity-40"
                disabled={qty >= maxQty}
              >
                <Plus size={14} className="text-gray-600" />
              </button>
            </div>

            <Button
              fullWidth
              size="lg"
              onClick={handleReserve}
              loading={reserving}
              className="gap-2"
            >
              <ShoppingBag size={18} />
              Reserve — {formatPrice(price * qty)}
            </Button>
          </div>
        </div>
      )}

      {!isAvailable && status !== 'available' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-40">
          <div className="max-w-lg mx-auto">
            <Button fullWidth size="lg" disabled className="bg-gray-100 text-gray-400 cursor-not-allowed">
              {STATUS_LABEL[status]}
            </Button>
          </div>
        </div>
      )}

      {/* Reservation success modal */}
      <Modal open={!!reserved} onClose={() => { setReserved(null); router.push('/reservations'); }}>
        <div className="text-center py-2">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-brand-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Reserved!</h2>
          <p className="text-sm text-gray-400 mb-5">
            Your reservation is confirmed. Show the code at pickup.
          </p>

          <div className="bg-gray-50 rounded-2xl px-6 py-4 mb-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Confirmation Code</p>
            <p className="text-2xl font-mono font-bold text-gray-900 tracking-widest">
              {reserved?.code}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left bg-brand-50 rounded-2xl p-4 mb-5">
            <div>
              <p className="text-xs text-gray-400">Pickup Window</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatPickupWindow(pickupStartTime, pickupEndTime)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Paid</p>
              <p className="text-sm font-semibold text-brand-600">
                {reserved && formatPrice(reserved.total)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-400">Location</p>
              <p className="text-sm font-semibold text-gray-800">{pickupAddress}, {pickupCity}</p>
            </div>
          </div>

          <Button
            fullWidth
            onClick={() => { setReserved(null); router.push('/reservations'); }}
          >
            View My Reservations
          </Button>
        </div>
      </Modal>
    </div>
  );
}
