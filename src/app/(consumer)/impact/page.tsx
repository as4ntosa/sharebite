'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Leaf, TrendingUp, Award, Users, ShoppingBag, Flame, Info, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { formatPrice } from '@/lib/utils';

const MOCK_LEADERBOARD = [
  { name: 'Alex S.', kg: 14.2, meals: 28, badge: '🏆' },
  { name: 'Jamie L.', kg: 11.6, meals: 22, badge: '🥈' },
  { name: 'Priya M.', kg: 9.8, meals: 19, badge: '🥉' },
  { name: 'Devon K.', kg: 7.4, meals: 15, badge: '🌿' },
  { name: 'River T.', kg: 5.2, meals: 11, badge: '🌿' },
];

const PLATFORM_MEALS = 1284;
const PLATFORM_KG = PLATFORM_MEALS * 0.4;
const PLATFORM_CO2 = PLATFORM_KG * 2.0;
const PLATFORM_PROVIDERS = 47;

export default function ImpactPage() {
  const { user } = useAuth();
  const { getConsumerReservations } = useData();

  const reservations = user ? getConsumerReservations(user.id) : [];
  const pickedUp = reservations.filter((r) => r.status === 'picked_up');

  const personal = useMemo(() => {
    const meals = pickedUp.reduce((s, r) => s + r.quantity, 0);
    const kg = meals * 0.4;
    const co2 = kg * 2.0;
    const saved = pickedUp.reduce((s, r) => s + (r.listing.originalPrice ? (r.listing.originalPrice - r.listing.price) * r.quantity : 0), 0);
    return { meals, kg, co2, saved };
  }, [pickedUp]);

  const userEntry = personal.meals > 0
    ? { name: user?.name?.split(' ')[0] || 'You', kg: personal.kg, meals: personal.meals, badge: '🌱', isMe: true }
    : null;

  // Streak: count consecutive days with at least one pickup (mock: based on reservation dates)
  const streak = useMemo(() => {
    if (pickedUp.length === 0) return 0;
    const days = Array.from(new Set(pickedUp.map((r) => r.createdAt.split('T')[0]))).sort().reverse();
    let s = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1]);
      const curr = new Date(days[i]);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      if (diff <= 1) s++;
      else break;
    }
    return s;
  }, [pickedUp]);

  return (
    <div>
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2 mb-0.5">
          <Leaf size={20} className="text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">Food Rescue Impact</h1>
        </div>
        <p className="text-xs text-gray-400">See how NibbleNet is fighting food waste</p>
      </div>

      <div className="px-4 py-4 space-y-5 pb-28">
        {/* Personal stats */}
        {personal.meals > 0 ? (
          <div className="bg-gradient-to-br from-brand-600 to-brand-500 rounded-2xl p-5 text-white">
            <p className="text-xs font-semibold text-brand-100 uppercase tracking-wide mb-3">Your Impact</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-extrabold">{personal.kg.toFixed(1)}<span className="text-base font-semibold ml-1">kg</span></p>
                <p className="text-xs text-brand-200">food rescued</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold">{personal.co2.toFixed(1)}<span className="text-base font-semibold ml-1">kg</span></p>
                <p className="text-xs text-brand-200">CO₂ avoided</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold">{personal.meals}</p>
                <p className="text-xs text-brand-200">meals saved</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold">{formatPrice(personal.saved)}</p>
                <p className="text-xs text-brand-200">money saved</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 text-center">
            <div className="text-4xl mb-2">🌱</div>
            <p className="text-sm font-semibold text-brand-700 mb-1">Start your rescue journey</p>
            <p className="text-xs text-brand-500 mb-3">Reserve and pick up food to track your personal impact</p>
            <Link href="/home" className="text-xs font-bold text-brand-600 hover:underline">Browse listings →</Link>
          </div>
        )}

        {/* Streak */}
        {streak > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Flame size={20} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-700">{streak}-day rescue streak 🔥</p>
              <p className="text-xs text-amber-500">Keep it going — every pickup counts!</p>
            </div>
          </div>
        )}

        {/* Platform stats */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">NibbleNet Platform</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ShoppingBag, label: 'Meals Rescued', value: PLATFORM_MEALS.toLocaleString(), color: 'text-brand-600', bg: 'bg-brand-50' },
              { icon: Leaf, label: 'CO₂ Saved', value: `${(PLATFORM_CO2 / 1000).toFixed(1)}t`, color: 'text-green-600', bg: 'bg-green-50' },
              { icon: TrendingUp, label: 'Food Rescued', value: `${(PLATFORM_KG / 1000).toFixed(1)}t`, color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: Users, label: 'Active Providers', value: PLATFORM_PROVIDERS.toString(), color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl shadow-card p-4 text-center">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
                  <Icon size={16} className={color} />
                </div>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Equivalencies */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">What that CO₂ saving equals</p>
          <div className="space-y-2">
            {[
              { emoji: '🚗', text: `${Math.round(PLATFORM_CO2 / 0.21)} km not driven` },
              { emoji: '🌳', text: `${Math.round(PLATFORM_CO2 / 21)} trees planted equivalent` },
              { emoji: '💡', text: `${Math.round(PLATFORM_CO2 / 0.4)} hours of lighting saved` },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-center gap-2">
                <span className="text-base">{emoji}</span>
                <p className="text-xs text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* UN SDG alignment */}
        <div className="bg-white rounded-2xl shadow-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={14} className="text-blue-600" />
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">UN Sustainable Development Goals</p>
          </div>
          <div className="space-y-2">
            {[
              { num: 2, label: 'Zero Hunger', color: 'bg-yellow-500', desc: 'Every rescue diverts food from waste to someone who needs it.' },
              { num: 12, label: 'Responsible Consumption', color: 'bg-amber-500', desc: 'Food waste reduction is a direct lever on consumption patterns.' },
              { num: 13, label: 'Climate Action', color: 'bg-green-600', desc: 'Food waste accounts for ~8% of global GHG emissions. Every kg matters.' },
            ].map(({ num, label, color, desc }) => (
              <div key={num} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shrink-0 mt-0.5`}>
                  <span className="text-[11px] font-black text-white">{num}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">{label}</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CO₂ Methodology */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <Info size={13} className="text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">CO₂ Methodology</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                We apply <span className="font-semibold">2.0 kg CO₂e per kg of food waste avoided</span>, based on IPCC AR6 (2022) lifecycle food waste emissions data. Food weight is estimated at 0.4 kg per meal rescued. Figures are conservative and do not include transportation savings or packaging offsets.
              </p>
              <Link href="/partners" className="text-[11px] text-brand-600 font-semibold mt-1 inline-block hover:underline">
                Download methodology for grant reporting →
              </Link>
            </div>
          </div>
        </div>

        {/* Community leaderboard */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award size={14} className="text-amber-500" />
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Top Rescuers This Week</p>
          </div>
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            {[...MOCK_LEADERBOARD, ...(userEntry ? [{ ...userEntry, isMe: true }] : [])].slice(0, 5).map((entry, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 ${i < 4 ? 'border-b border-gray-50' : ''} ${'isMe' in entry && entry.isMe ? 'bg-brand-50' : ''}`}
              >
                <span className="text-base w-6 text-center">{entry.badge}</span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${'isMe' in entry && entry.isMe ? 'text-brand-700' : 'text-gray-800'}`}>
                    {entry.name} {'isMe' in entry && entry.isMe ? '(You)' : ''}
                  </p>
                  <p className="text-[11px] text-gray-400">{entry.meals} meals · {entry.kg.toFixed(1)} kg saved</p>
                </div>
                <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-brand-500 h-full rounded-full"
                    style={{ width: `${(entry.kg / MOCK_LEADERBOARD[0].kg) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
