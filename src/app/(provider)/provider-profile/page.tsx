'use client';

import { useState } from 'react';
import { LogOut, Edit3, Store, MapPin, Mail, Phone, ChevronRight, HelpCircle, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';

const BUSINESS_TYPES = ['Restaurant', 'Bakery', 'Cafe', 'Grocery / Market', 'Food Truck', 'Other'];

export default function ProviderProfilePage() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [businessType, setBusinessType] = useState(user?.businessType || '');
  const [city, setCity] = useState(user?.city || '');
  const [zipCode, setZipCode] = useState(user?.zipCode || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    updateProfile({ name, businessName, businessType, city, zipCode, phone, bio });
    setSaving(false);
    setEditOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (!user) return null;

  return (
    <div className="px-4 pt-12 md:pt-0 pb-8">
      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-4 text-center">
        <div className="w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl font-bold text-amber-600">
            {(user.businessName || user.name).charAt(0)}
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">{user.businessName || user.name}</h1>
        {user.businessType && (
          <p className="text-sm text-gray-400 mt-0.5">{user.businessType}</p>
        )}
        {user.bio && (
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">{user.bio}</p>
        )}
        <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium mt-3">
          <Store size={12} />
          Provider Account
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-4">
        {[
          { icon: Store, label: 'Owner', value: user.name },
          { icon: MapPin, label: 'Location', value: user.city ? `${user.city}, ${user.zipCode || ''}` : 'Not set' },
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

      {/* Actions */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-4">
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

      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl shadow-card hover:bg-red-50 text-red-500 transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
          <LogOut size={14} className="text-red-400" />
        </div>
        <span className="text-sm font-medium">Sign Out</span>
      </button>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Business Profile">
        <div className="space-y-3">
          <Input label="Your Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Business Type</p>
            <div className="grid grid-cols-2 gap-2">
              {BUSINESS_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBusinessType(type)}
                  className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors text-left ${
                    businessType === type
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input label="ZIP Code" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Textarea label="About your business" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          <Button fullWidth onClick={handleSave} loading={saving} className="mt-2">
            Save Changes
          </Button>
        </div>
      </Modal>
    </div>
  );
}
