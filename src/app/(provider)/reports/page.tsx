'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  DollarSign, ShoppingBag, TrendingUp, Package, Sparkles, BarChart3,
  Clock, ArrowLeft, RefreshCw, Lightbulb,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { formatPrice, cn } from '@/lib/utils';
import type { ProviderAnalytics } from '@/lib/analytics';

interface AIReport {
  overview: string;
  insights: string[];
  recommendations: string[];
}

interface ReportData {
  analytics: ProviderAnalytics;
  report: AIReport;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/report?providerId=${user.id}&providerName=${encodeURIComponent(user.businessName || user.name)}`
      );
      if (!res.ok) throw new Error('Failed to fetch report');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError('Could not load report. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Generating your sales report...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 text-center gap-3">
        <p className="text-sm text-gray-500">{error || 'Something went wrong.'}</p>
        <Button size="sm" onClick={fetchReport}>Try Again</Button>
      </div>
    );
  }

  const { analytics, report } = data;
  const maxDailyRevenue = Math.max(...analytics.dailyRevenue.map((d) => d.revenue), 1);
  const maxItemRevenue = Math.max(...analytics.itemPerformance.map((i) => i.revenue), 1);
  const maxHourlyOrders = Math.max(...analytics.hourlyDistribution.map((h) => h.orders), 1);

  return (
    <div className="px-4 pt-12 md:pt-0 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Sales Report</h1>
          <p className="text-xs text-gray-400">Last 7 days</p>
        </div>
        <button
          onClick={fetchReport}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100"
        >
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { icon: DollarSign, label: 'Revenue', value: formatPrice(analytics.totalRevenue), color: 'text-brand-600', bg: 'bg-brand-50' },
          { icon: ShoppingBag, label: 'Orders', value: String(analytics.totalOrders), color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Package, label: 'Items Sold', value: String(analytics.totalItemsSold), color: 'text-amber-600', bg: 'bg-amber-50' },
          { icon: TrendingUp, label: 'Avg Order', value: formatPrice(analytics.averageOrderValue), color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl shadow-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={15} className={color} />
              </div>
              <span className="text-xs text-gray-400">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* AI Overview */}
      <div className="bg-gradient-to-br from-brand-50 to-blue-50 rounded-2xl p-4 mb-5 border border-brand-100">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-brand-600" />
          <h2 className="text-sm font-semibold text-brand-700">AI Overview</h2>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{report.overview}</p>
      </div>

      {/* Revenue Chart (bar chart) */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Daily Revenue</h2>
        </div>
        <div className="flex items-end gap-2 h-32">
          {analytics.dailyRevenue.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-400 font-medium">
                ${d.revenue}
              </span>
              <div
                className="w-full bg-brand-500 rounded-t-md transition-all"
                style={{
                  height: `${Math.max((d.revenue / maxDailyRevenue) * 100, 4)}%`,
                  minHeight: 4,
                }}
              />
              <span className="text-[10px] text-gray-400">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Item Performance */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Item Performance</h2>
        </div>
        <div className="space-y-3">
          {analytics.itemPerformance.map((item, i) => (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700 truncate flex-1">
                  {i === 0 && <span className="text-amber-500 mr-1">★</span>}
                  {item.name}
                </span>
                <span className="text-xs text-gray-400 shrink-0 ml-2">
                  {item.quantity} sold · {formatPrice(item.revenue)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    i === 0 ? 'bg-brand-500' : i === 1 ? 'bg-brand-400' : 'bg-brand-300'
                  )}
                  style={{ width: `${(item.revenue / maxItemRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Peak Hours */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Order Times</h2>
        </div>
        <div className="flex items-end gap-1 h-20">
          {analytics.hourlyDistribution
            .filter((h) => h.hour >= 8 && h.hour <= 20)
            .map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'w-full rounded-t-sm transition-all',
                    h.orders > 0 ? 'bg-blue-400' : 'bg-gray-100'
                  )}
                  style={{
                    height: `${Math.max((h.orders / maxHourlyOrders) * 100, 6)}%`,
                    minHeight: 3,
                  }}
                />
                <span className="text-[8px] text-gray-400">{h.label}</span>
              </div>
            ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-purple-500" />
          <h2 className="text-sm font-semibold text-gray-700">AI Insights</h2>
        </div>
        <div className="space-y-2.5">
          {report.insights.map((insight, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={12} className="text-purple-500" />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={16} className="text-amber-600" />
          <h2 className="text-sm font-semibold text-amber-700">Recommendations</h2>
        </div>
        <div className="space-y-2.5">
          {report.recommendations.map((rec, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-amber-600">{i + 1}</span>
              </div>
              <p className="text-sm text-amber-800 leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
