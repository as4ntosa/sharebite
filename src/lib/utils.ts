import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Category, FoodCondition, ListingStatus, SurpriseBoxSize } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function discountPercent(price: number, original: number): number {
  return Math.round(((original - price) / original) * 100);
}

export function formatPickupWindow(start: string, end: string): string {
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

export function timeUntil(isoString: string): string {
  const ms = new Date(isoString).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function generateCode(): string {
  return Math.random().toString(36).toUpperCase().slice(2, 8);
}

export const CATEGORIES: Category[] = [
  'Meals',
  'Baked Goods',
  'Fruits',
  'Vegetables',
  'Drinks',
  'Snacks',
  'Dairy',
  'Pantry Goods',
];

export const CUISINE_TAGS = [
  'Chinese',
  'Indian',
  'Japanese',
  'Korean',
  'Western',
  'Mexican',
  'Thai',
  'Mediterranean',
] as const;

export const CATEGORY_EMOJI: Record<Category, string> = {
  Meals: '🍱',
  'Baked Goods': '🥐',
  Fruits: '🍎',
  Vegetables: '🥦',
  Drinks: '🧃',
  Snacks: '🍿',
  Dairy: '🧀',
  'Pantry Goods': '🫙',
};

export const STATUS_LABEL: Record<ListingStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold_out: 'Sold Out',
  expired: 'Expired',
};

export const STATUS_COLOR: Record<ListingStatus, string> = {
  available: 'bg-brand-100 text-brand-700',
  reserved: 'bg-amber-100 text-amber-700',
  sold_out: 'bg-gray-100 text-gray-500',
  expired: 'bg-red-100 text-red-500',
};

export const ALLERGENS = [
  'peanuts',
  'tree-nuts',
  'dairy',
  'eggs',
  'shellfish',
  'soy',
  'gluten',
  'sesame',
] as const;

export const ALLERGEN_LABEL: Record<string, string> = {
  peanuts: 'Peanuts',
  'tree-nuts': 'Tree Nuts',
  dairy: 'Dairy',
  eggs: 'Eggs',
  shellfish: 'Shellfish',
  soy: 'Soy',
  gluten: 'Gluten',
  sesame: 'Sesame',
};

export const SURPRISE_BOX_SIZES: SurpriseBoxSize[] = ['small', 'medium', 'large'];

export const SURPRISE_BOX_LABELS: Record<SurpriseBoxSize, string> = {
  small: 'Small Box',
  medium: 'Medium Box',
  large: 'Large Box',
};

export const SURPRISE_BOX_PRICES: Record<SurpriseBoxSize, number> = {
  small: 5,
  medium: 10,
  large: 18,
};

export const SURPRISE_BOX_DESCRIPTIONS: Record<SurpriseBoxSize, string> = {
  small: '1–2 items, perfect for a snack or single meal',
  medium: '3–5 items, great for a full meal or small family',
  large: '6+ items, feeds a family or stocks the fridge',
};

export function formatFoodAge(preparedAt: string): string {
  const ms = Date.now() - new Date(preparedAt).getTime();
  if (ms < 0) return 'Just prepared';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 48) return `${Math.floor(h / 24)} days ago`;
  if (h >= 24) return 'Yesterday';
  if (h > 0) return `${h}h ${m}m ago`;
  return `${m}m ago`;
}

export function formatDistance(km: number): string {
  if (km < 0.1) return 'Nearby';
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  return `${km.toFixed(1)} km`;
}

export const FOOD_CONDITION_LABEL: Record<FoodCondition, string> = {
  cooked: 'Cooked',
  uncooked: 'Uncooked',
  packaged: 'Packaged',
  perishable: 'Perishable',
  raw: 'Raw / Uncooked',
  frozen: 'Frozen',
};

export const FOOD_CONDITION_COLOR: Record<FoodCondition, string> = {
  cooked: 'bg-orange-50 text-orange-700 border-orange-200',
  uncooked: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  packaged: 'bg-blue-50 text-blue-700 border-blue-200',
  perishable: 'bg-red-50 text-red-700 border-red-200',
  raw: 'bg-amber-50 text-amber-700 border-amber-200',
  frozen: 'bg-sky-50 text-sky-700 border-sky-200',
};

export const FOOD_CONDITION_ICON: Record<FoodCondition, string> = {
  cooked: '🍳',
  uncooked: '🥩',
  packaged: '📦',
  perishable: '⏱️',
  raw: '🥬',
  frozen: '🧊',
};
