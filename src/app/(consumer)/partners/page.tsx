'use client';

import Link from 'next/link';
import { Building2, Heart, Leaf, Globe, ArrowRight, CheckCircle, TrendingUp, Shield } from 'lucide-react';

const PARTNER_TYPES = [
  {
    icon: Building2,
    title: 'City & Government',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    desc: 'Embed NibbleNet into municipal food waste reduction programs. We provide anonymised impact data, CO₂ reports, and SDG-aligned metrics for grant reporting.',
    sdgs: ['SDG 2', 'SDG 11', 'SDG 12'],
    features: [
      'City-wide food rescue dashboards',
      'CO₂ & waste diversion reports',
      'Integration with local NGO networks',
      'Custom branding & white-label options',
    ],
  },
  {
    icon: Heart,
    title: 'NGOs & Food Banks',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
    desc: 'Connect directly with surplus food providers in your area. Our volunteer dispatch tools make coordinating last-minute rescues fast and frictionless.',
    sdgs: ['SDG 2', 'SDG 10'],
    features: [
      'Priority access to Rescue Feed',
      'Bulk reservation for distribution',
      'Volunteer dispatch tools',
      'Donation listing pipeline',
    ],
  },
  {
    icon: Building2,
    title: 'Corporate & Enterprise',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    desc: 'Meet your ESG targets and reduce canteen waste. NibbleNet helps corporate cafeterias list surplus, track impact, and engage employees in sustainability.',
    sdgs: ['SDG 12', 'SDG 13'],
    features: [
      'Employee food rescue perks',
      'ESG & sustainability reporting',
      'Canteen surplus auto-listing',
      'Branded employee impact cards',
    ],
  },
  {
    icon: Leaf,
    title: 'Universities & Campuses',
    color: 'text-brand-600',
    bg: 'bg-brand-50',
    border: 'border-brand-100',
    desc: 'Reduce dining hall waste and build a culture of food rescue on campus. Students earn impact points; providers reduce disposal costs.',
    sdgs: ['SDG 4', 'SDG 12'],
    features: [
      'Campus food rescue network',
      'Student impact leaderboards',
      'Dining hall surplus pipeline',
      'Green campus certification data',
    ],
  },
];

const IMPACT_STATS = [
  { value: '1,284', label: 'meals rescued', icon: '🍱' },
  { value: '1.0t', label: 'CO₂ avoided', icon: '🌍' },
  { value: '47', label: 'active providers', icon: '🏪' },
  { value: '3', label: 'partner cities', icon: '🏙️' },
];

const SDGS = [
  { num: 2, label: 'Zero Hunger', color: 'bg-yellow-500' },
  { num: 10, label: 'Reduced Inequalities', color: 'bg-pink-500' },
  { num: 11, label: 'Sustainable Cities', color: 'bg-orange-500' },
  { num: 12, label: 'Responsible Consumption', color: 'bg-amber-500' },
  { num: 13, label: 'Climate Action', color: 'bg-green-600' },
];

export default function PartnersPage() {
  return (
    <div>
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2 mb-0.5">
          <Globe size={20} className="text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">Partner With Us</h1>
        </div>
        <p className="text-xs text-gray-400">Cities, NGOs, and enterprises fighting food waste together</p>
      </div>

      <div className="px-4 py-4 pb-28 space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-500 rounded-2xl p-5 text-white">
          <p className="text-xs font-semibold text-brand-100 uppercase tracking-wide mb-2">Our Mission</p>
          <h2 className="text-lg font-bold mb-2 leading-snug">
            Building the infrastructure for a zero food waste future
          </h2>
          <p className="text-sm text-brand-100 leading-relaxed">
            NibbleNet connects surplus food with people who need it — at scale. We partner with cities, NGOs, campuses, and corporations to make food rescue the default, not the exception.
          </p>
        </div>

        {/* Impact stats */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Platform Impact</p>
          <div className="grid grid-cols-2 gap-3">
            {IMPACT_STATS.map(({ value, label, icon }) => (
              <div key={label} className="bg-white rounded-2xl shadow-card p-4 text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* UN SDG alignment */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} className="text-blue-600" />
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">UN SDG Alignment</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SDGS.map(({ num, label, color }) => (
              <div key={num} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2">
                <div className={`w-5 h-5 rounded-md ${color} flex items-center justify-center shrink-0`}>
                  <span className="text-[9px] font-black text-white">{num}</span>
                </div>
                <span className="text-[11px] font-medium text-gray-700">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
            Our CO₂ methodology follows IPCC AR6 guidelines (2.0 kg CO₂e per kg food waste avoided). Impact data is available in machine-readable format for grant reporting.
          </p>
        </div>

        {/* Partner types */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Partnership Programs</p>
          {PARTNER_TYPES.map(({ icon: Icon, title, color, bg, border, desc, sdgs, features }) => (
            <div key={title} className={`bg-white rounded-2xl shadow-card border ${border} overflow-hidden`}>
              <div className={`${bg} px-4 py-3 flex items-center gap-3`}>
                <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm`}>
                  <Icon size={18} className={color} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${color}`}>{title}</p>
                  <div className="flex gap-1 mt-0.5">
                    {sdgs.map((s) => (
                      <span key={s} className="text-[9px] font-bold bg-white/70 text-gray-600 px-1.5 py-0.5 rounded-full border border-gray-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-4 py-4">
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{desc}</p>
                <div className="space-y-1.5">
                  {features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle size={12} className={color} />
                      <span className="text-xs text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Why partner */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-brand-600" />
            <p className="text-sm font-semibold text-gray-800">Why NibbleNet?</p>
          </div>
          <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
            <p>🌏 <span className="font-semibold">Real impact, real data.</span> Every rescue is logged, every kg of CO₂ is calculated, every meal is counted — and it's all auditable.</p>
            <p>⚡ <span className="font-semibold">Zero friction onboarding.</span> Providers list surplus in under 2 minutes. Consumers pick up in one tap. No app installs required.</p>
            <p>🔒 <span className="font-semibold">Built for compliance.</span> Food safety waivers, inspection rights, and allergen disclosure are baked in from day one.</p>
            <p>🤝 <span className="font-semibold">Community-first.</span> Our platform is designed around community trust — not growth hacking. We grow by doing good.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-brand-600 rounded-2xl p-5 text-white text-center">
          <p className="text-base font-bold mb-1">Ready to partner?</p>
          <p className="text-xs text-brand-100 mb-4">Join the cities and organizations already fighting food waste with NibbleNet.</p>
          <Link
            href="mailto:partnerships@nibblenet.app"
            className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-brand-50 transition-colors"
          >
            Get in touch <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
