export interface Order {
  order_id: number;
  provider_id: string;
  item_name: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

// Mock orders for provider1 (Golden Garden Restaurant)
// Spanning the last 7 days
const now = new Date();
const day = (daysAgo: number, hour: number, min: number = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

export const MOCK_ORDERS: Order[] = [
  // Today
  { order_id: 1,  provider_id: 'provider1', item_name: 'Mixed Dim Sum Bundle',     quantity: 3, price: 8,  total: 24, created_at: day(0, 10, 15) },
  { order_id: 2,  provider_id: 'provider1', item_name: 'Sushi Combo',              quantity: 1, price: 12, total: 12, created_at: day(0, 11, 30) },
  { order_id: 3,  provider_id: 'provider1', item_name: 'Green Tea Smoothie 3-Pack', quantity: 2, price: 5,  total: 10, created_at: day(0, 12, 0) },
  { order_id: 4,  provider_id: 'provider1', item_name: 'Chicken Tikka Masala Bowl', quantity: 2, price: 7,  total: 14, created_at: day(0, 12, 45) },
  { order_id: 5,  provider_id: 'provider1', item_name: 'Taco Box',                 quantity: 1, price: 6,  total: 6,  created_at: day(0, 13, 20) },

  // Yesterday
  { order_id: 6,  provider_id: 'provider1', item_name: 'Mixed Dim Sum Bundle',     quantity: 4, price: 8,  total: 32, created_at: day(1, 11, 0) },
  { order_id: 7,  provider_id: 'provider1', item_name: 'Sushi Combo',              quantity: 2, price: 12, total: 24, created_at: day(1, 12, 15) },
  { order_id: 8,  provider_id: 'provider1', item_name: 'Taco Box',                 quantity: 3, price: 6,  total: 18, created_at: day(1, 13, 0) },
  { order_id: 9,  provider_id: 'provider1', item_name: 'Chicken Tikka Masala Bowl', quantity: 1, price: 7,  total: 7,  created_at: day(1, 18, 30) },

  // 2 days ago
  { order_id: 10, provider_id: 'provider1', item_name: 'Mixed Dim Sum Bundle',     quantity: 2, price: 8,  total: 16, created_at: day(2, 10, 30) },
  { order_id: 11, provider_id: 'provider1', item_name: 'Green Tea Smoothie 3-Pack', quantity: 3, price: 5,  total: 15, created_at: day(2, 11, 45) },
  { order_id: 12, provider_id: 'provider1', item_name: 'Sushi Combo',              quantity: 1, price: 12, total: 12, created_at: day(2, 14, 0) },

  // 3 days ago
  { order_id: 13, provider_id: 'provider1', item_name: 'Taco Box',                 quantity: 2, price: 6,  total: 12, created_at: day(3, 11, 30) },
  { order_id: 14, provider_id: 'provider1', item_name: 'Mixed Dim Sum Bundle',     quantity: 1, price: 8,  total: 8,  created_at: day(3, 12, 0) },
  { order_id: 15, provider_id: 'provider1', item_name: 'Chicken Tikka Masala Bowl', quantity: 3, price: 7,  total: 21, created_at: day(3, 13, 15) },
  { order_id: 16, provider_id: 'provider1', item_name: 'Sushi Combo',              quantity: 2, price: 12, total: 24, created_at: day(3, 17, 0) },

  // 4 days ago
  { order_id: 17, provider_id: 'provider1', item_name: 'Green Tea Smoothie 3-Pack', quantity: 1, price: 5,  total: 5,  created_at: day(4, 10, 0) },
  { order_id: 18, provider_id: 'provider1', item_name: 'Mixed Dim Sum Bundle',     quantity: 3, price: 8,  total: 24, created_at: day(4, 12, 30) },
  { order_id: 19, provider_id: 'provider1', item_name: 'Taco Box',                 quantity: 1, price: 6,  total: 6,  created_at: day(4, 14, 45) },

  // 5 days ago
  { order_id: 20, provider_id: 'provider1', item_name: 'Sushi Combo',              quantity: 3, price: 12, total: 36, created_at: day(5, 11, 15) },
  { order_id: 21, provider_id: 'provider1', item_name: 'Mixed Dim Sum Bundle',     quantity: 2, price: 8,  total: 16, created_at: day(5, 12, 0) },
  { order_id: 22, provider_id: 'provider1', item_name: 'Chicken Tikka Masala Bowl', quantity: 2, price: 7,  total: 14, created_at: day(5, 13, 30) },

  // 6 days ago
  { order_id: 23, provider_id: 'provider1', item_name: 'Taco Box',                 quantity: 2, price: 6,  total: 12, created_at: day(6, 11, 0) },
  { order_id: 24, provider_id: 'provider1', item_name: 'Mixed Dim Sum Bundle',     quantity: 1, price: 8,  total: 8,  created_at: day(6, 12, 45) },
  { order_id: 25, provider_id: 'provider1', item_name: 'Green Tea Smoothie 3-Pack', quantity: 2, price: 5,  total: 10, created_at: day(6, 14, 0) },
  { order_id: 26, provider_id: 'provider1', item_name: 'Sushi Combo',              quantity: 1, price: 12, total: 12, created_at: day(6, 17, 30) },

  // Provider 2 orders (Sunrise Bakery)
  { order_id: 27, provider_id: 'provider2', item_name: 'Assorted Morning Pastry Box', quantity: 5, price: 6, total: 30, created_at: day(0, 9, 0) },
  { order_id: 28, provider_id: 'provider2', item_name: 'Mini Muffin Variety Pack',    quantity: 3, price: 3, total: 9,  created_at: day(0, 10, 30) },
  { order_id: 29, provider_id: 'provider2', item_name: 'Sourdough Loaf',              quantity: 2, price: 4, total: 8,  created_at: day(0, 11, 15) },
  { order_id: 30, provider_id: 'provider2', item_name: 'Assorted Morning Pastry Box', quantity: 3, price: 6, total: 18, created_at: day(1, 8, 45) },
  { order_id: 31, provider_id: 'provider2', item_name: 'Sourdough Loaf',              quantity: 4, price: 4, total: 16, created_at: day(1, 10, 0) },
  { order_id: 32, provider_id: 'provider2', item_name: 'Mini Muffin Variety Pack',    quantity: 6, price: 3, total: 18, created_at: day(2, 9, 30) },
  { order_id: 33, provider_id: 'provider2', item_name: 'Assorted Morning Pastry Box', quantity: 2, price: 6, total: 12, created_at: day(3, 8, 0) },
  { order_id: 34, provider_id: 'provider2', item_name: 'Sourdough Loaf',              quantity: 3, price: 4, total: 12, created_at: day(4, 10, 45) },
  { order_id: 35, provider_id: 'provider2', item_name: 'Surprise Bakery Box',         quantity: 4, price: 5, total: 20, created_at: day(5, 9, 15) },

  // Provider 3 orders (Fresh & Local Market)
  { order_id: 36, provider_id: 'provider3', item_name: 'Seasonal Fruit Bag',     quantity: 4, price: 4, total: 16, created_at: day(0, 10, 0) },
  { order_id: 37, provider_id: 'provider3', item_name: 'Mixed Greens & Veggie Pack', quantity: 3, price: 3, total: 9,  created_at: day(0, 11, 30) },
  { order_id: 38, provider_id: 'provider3', item_name: 'Cheese & Charcuterie Ends',  quantity: 1, price: 7, total: 7,  created_at: day(0, 14, 0) },
  { order_id: 39, provider_id: 'provider3', item_name: 'Snack Mix Pantry Bundle',    quantity: 2, price: 5, total: 10, created_at: day(1, 12, 15) },
  { order_id: 40, provider_id: 'provider3', item_name: 'Seasonal Fruit Bag',     quantity: 5, price: 4, total: 20, created_at: day(2, 10, 30) },
  { order_id: 41, provider_id: 'provider3', item_name: 'Surprise Grocery Haul',  quantity: 2, price: 18, total: 36, created_at: day(3, 11, 0) },
  { order_id: 42, provider_id: 'provider3', item_name: 'Mixed Greens & Veggie Pack', quantity: 4, price: 3, total: 12, created_at: day(4, 13, 0) },
];

export function getProviderOrders(providerId: string): Order[] {
  return MOCK_ORDERS.filter((o) => o.provider_id === providerId);
}
