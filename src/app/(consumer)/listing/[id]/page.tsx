'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, MapPin, Clock, Store, ShoppingBag, Minus, Plus, CheckCircle, Share2, ShieldCheck, AlertTriangle, Flag, Navigation, Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import {
  formatPrice, discountPercent, formatPickupWindow, CATEGORY_EMOJI,
  STATUS_LABEL, timeUntil, cn, ALLERGEN_LABEL,
  haversineKm, formatDistance, formatFoodAge, FOOD_CONDITION_LABEL, FOOD_CONDITION_COLOR, FOOD_CONDITION_ICON,
} from '@/lib/utils';
import { PickupMap } from '@/components/map/PickupMap';
import { useGeolocation } from '@/hooks/useGeolocation';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getListing, reserveListing } = useData();
  const { user } = useAuth();

  const listing = getListing(id);
  const { coords, status: geoStatus, request: requestLocation } = useGeolocation();
  const liveDistance =
    coords && listing?.pickupLat != null && listing?.pickupLng != null
      ? haversineKm(coords.latitude, coords.longitude, listing.pickupLat, listing.pickupLng)
      : listing?.distance ?? null;
  const [qty, setQty] = useState(1);
  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState<{ code: string; total: number } | null>(null);
  const [reported, setReported] = useState(false);

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
    title, businessName, businessType, description, category, tags, allergens, price, originalPrice,
    quantity, quantityReserved, status, pickupAddress, pickupCity, pickupZip,
    pickupStartTime, pickupEndTime, pickupInstructions, imageUrl, expiresAt, distance,
    isRescueBundle, isSurpriseBox, surpriseBoxSize,
    foodCondition, freshnessNote, preparedAt, handlingNotes,
  } = listing;

  const remaining = quantity - quantityReserved;
  const discount = originalPrice ? discountPercent(price, originalPrice) : null;
  const maxQty = Math.min(remaining, 5);
  const isAvailable = status === 'available' && remaining > 0;

  const handleReserve = async () => {
    if (!user || !isAvailable) return;
    setReserving(true);
    try {
      const res = await reserveListing(listing, user.id, user.name, qty);
      setReserved({ code: res.confirmationCode, total: res.totalPrice });
    } finally {
      setReserving(false);
    }
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

        {/* Discount */}
        {discount && (
          <div className="absolute bottom-4 left-4 bg-red-500 text-white text-sm font-bold px-2.5 py-1 rounded-xl">
            -{discount}% off
          </div>
        )}

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
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Store size={12} className="text-gray-400" />
          </div>
          <span className="text-sm text-gray-500">{businessName}</span>
          {businessType && (
            <span className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
              businessType === 'Restaurant' ? 'bg-orange-50 text-orange-600' :
              businessType === 'Bakery' ? 'bg-amber-50 text-amber-600' :
              businessType === 'Grocery' ? 'bg-green-50 text-green-700' :
              businessType === 'Household' ? 'bg-purple-50 text-purple-600' :
              businessType === 'Market' ? 'bg-teal-50 text-teal-600' :
              'bg-gray-100 text-gray-500'
            )}>
              {businessType}
            </span>
          )}
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
          <h2 className="text-sm font-semibold text-gray-700 mb-2">About this listing</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>

        {/* Food Details section — shown first so consumers know what they're getting */}
        {(foodCondition || freshnessNote || preparedAt || handlingNotes) && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Info size={14} className="text-gray-400" />
              Food Details
            </h2>

            {/* Condition badge */}
            {foodCondition && (
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${FOOD_CONDITION_COLOR[foodCondition]}`}>
                  <span>{FOOD_CONDITION_ICON[foodCondition]}</span>
                  {FOOD_CONDITION_LABEL[foodCondition]}
                </span>
              </div>
            )}

            {/* Prepared time / food age */}
            {preparedAt && (
              <div className="flex items-start gap-2.5">
                <Clock size={13} className="text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-600">Prepared</p>
                  <p className="text-sm text-gray-700">{formatFoodAge(preparedAt)}</p>
                </div>
              </div>
            )}

            {/* Freshness note */}
            {freshnessNote && (
              <div className="flex items-start gap-2.5">
                <span className="text-sm shrink-0 mt-0.5">🌿</span>
                <div>
                  <p className="text-xs font-semibold text-gray-600">Freshness</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{freshnessNote}</p>
                </div>
              </div>
            )}

            {/* Handling notes */}
            {handlingNotes && (
              <div className="flex items-start gap-2.5 pt-2 border-t border-gray-200">
                <span className="text-sm shrink-0 mt-0.5">📋</span>
                <div>
                  <p className="text-xs font-semibold text-gray-600">Storage & Handling</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{handlingNotes}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pickup info */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Pickup Details</h2>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
              <MapPin size={14} className="text-brand-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{pickupAddress}</p>
              <p className="text-xs text-gray-400">{pickupCity}, {pickupZip}</p>
              {/* Live distance — updates when geolocation changes */}
              {liveDistance !== null ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <Navigation size={11} className="text-brand-600 fill-brand-600 shrink-0" />
                  <span className="text-xs font-semibold text-brand-600">
                    {formatDistance(liveDistance)} from your location
                  </span>
                  {geoStatus === 'idle' && (
                    <button
                      onClick={requestLocation}
                      className="text-[10px] text-gray-400 underline hover:text-gray-600"
                    >
                      Update
                    </button>
                  )}
                </div>
              ) : (
                geoStatus === 'idle' && (
                  <button
                    onClick={requestLocation}
                    className="flex items-center gap-1 text-xs text-brand-600 mt-1 hover:underline"
                  >
                    <Navigation size={11} />
                    Show distance from me
                  </button>
                )
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

          {/* Get Directions button */}
          {listing.pickupLat != null && listing.pickupLng != null && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${listing.pickupLat},${listing.pickupLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              <Navigation size={15} />
              Get Directions
            </a>
          )}

          {/* Pickup location map — shows user pin + provider pin when location is granted */}
          {listing.pickupLat != null && listing.pickupLng != null && (
            <PickupMap
              lat={listing.pickupLat}
              lng={listing.pickupLng}
              address={`${pickupAddress}, ${pickupCity}`}
              userLat={coords?.latitude}
              userLng={coords?.longitude}
              interactive
              height={220}
            />
          )}
        </div>

        {/* Availability */}
        <div className="flex items-center justify-between bg-brand-50 rounded-xl px-4 py-3 mb-4">
          <span className="text-sm text-gray-600">Available</span>
          <span className="text-sm font-semibold text-brand-700">
            {remaining} of {quantity} remaining
          </span>
        </div>

        {/* Rescue / surprise box notice */}
        {(isRescueBundle || isSurpriseBox) && (
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold text-brand-700 mb-1">
              🎁 {isSurpriseBox ? `Mystery ${surpriseBoxSize === 'small' ? 'Small' : surpriseBoxSize === 'medium' ? 'Medium' : 'Large'} Box` : 'Rescue Bundle'}
            </p>
            <p className="text-xs text-brand-600 leading-relaxed">
              This is a mystery surplus box — exact contents vary. All allergens are disclosed below. You have the right to inspect the contents at pickup before accepting.
            </p>
          </div>
        )}

        {/* Allergen information */}
        {allergens && allergens.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs font-bold text-red-700">Contains Allergens</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allergens.map((a) => (
                <span key={a} className="text-xs font-semibold bg-white text-red-600 border border-red-200 px-2 py-0.5 rounded-lg">
                  {ALLERGEN_LABEL[a]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pickup inspection rights */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-2">
            <ShieldCheck size={14} className="text-brand-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Your pickup rights</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                You have the right to inspect this item at pickup. If it doesn't match the listing or appears unsafe, you may cancel on-site at no charge. Providers are required to accept this.
              </p>
            </div>
          </div>
        </div>

        {/* Report listing */}
        <div className="text-center pb-4">
          {reported ? (
            <p className="text-xs text-gray-400">Report received — our team will review this listing.</p>
          ) : (
            <button
              onClick={() => setReported(true)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors mx-auto"
            >
              <Flag size={12} />
              Report this listing
            </button>
          )}
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

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-left">
            <ShieldCheck size={13} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              You may inspect this item at pickup. If it doesn't match the listing, you can cancel on-site at no charge.
            </p>
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
