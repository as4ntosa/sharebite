'use client';

import { useState } from 'react';
import { LogOut, ChevronRight, MapPin, Mail, Phone, Edit3, Store, HelpCircle, Bell, AlertCircle, Clock, ArrowLeftRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { Allergen } from '@/types';
import { ALLERGENS, ALLERGEN_LABEL, cn } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateProfile, switchMode } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [allergyOpen, setAllergyOpen] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState(user?.city || '');
  const [zipCode, setZipCode] = useState(user?.zipCode || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [selectedAllergies, setSelectedAllergies] = useState<Allergen[]>(user?.allergies || []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    updateProfile({ name, city, zipCode, phone });
    setSaving(false);
    setEditOpen(false);
  };

  const handleSaveAllergies = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    updateProfile({ allergies: selectedAllergies });
    setSaving(false);
    setAllergyOpen(false);
  };

  const toggleAllergen = (a: Allergen) => {
    setSelectedAllergies((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (!user) return null;

  const providerStatus = user.providerStatus ?? 'none';

  return (
    <div>
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-6 text-center">
        <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl font-bold text-brand-600">{user.name.charAt(0)}</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-medium">
            NibbleNet Member
          </span>
          {providerStatus === 'approved' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
              Approved Provider
            </span>
          )}
          {providerStatus === 'pending' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
              <Clock size={10} />
              Provider Pending
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pb-6 space-y-4">
        {/* Info card */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {[
            { icon: MapPin, label: 'Location', value: user.city ? `${user.city}${user.zipCode ? `, ${user.zipCode}` : ''}` : 'Not set' },
            { icon: Mail, label: 'Email', value: user.email },
            { icon: Phone, label: 'Phone', value: user.phone || 'Not set' },
          ].map(({ icon: Icon, label, value }, i) => (
            <div key={label} className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Icon size={14} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Allergy profile */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <button
            onClick={() => { setSelectedAllergies(user.allergies || []); setAllergyOpen(true); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <AlertCircle size={14} className="text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-700">Allergy & Sensitivity Profile</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {user.allergies && user.allergies.length > 0
                  ? user.allergies.map((a) => ALLERGEN_LABEL[a]).join(', ')
                  : 'None set — tap to configure'}
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {[
            { icon: Edit3, label: 'Edit Profile', onClick: () => setEditOpen(true) },
            { icon: Bell, label: 'Notifications', onClick: () => {} },
            { icon: HelpCircle, label: 'Help & Support', onClick: () => {} },
          ].map(({ icon: Icon, label, onClick }, i) => (
            <button
              key={label}
              onClick={onClick}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${i > 0 ? 'border-t border-gray-50' : ''}`}
            >
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Icon size={14} className="text-gray-400" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-700 text-left">{label}</span>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          ))}
        </div>

        {/* Provider section */}
        {providerStatus === 'none' && (
          <Link href="/become-a-provider">
            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Store size={18} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Have food to share?</p>
                <p className="text-xs text-gray-500 mt-0.5">Apply to become an approved NibbleNet provider</p>
              </div>
              <ChevronRight size={16} className="text-amber-400" />
            </div>
          </Link>
        )}

        {providerStatus === 'pending' && (
          <Link href="/provider-pending">
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Clock size={18} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Application Under Review</p>
                <p className="text-xs text-gray-500 mt-0.5">Tap to check your provider approval status</p>
              </div>
              <ChevronRight size={16} className="text-blue-400" />
            </div>
          </Link>
        )}

        {/* Mode switcher card — only for approved providers */}
        {providerStatus === 'approved' && (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-4 pt-3.5 pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Account Mode</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Your account gives you both consumer and provider access. Switch modes to change which tools are shown.
              </p>
            </div>

            {/* Consumer mode option */}
            <button
              onClick={() => { switchMode('consumer'); router.replace('/home'); }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 border-t border-gray-50 transition-colors',
                user?.currentMode !== 'provider' ? 'bg-brand-50' : 'hover:bg-gray-50'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                user?.currentMode !== 'provider' ? 'bg-brand-100' : 'bg-gray-100'
              )}>
                <ShoppingBag size={14} className={user?.currentMode !== 'provider' ? 'text-brand-600' : 'text-gray-400'} />
              </div>
              <div className="flex-1 text-left">
                <p className={cn('text-sm font-medium', user?.currentMode !== 'provider' ? 'text-brand-700' : 'text-gray-700')}>Consumer Mode</p>
                <p className="text-xs text-gray-400">Browse, search, and reserve food</p>
              </div>
              {user?.currentMode !== 'provider' && (
                <span className="text-[10px] font-bold text-brand-600 bg-brand-100 px-2 py-0.5 rounded-full">Active</span>
              )}
            </button>

            {/* Provider mode option */}
            <button
              onClick={() => { switchMode('provider'); router.replace('/dashboard'); }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 border-t border-gray-50 transition-colors',
                user?.currentMode === 'provider' ? 'bg-amber-50' : 'hover:bg-gray-50'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                user?.currentMode === 'provider' ? 'bg-amber-100' : 'bg-gray-100'
              )}>
                <Store size={14} className={user?.currentMode === 'provider' ? 'text-amber-600' : 'text-gray-400'} />
              </div>
              <div className="flex-1 text-left">
                <p className={cn('text-sm font-medium', user?.currentMode === 'provider' ? 'text-amber-700' : 'text-gray-700')}>Provider Mode</p>
                <p className="text-xs text-gray-400">Manage listings and provider dashboard</p>
              </div>
              {user?.currentMode === 'provider' && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Active</span>
              )}
            </button>
          </div>
        )}

        {/* Admin Panel — only visible to admins */}
        {user.isAdmin && (
          <Link href="/admin">
            <div className="bg-white rounded-2xl shadow-card flex items-center gap-3 px-4 py-3.5 hover:bg-purple-50 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={14} className="text-purple-600" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-700">Admin Panel</span>
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl shadow-card hover:bg-red-50 text-red-500 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
            <LogOut size={14} className="text-red-400" />
          </div>
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <div className="space-y-3">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input label="ZIP Code" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button fullWidth onClick={handleSave} loading={saving} className="mt-2">
            Save Changes
          </Button>
        </div>
      </Modal>

      {/* Allergy Profile Modal */}
      <Modal open={allergyOpen} onClose={() => setAllergyOpen(false)} title="Allergy & Sensitivity Profile">
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Select any allergens. Listings containing these will be automatically hidden from your home feed.
            You can still find them via search.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ALLERGENS.map((a) => (
              <button
                key={a}
                onClick={() => toggleAllergen(a as Allergen)}
                className={cn(
                  'px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left',
                  selectedAllergies.includes(a as Allergen)
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                )}
              >
                {ALLERGEN_LABEL[a]}
              </button>
            ))}
          </div>
          <Button fullWidth onClick={handleSaveAllergies} loading={saving}>
            Save Preferences
          </Button>
        </div>
      </Modal>
    </div>
  );
}
