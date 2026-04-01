import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User, Listing, Reservation, Allergen, ProviderStatus, ProviderType, AppMode, UserRole, ListingStatus, ReservationStatus, Category, CuisineTag, FoodCondition, SurpriseBoxSize, ProviderBadge } from '@/types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseEnabled = Boolean(
  url &&
  anonKey &&
  url !== 'https://your-project-ref.supabase.co' &&
  anonKey !== 'your-anon-key-here'
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(url!, anonKey!)
  : null;

// ── Converters ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbProfileToUser(row: any, authUser: { id: string; email?: string }): User {
  return {
    id: row.id,
    email: authUser.email ?? '',
    name: row.name,
    role: row.role as UserRole,
    currentMode: row.current_mode as AppMode,
    canProvide: row.can_provide,
    city: row.city ?? undefined,
    zipCode: row.zip_code ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    phone: row.phone ?? undefined,
    bio: row.bio ?? undefined,
    allergies: (row.allergies ?? []) as Allergen[],
    providerStatus: row.provider_status as ProviderStatus,
    providerType: row.provider_type as ProviderType ?? undefined,
    businessName: row.business_name ?? undefined,
    businessType: row.business_type ?? undefined,
    safetyPolicyAccepted: row.safety_policy_accepted,
    integrityPolicyAccepted: row.integrity_policy_accepted,
    foodSafetyAccepted: row.food_safety_accepted,
    waiverSigned: row.waiver_signed,
    waiverSignedAt: row.waiver_signed_at ?? undefined,
    isAdmin: row.is_admin ?? false,
    address: row.address ?? undefined,
    licenseNumber: row.license_number ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbListingToListing(row: any): Listing {
  return {
    id: row.id,
    providerId: row.provider_id,
    providerName: row.provider_name,
    businessName: row.business_name,
    businessType: row.business_type ?? undefined,
    title: row.title,
    description: row.description,
    category: row.category as Category,
    tags: (row.tags ?? []) as CuisineTag[],
    allergens: (row.allergens ?? []) as Allergen[],
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    quantity: row.quantity,
    quantityReserved: row.quantity_reserved,
    status: row.status as ListingStatus,
    pickupAddress: row.pickup_address,
    pickupCity: row.pickup_city,
    pickupZip: row.pickup_zip,
    pickupLat: row.pickup_lat != null ? Number(row.pickup_lat) : undefined,
    pickupLng: row.pickup_lng != null ? Number(row.pickup_lng) : undefined,
    pickupStartTime: row.pickup_start_time,
    pickupEndTime: row.pickup_end_time,
    pickupInstructions: row.pickup_instructions ?? undefined,
    imageUrl: row.image_url,
    isRescueBundle: row.is_rescue_bundle ?? undefined,
    isCommunityPantry: row.is_community_pantry ?? undefined,
    isSurpriseBox: row.is_surprise_box ?? undefined,
    surpriseBoxSize: row.surprise_box_size as SurpriseBoxSize ?? undefined,
    isDonation: row.is_donation ?? undefined,
    isEvent: row.is_event ?? undefined,
    eventDate: row.event_date ?? undefined,
    foodCondition: row.food_condition as FoodCondition ?? undefined,
    freshnessNote: row.freshness_note ?? undefined,
    preparedAt: row.prepared_at ?? undefined,
    handlingNotes: row.handling_notes ?? undefined,
    providerBadges: (row.provider_badges ?? []) as ProviderBadge[],
    isSample: row.is_sample ?? false,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export function listingToDb(listing: Omit<Listing, 'id' | 'createdAt' | 'quantityReserved' | 'status'>) {
  return {
    provider_id: listing.providerId,
    provider_name: listing.providerName,
    business_name: listing.businessName,
    business_type: listing.businessType ?? null,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    tags: listing.tags ?? [],
    allergens: listing.allergens ?? [],
    price: listing.price,
    original_price: listing.originalPrice ?? null,
    quantity: listing.quantity,
    quantity_reserved: 0,
    status: 'available',
    pickup_address: listing.pickupAddress,
    pickup_city: listing.pickupCity,
    pickup_zip: listing.pickupZip,
    pickup_lat: listing.pickupLat ?? null,
    pickup_lng: listing.pickupLng ?? null,
    pickup_start_time: listing.pickupStartTime,
    pickup_end_time: listing.pickupEndTime,
    pickup_instructions: listing.pickupInstructions ?? null,
    image_url: listing.imageUrl,
    is_rescue_bundle: listing.isRescueBundle ?? false,
    is_community_pantry: listing.isCommunityPantry ?? false,
    is_surprise_box: listing.isSurpriseBox ?? false,
    surprise_box_size: listing.surpriseBoxSize ?? null,
    is_donation: listing.isDonation ?? false,
    is_event: listing.isEvent ?? false,
    event_date: listing.eventDate ?? null,
    food_condition: listing.foodCondition ?? null,
    freshness_note: listing.freshnessNote ?? null,
    prepared_at: listing.preparedAt ?? null,
    handling_notes: listing.handlingNotes ?? null,
    provider_badges: listing.providerBadges ?? [],
    is_sample: false,
    expires_at: listing.expiresAt,
  };
}

export function profileDataToDb(data: Partial<User>): Record<string, unknown> {
  const fieldMap: Partial<Record<keyof User, string>> = {
    name: 'name',
    role: 'role',
    currentMode: 'current_mode',
    canProvide: 'can_provide',
    city: 'city',
    zipCode: 'zip_code',
    avatarUrl: 'avatar_url',
    phone: 'phone',
    bio: 'bio',
    allergies: 'allergies',
    providerStatus: 'provider_status',
    providerType: 'provider_type',
    businessName: 'business_name',
    businessType: 'business_type',
    safetyPolicyAccepted: 'safety_policy_accepted',
    integrityPolicyAccepted: 'integrity_policy_accepted',
    foodSafetyAccepted: 'food_safety_accepted',
    waiverSigned: 'waiver_signed',
    waiverSignedAt: 'waiver_signed_at',
    address: 'address',
    licenseNumber: 'license_number',
  };
  const result: Record<string, unknown> = {};
  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in data) result[col!] = (data as Record<string, unknown>)[key];
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbReservationToReservation(row: any): Reservation {
  return {
    id: row.id,
    listingId: row.listing_id,
    listing: row.listing_snapshot as Listing,
    consumerId: row.consumer_id,
    consumerName: row.consumer_name,
    quantity: row.quantity,
    totalPrice: Number(row.total_price),
    status: row.status as ReservationStatus,
    confirmationCode: row.confirmation_code,
    createdAt: row.created_at,
  };
}
