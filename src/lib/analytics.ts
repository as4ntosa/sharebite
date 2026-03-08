import { Order } from './mock-orders';

export interface ItemPerformance {
  name: string;
  quantity: number;
  revenue: number;
  orders: number;
}

export interface DailyRevenue {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface HourlyDistribution {
  hour: number;
  label: string;
  orders: number;
}

export interface ProviderAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
  averageOrderValue: number;
  itemPerformance: ItemPerformance[];
  dailyRevenue: DailyRevenue[];
  hourlyDistribution: HourlyDistribution[];
  topItem: ItemPerformance | null;
  peakHour: HourlyDistribution | null;
}

export function calculateAnalytics(orders: Order[]): ProviderAnalytics {
  if (orders.length === 0) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalItemsSold: 0,
      averageOrderValue: 0,
      itemPerformance: [],
      dailyRevenue: [],
      hourlyDistribution: [],
      topItem: null,
      peakHour: null,
    };
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const totalItemsSold = orders.reduce((sum, o) => sum + o.quantity, 0);
  const averageOrderValue = totalRevenue / totalOrders;

  // Item performance
  const itemMap = new Map<string, ItemPerformance>();
  for (const o of orders) {
    const existing = itemMap.get(o.item_name);
    if (existing) {
      existing.quantity += o.quantity;
      existing.revenue += o.total;
      existing.orders += 1;
    } else {
      itemMap.set(o.item_name, {
        name: o.item_name,
        quantity: o.quantity,
        revenue: o.total,
        orders: 1,
      });
    }
  }
  const itemPerformance = Array.from(itemMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  );

  // Daily revenue (last 7 days)
  const dailyMap = new Map<string, DailyRevenue>();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dailyMap.set(key, {
      date: key,
      label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : dayNames[d.getDay()],
      revenue: 0,
      orders: 0,
    });
  }
  for (const o of orders) {
    const key = o.created_at.split('T')[0];
    const entry = dailyMap.get(key);
    if (entry) {
      entry.revenue += o.total;
      entry.orders += 1;
    }
  }
  const dailyRevenue = Array.from(dailyMap.values());

  // Hourly distribution
  const hourMap = new Map<number, HourlyDistribution>();
  for (let h = 6; h <= 22; h++) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    hourMap.set(h, { hour: h, label: `${hour12}${ampm}`, orders: 0 });
  }
  for (const o of orders) {
    const h = new Date(o.created_at).getHours();
    const entry = hourMap.get(h);
    if (entry) entry.orders += 1;
  }
  const hourlyDistribution = Array.from(hourMap.values());

  const topItem = itemPerformance[0] || null;
  const peakHour = hourlyDistribution.reduce(
    (max, h) => (h.orders > (max?.orders || 0) ? h : max),
    null as HourlyDistribution | null
  );

  return {
    totalRevenue,
    totalOrders,
    totalItemsSold,
    averageOrderValue,
    itemPerformance,
    dailyRevenue,
    hourlyDistribution,
    topItem,
    peakHour,
  };
}

// Build a prompt for AI report generation
export function buildReportPrompt(
  providerName: string,
  analytics: ProviderAnalytics
): string {
  const items = analytics.itemPerformance
    .map((i) => `  - ${i.name}: ${i.quantity} sold, $${i.revenue} revenue, ${i.orders} orders`)
    .join('\n');

  const daily = analytics.dailyRevenue
    .map((d) => `  - ${d.label} (${d.date}): $${d.revenue}, ${d.orders} orders`)
    .join('\n');

  const peak = analytics.peakHour
    ? `${analytics.peakHour.label} with ${analytics.peakHour.orders} orders`
    : 'N/A';

  return `You are a business analyst for NibbleNet, a food surplus marketplace.

Generate a concise sales report with AI insights for "${providerName}" based on the following 7-day data:

KEY METRICS:
- Total Revenue: $${analytics.totalRevenue.toFixed(2)}
- Total Orders: ${analytics.totalOrders}
- Items Sold: ${analytics.totalItemsSold}
- Average Order Value: $${analytics.averageOrderValue.toFixed(2)}
- Peak Hour: ${peak}

ITEM PERFORMANCE:
${items}

DAILY REVENUE (last 7 days):
${daily}

Please provide:
1. A brief OVERVIEW paragraph (2-3 sentences summarizing performance)
2. Exactly 4 KEY INSIGHTS as bullet points — specific, data-driven observations about trends, top sellers, timing patterns, or opportunities
3. Exactly 2 RECOMMENDATIONS as bullet points — actionable suggestions to improve sales

Format your response exactly as:
OVERVIEW:
[paragraph]

INSIGHTS:
- [insight 1]
- [insight 2]
- [insight 3]
- [insight 4]

RECOMMENDATIONS:
- [recommendation 1]
- [recommendation 2]

Keep it concise and professional. Use actual numbers from the data.`;
}
