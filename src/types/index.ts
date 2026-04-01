export type UserRole = 'consumer' | 'provider';

/** Which interface the user is currently viewing. Only approved providers can be in 'provider' mode. */
export type AppMode = 'consumer' | 'provider';

export type ProviderStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type ProviderType =
  | 'Restaurant'
  | 'Grocery Store'
  | 'Household';

export type Allergen =
  | 'peanuts'
  | 'tree-nuts'
  | 'dairy'
  | 'eggs'
  | 'shellfish'
  | 'soy'
  | 'gluten'
  | 'sesame';

export type Category =
  | 'Fruits'
  | 'Vegetables'
  | 'Baked Goods'
  | 'Meals'
  | 'Drinks'
  | 'Snacks'
  | 'Dairy'
  | 'Pantry Goods';

export type CuisineTag =
  | 'Chinese'
  | 'Indian'
  | 'Japanese'
  | 'Korean'
  | 'Western'
  | 'Mexican'
  | 'Thai'
  | 'Mediterranean';

export type ListingStatus = 'available' | 'reserved' | 'sold_out' | 'expired';

export type ReservationStatus = 'confirmed' | 'picked_up' | 'cancelled' | 'cancelled_at_pickup';

export type SurpriseBoxSize = 'small' | 'medium' | 'large';

export type FoodCondition = 'cooked' | 'uncooked' | 'packaged' | 'perishable' | 'raw' | 'frozen';

export interface User {
  id: string;
  email: string;
  name: string;
  /** Always 'consumer' — role is kept for legacy compat but the account model is neutral by default. */
  role: UserRole;
  /**
   * Which interface the user is currently viewing.
   * Defaults to 'consumer'. Can only be set to 'provider' when providerStatus === 'approved'.
   */
  currentMode?: AppMode;
  /** True when providerStatus === 'approved'. Convenience flag. */
  canProvide?: boolean;
  city?: string;
  zipCode?: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  allergies?: Allergen[];
  providerStatus?: ProviderStatus;
  providerType?: ProviderType;
  businessName?: string;
  businessType?: string;
  safetyPolicyAccepted?: boolean;
  integrityPolicyAccepted?: boolean;
  foodSafetyAccepted?: boolean;
  waiverSigned?: boolean;
  waiverSignedAt?: string;
  isAdmin?: boolean;
  address?: string;
  licenseNumber?: string;
}

export type ProviderBadge = 'verified' | 'top-rated' | 'fast-mover' | 'eco-champion' | 'health-certified';

export interface Listing {
  id: string;
  providerId: string;
  providerName: string;
  businessName: string;
  businessType?: string;
  title: string;
  description: string;
  category: Category;
  tags: CuisineTag[];
  allergens?: Allergen[];
  price: number;
  originalPrice?: number;
  quantity: number;
  quantityReserved: number;
  status: ListingStatus;
  pickupAddress: string;
  pickupCity: string;
  pickupZip: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupStartTime: string;
  pickupEndTime: string;
  pickupInstructions?: string;
  imageUrl: string;
  isRescueBundle?: boolean;
  isCommunityPantry?: boolean;
  isSurpriseBox?: boolean;
  surpriseBoxSize?: SurpriseBoxSize;
  /** If true, this listing is a free food donation to NGOs or community */
  isDonation?: boolean;
  /** If true, this is a special event surplus listing */
  isEvent?: boolean;
  eventDate?: string;
  foodCondition?: FoodCondition;
  freshnessNote?: string;
  preparedAt?: string;    // ISO datetime when food was prepared/listed
  handlingNotes?: string;
  createdAt: string;
  expiresAt: string;
  distance?: number;
  /** Provider badges earned */
  providerBadges?: ProviderBadge[];
  /** True when this listing comes from mock/sample data (not a real live listing). */
  isSample?: boolean;
}

export interface Reservation {
  id: string;
  listingId: string;
  listing: Listing;
  consumerId: string;
  consumerName: string;
  quantity: number;
  totalPrice: number;
  status: ReservationStatus;
  confirmationCode: string;
  createdAt: string;
}

export interface PantryItem {
  id: string;
  name: string;
  source: 'rescue' | 'manual';
  listingId?: string;
  addedAt: string;
  used: boolean;
}

export interface ListingFilters {
  query?: string;
  category?: Category | '';
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  tags?: CuisineTag[];
  excludeAllergens?: Allergen[];
}
