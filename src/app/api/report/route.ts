import { NextRequest, NextResponse } from 'next/server';
import { getProviderOrders } from '@/lib/mock-orders';
import { calculateAnalytics, buildReportPrompt } from '@/lib/analytics';

// Kimi AI config
const KIMI_API_KEY = 'sk-zgfw04mTqnw3pMS2qcqiuk8CQzyZB0KucyxgK1fsDkiMTW9B';
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_MODEL = 'moonshot-v1-8k';

// Fallback insights when API is unavailable
function generateFallbackInsights(providerName: string, analytics: ReturnType<typeof calculateAnalytics>) {
  const top = analytics.topItem;
  const peak = analytics.peakHour;
  const dailyMax = analytics.dailyRevenue.reduce((max, d) => (d.revenue > max.revenue ? d : max), analytics.dailyRevenue[0]);

  return {
    overview: `${providerName} generated $${analytics.totalRevenue.toFixed(2)} in total revenue across ${analytics.totalOrders} orders this week, selling ${analytics.totalItemsSold} items total. The average order value was $${analytics.averageOrderValue.toFixed(2)}.`,
    insights: [
      top ? `${top.name} is the top seller, generating $${top.revenue.toFixed(2)} in revenue from ${top.quantity} units sold.` : 'No item data available.',
      peak ? `Peak order time is ${peak.label}, with ${peak.orders} orders placed during that hour.` : 'Order timing data unavailable.',
      dailyMax ? `Best sales day was ${dailyMax.label} with $${dailyMax.revenue.toFixed(2)} in revenue.` : 'Daily data unavailable.',
      `Average order value of $${analytics.averageOrderValue.toFixed(2)} suggests customers are buying ${analytics.averageOrderValue > 10 ? 'multi-item orders' : 'single items on average'}.`,
    ],
    recommendations: [
      top ? `Consider increasing stock of ${top.name} during peak hours to capture more demand.` : 'Add more variety to your listings.',
      peak ? `Focus marketing and availability around ${peak.label} when customer demand is highest.` : 'Experiment with different pickup windows.',
    ],
  };
}

export async function GET(request: NextRequest) {
  const providerId = request.nextUrl.searchParams.get('providerId') || 'provider1';
  const providerName = request.nextUrl.searchParams.get('providerName') || 'Provider';

  const orders = getProviderOrders(providerId);
  const analytics = calculateAnalytics(orders);

  // Try to get AI-generated insights
  let aiReport;
  try {
    const prompt = buildReportPrompt(providerName, analytics);

    const res = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    if (!res.ok) throw new Error(`API status ${res.status}`);

    const data = await res.json();
    const text = data.choices[0].message.content.trim();

    // Parse the structured response
    const overviewMatch = text.match(/OVERVIEW:\s*([\s\S]*?)(?=\nINSIGHTS:)/i);
    const insightsMatch = text.match(/INSIGHTS:\s*([\s\S]*?)(?=\nRECOMMENDATIONS:)/i);
    const recsMatch = text.match(/RECOMMENDATIONS:\s*([\s\S]*?)$/i);

    const parseBullets = (s: string) =>
      s.split('\n').map((l) => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean);

    aiReport = {
      overview: overviewMatch ? overviewMatch[1].trim() : text.slice(0, 200),
      insights: insightsMatch ? parseBullets(insightsMatch[1]) : [],
      recommendations: recsMatch ? parseBullets(recsMatch[1]) : [],
    };

    // Fallback if parsing got empty results
    if (aiReport.insights.length === 0) {
      aiReport = generateFallbackInsights(providerName, analytics);
    }
  } catch (err) {
    console.error('AI report generation failed, using fallback:', err);
    aiReport = generateFallbackInsights(providerName, analytics);
  }

  return NextResponse.json({
    analytics,
    report: aiReport,
  });
}
