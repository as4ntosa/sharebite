export type UserRole = 'consumer' | 'provider';

export type ProviderStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type ProviderType =
  | 'Restaurant'
  | 'Grocery Store'
  | 'Bakery / Cafe'
  | 'Household'
  | 'Other Food Business';

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

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
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
}

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
  createdAt: string;
  expiresAt: string;
  distance?: number;
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

export interface ListingFilters {
  query?: string;
  category?: Category | '';
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  tags?: CuisineTag[];
  excludeAllergens?: Allergen[];
}
