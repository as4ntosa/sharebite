'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, ShieldCheck, FileText, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { ProviderType } from '@/types';
import { cn } from '@/lib/utils';

type Step = 'type' | 'verification' | 'integrity' | 'food-safety';

const PROVIDER_TYPES: { value: ProviderType; emoji: string; desc: string }[] = [
  { value: 'Restaurant', emoji: '🍽️', desc: 'Full-service or fast-casual restaurant' },
  { value: 'Grocery Store', emoji: '🛒', desc: 'Supermarket, co-op, or corner store' },
  { value: 'Household', emoji: '🏠', desc: 'Home cook or household with surplus food' },
];

const PROHIBITED_ITEMS = [
  'Illegal substances or controlled goods of any kind',
  'Alcohol sold outside of licensed channels',
  'Tampered, contaminated, or adulterated food',
  'Items with removed or falsified expiry dates',
  'Food stored in unsafe or unsanitary conditions',
  'Non-food items disguised as food listings',
  'Misleading listings that misrepresent the item',
  'Any item that poses a known health or safety risk',
];

const FOOD_SAFETY_RULES = [
  { label: 'Cooked foods', rule: 'Must be stored at safe temperatures. List expected temperature and handling notes. Consumers will inspect at pickup.' },
  { label: 'Uncooked foods', rule: 'Must be clearly labelled as raw. Packaging must be intact. No thawed-and-refrozen items.' },
  { label: 'Packaged groceries', rule: 'Must show visible expiry date. Damaged, swollen, or compromised packaging is not permitted.' },
  { label: 'Perishable items', rule: 'Must be listed with accurate pickup windows. Items past their best-by date must be disclosed.' },
];

export default function ProviderApplyPage() {
  const router = useRouter();
  const { user, applyForProvider } = useAuth();

  const [step, setStep] = useState<Step>('type');
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [contactName, setContactName] = useState(user?.name || '');
  const [address, setAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [integrityChecked, setIntegrityChecked] = useState(false);
  const [foodSafetyChecked, setFoodSafetyChecked] = useState(false);
  const [pickupChecked, setPickupChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const steps: Step[] = ['type', 'verification', 'integrity', 'food-safety'];
  const stepIndex = steps.indexOf(step);

  const handleSubmit = async () => {
    if (!providerType) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    applyForProvider({
      providerType,
      businessName: businessName || undefined,
      address: address || undefined,
      licenseNumber: licenseNumber || undefined,
      safetyPolicyAccepted: integrityChecked,
      integrityPolicyAccepted: integrityChecked,
      foodSafetyAccepted: foodSafetyChecked && pickupChecked,
    });
    router.replace('/provider-pending');
  };

  const isHousehold = providerType === 'Household';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white px-5 pt-10 pb-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-1">Provider Application</p>
        <h1 className="text-xl font-bold text-gray-900">
          {step === 'type' && 'Step 1 — Provider Type'}
          {step === 'verification' && 'Step 2 — Verification Details'}
          {step === 'integrity' && 'Step 3 — Safety & Integrity Policy'}
          {step === 'food-safety' && 'Step 4 — Food Safety Agreement'}
        </h1>
        {/* Progress bar */}
        <div className="flex gap-1.5 mt-3">
          {steps.map((s, i) => (
            <div
              key={s}
              className={cn(
                'h-1.5 rounded-full flex-1 transition-all',
                i <= stepIndex ? 'bg-brand-600' : 'bg-gray-200'
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-8 max-w-sm mx-auto w-full space-y-5">

        {/* Step 1: Provider Type */}
        {step === 'type' && (
          <>
            <p className="text-sm text-gray-500">Select the category that best describes how you will be listing food on NibbleNet.</p>
            <div className="space-y-2">
              {PROVIDER_TYPES.map(({ value, emoji, desc }) => (
                <button
                  key={value}
                  onClick={() => setProviderType(value)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left',
                    providerType === value
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <span className="text-2xl shrink-0">{emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  {providerType === value && (
                    <CheckCircle size={18} className="text-brand-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
            <Button fullWidth size="lg" disabled={!providerType} onClick={() => setStep('verification')}>
              Continue <ArrowRight size={16} className="ml-1" />
            </Button>
          </>
        )}

        {/* Step 2: Verification Details */}
        {step === 'verification' && (
          <>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Your provider type</p>
              <p className="text-sm font-semibold text-gray-800">
                {PROVIDER_TYPES.find((t) => t.value === providerType)?.emoji} {providerType}
              </p>
            </div>

            <p className="text-sm text-gray-500">
              {isHousehold
                ? 'Please confirm your identity and home address. This information is kept private and used only for verification.'
                : 'Provide your business details for verification. This helps us confirm you are a legitimate food business.'}
            </p>

            <div className="space-y-3">
              <Input
                label="Contact Name"
                placeholder="Your full name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
              {!isHousehold && (
                <Input
                  label="Business Name"
                  placeholder="e.g. Sunrise Bakery"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              )}
              <Input
                label={isHousehold ? 'Home Address' : 'Business Address'}
                placeholder="Street address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              {!isHousehold && (
                <Input
                  label="Business License / Registration No. (optional)"
                  placeholder="e.g. BL-2024-000123"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
              )}
            </div>

            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
              Your information is reviewed by our team and never shared publicly. All applications are subject to manual review.
            </div>

            <Button fullWidth size="lg" disabled={!contactName || !address} onClick={() => setStep('integrity')}>
              Continue <ArrowRight size={16} className="ml-1" />
            </Button>
          </>
        )}

        {/* Step 3: Safety & Integrity Policy */}
        {step === 'integrity' && (
          <>
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
              <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700 mb-1">Important: Read before continuing</p>
                <p className="text-xs text-red-600 leading-relaxed">
                  NibbleNet operates a strict safety and integrity policy. Violations result in immediate removal and may be reported to relevant authorities.
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800 mb-3">The following are strictly prohibited on NibbleNet:</p>
              <div className="space-y-2">
                {PROHIBITED_ITEMS.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl">
                    <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-red-600 text-[9px] font-bold">✕</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 leading-relaxed">
                NibbleNet reserves the right to remove any listing at any time without notice if it is found to violate safety or integrity standards. Providers found to have listed prohibited items will be permanently banned.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={integrityChecked}
                onChange={(e) => setIntegrityChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-brand-600"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                I have read and agree to the NibbleNet Safety & Integrity Policy. I understand that violations will result in account suspension or permanent removal.
              </span>
            </label>

            <Button fullWidth size="lg" disabled={!integrityChecked} onClick={() => setStep('food-safety')}>
              I Agree — Continue <ArrowRight size={16} className="ml-1" />
            </Button>
          </>
        )}

        {/* Step 4: Food Safety Agreement */}
        {step === 'food-safety' && (
          <>
            <div className="flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-2xl p-4">
              <ShieldCheck size={18} className="text-brand-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-brand-700 mb-1">Food Safety Standards</p>
                <p className="text-xs text-brand-600 leading-relaxed">
                  All providers must follow these food safety guidelines when listing items. Consumer safety is our highest priority.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {FOOD_SAFETY_RULES.map(({ label, rule }) => (
                <div key={label} className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
              <p className="text-xs font-semibold text-amber-700 mb-1">Consumer Pickup Inspection</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Consumers are entitled to inspect any item at the point of pickup. If the item does not match the listing description or appears unsafe, the consumer may decline the order and cancel the reservation. Providers must accept this outcome without dispute.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={foodSafetyChecked}
                  onChange={(e) => setFoodSafetyChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-brand-600"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  I agree to follow NibbleNet's food safety standards for all listings, including cooked, uncooked, packaged, and perishable items.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pickupChecked}
                  onChange={(e) => setPickupChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-brand-600"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  I understand that consumers may inspect and decline items at pickup if they do not match the listing, and I will not dispute such cancellations.
                </span>
              </label>
            </div>

            <Button
              fullWidth
              size="lg"
              disabled={!foodSafetyChecked || !pickupChecked}
              loading={submitting}
              onClick={handleSubmit}
            >
              Submit Application
            </Button>

            <p className="text-xs text-center text-gray-400 pb-2">
              Applications are typically reviewed within 1–3 business days.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
