/**
 * Supabase client — returns null if env vars are not configured.
 * When null, the app falls back to localStorage-based mock mode.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fallback values allow the app to connect to the live DB on Vercel even without
// env vars configured in the dashboard. NEXT_PUBLIC_ anon keys are safe to embed
// client-side — they're already in the client JS bundle and protected by Supabase RLS.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'https://mankfjoscqgghddhhmnv.supabase.co';
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hbmtmam9zY3FnZ2hkZGhobW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDA0ODgsImV4cCI6MjA4ODU3NjQ4OH0.NTL1mifmxrS6jTOIu79ec661wkWO2HcOHcDRYPUSYdw';

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export const isSupabaseEnabled = Boolean(url && key);

// ─── DB row → app type converters ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbProfileToUser(authUser: any, profile: any) {
  return {
    id: authUser.id as string,
    email: authUser.email as string,
    name: (profile?.name ?? authUser.user_metadata?.name ?? 'User') as string,
    role: (profile?.role ?? 'consumer') as 'consumer' | 'provider',
    currentMode: (profile?.current_mode ?? 'consumer') as 'consumer' | 'provider',
    canProvide: (profile?.can_provide ?? false) as boolean,
    city: profile?.city as string | undefined,
    zipCode: profile?.zip_code as string | undefined,
    avatarUrl: profile?.avatar_url as string | undefined,
    phone: profile?.phone as string | undefined,
    bio: profile?.bio as string | undefined,
    allergies: (profile?.allergies ?? []) as string[],
    providerStatus: (profile?.provider_status ?? 'none') as
      | 'none'
      | 'pending'
      | 'approved'
      | 'rejected',
    providerType: profile?.provider_type as string | undefined,
    businessName: profile?.business_name as string | undefined,
    businessType: profile?.business_type as string | undefined,
    safetyPolicyAccepted: (profile?.safety_policy_accepted ?? false) as boolean,
    integrityPolicyAccepted: (profile?.integrity_policy_accepted ?? false) as boolean,
    foodSafetyAccepted: (profile?.food_safety_accepted ?? false) as boolean,
    waiverSigned: (profile?.waiver_signed ?? false) as boolean,
    waiverSignedAt: profile?.waiver_signed_at as string | undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbListingToListing(row: any) {
  return {
    id: row.id as string,
    providerId: row.provider_id as string,
    providerName: row.provider_name as string,
    businessName: row.business_name as string,
    businessType: row.business_type as string | undefined,
    title: row.title as string,
    description: row.description as string,
    category: row.category,
    tags: (row.tags ?? []),
    allergens: (row.allergens ?? []),
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    quantity: Number(row.quantity),
    quantityReserved: Number(row.quantity_reserved ?? 0),
    status: row.status,
    pickupAddress: row.pickup_address as string,
    pickupCity: row.pickup_city as string,
    pickupZip: row.pickup_zip as string,
    pickupLat: row.pickup_lat != null ? Number(row.pickup_lat) : undefined,
    pickupLng: row.pickup_lng != null ? Number(row.pickup_lng) : undefined,
    pickupStartTime: row.pickup_start_time as string,
    pickupEndTime: row.pickup_end_time as string,
    pickupInstructions: row.pickup_instructions as string | undefined,
    imageUrl: row.image_url as string,
    isRescueBundle: row.is_rescue_bundle as boolean | undefined,
    isCommunityPantry: row.is_community_pantry as boolean | undefined,
    isSurpriseBox: row.is_surprise_box as boolean | undefined,
    surpriseBoxSize: row.surprise_box_size,
    foodCondition: row.food_condition,
    freshnessNote: row.freshness_note as string | undefined,
    preparedAt: row.prepared_at as string | undefined,
    handlingNotes: row.handling_notes as string | undefined,
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
    isSample: false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function listingToDb(data: any): Record<string, unknown> {
  return {
    provider_id: data.providerId,
    provider_name: data.providerName,
    business_name: data.businessName,
    business_type: data.businessType ?? null,
    title: data.title,
    description: data.description,
    category: data.category,
    tags: data.tags ?? [],
    allergens: data.allergens ?? [],
    price: data.price,
    original_price: data.originalPrice ?? null,
    quantity: data.quantity,
    quantity_reserved: 0,
    status: 'available',
    pickup_address: data.pickupAddress,
    pickup_city: data.pickupCity,
    pickup_zip: data.pickupZip,
    pickup_lat: data.pickupLat ?? null,
    pickup_lng: data.pickupLng ?? null,
    pickup_start_time: data.pickupStartTime,
    pickup_end_time: data.pickupEndTime,
    pickup_instructions: data.pickupInstructions ?? null,
    image_url: data.imageUrl,
    is_rescue_bundle: data.isRescueBundle ?? false,
    is_community_pantry: data.isCommunityPantry ?? false,
    is_surprise_box: data.isSurpriseBox ?? false,
    surprise_box_size: data.surpriseBoxSize ?? null,
    food_condition: data.foodCondition ?? null,
    freshness_note: data.freshnessNote ?? null,
    prepared_at: data.preparedAt ?? null,
    handling_notes: data.handlingNotes ?? null,
    expires_at: data.expiresAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reservationToDb(data: any): Record<string, unknown> {
  return {
    listing_id: data.listingId,
    consumer_id: data.consumerId,
    consumer_name: data.consumerName,
    quantity: data.quantity,
    total_price: data.totalPrice,
    status: 'confirmed',
    confirmation_code: data.confirmationCode,
  };
}
