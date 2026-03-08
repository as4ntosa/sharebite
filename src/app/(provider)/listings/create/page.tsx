'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ImagePlus, CheckCircle, Gift } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Category, CuisineTag, SurpriseBoxSize } from '@/types';
import { CATEGORIES, CUISINE_TAGS, CATEGORY_EMOJI, cn, SURPRISE_BOX_SIZES, SURPRISE_BOX_LABELS, SURPRISE_BOX_PRICES, SURPRISE_BOX_DESCRIPTIONS } from '@/lib/utils';

// Sample images providers can choose from
const SAMPLE_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80', label: 'Asian Food' },
  { url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80', label: 'Pastries' },
  { url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80', label: 'Fruits' },
  { url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80', label: 'Sushi' },
  { url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80', label: 'Salad' },
  { url: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&q=80', label: 'Muffins' },
  { url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80', label: 'Smoothie' },
  { url: 'https://images.unsplash.com/photo-1484723091739-30f299ad3074?w=600&q=80', label: 'Bread' },
  { url: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600&q=80', label: 'Indian' },
  { url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&q=80', label: 'Tacos' },
  { url: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80', label: 'Cheese' },
  { url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80', label: 'Burger' },
];

export default function CreateListingPage() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const { createListing } = useData();

  const [isSurpriseBox, setIsSurpriseBox] = useState(false);
  const [surpriseBoxSize, setSurpriseBoxSize] = useState<SurpriseBoxSize>('small');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '' as Category | '',
    tags: [] as CuisineTag[],
    price: '',
    originalPrice: '',
    quantity: '1',
    pickupAddress: user?.city ? '' : '',
    pickupCity: user?.city || '',
    pickupZip: user?.zipCode || '',
    pickupStartTime: '17:00',
    pickupEndTime: '19:00',
    pickupInstructions: '',
    imageUrl: SAMPLE_IMAGES[0].url,
  });

  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [waiverOpen, setWaiverOpen] = useState(!user?.waiverSigned);
  const [waiverChecked, setWaiverChecked] = useState(false);
  const [waiverSigning, setWaiverSigning] = useState(false);

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleTag = (tag: CuisineTag) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!isSurpriseBox) {
      if (!form.title.trim()) e.title = 'Title is required';
      if (!form.description.trim()) e.description = 'Description is required';
      if (!form.price || Number(form.price) <= 0) e.price = 'Enter a valid price';
    }
    if (!form.category) e.category = 'Please select a category';
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = 'Quantity must be at least 1';
    if (!form.pickupAddress.trim()) e.pickupAddress = 'Pickup address is required';
    if (!form.pickupCity.trim()) e.pickupCity = 'City is required';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));

    const expiresAt = new Date(
      Date.now() + (new Date(`1970-01-01T${form.pickupEndTime}:00`).getTime() - new Date(`1970-01-01T${form.pickupStartTime}:00`).getTime() + 8 * 3600000)
    ).toISOString();

    const finalPrice = isSurpriseBox ? SURPRISE_BOX_PRICES[surpriseBoxSize] : Number(form.price);
    const finalTitle = isSurpriseBox ? `Surprise ${SURPRISE_BOX_LABELS[surpriseBoxSize]}` : form.title;
    const finalDescription = isSurpriseBox
      ? `A surprise ${SURPRISE_BOX_LABELS[surpriseBoxSize].toLowerCase()} filled with a mystery assortment from ${user!.businessName || user!.name}. Contents vary — that's the fun!`
      : form.description;

    createListing({
      providerId: user!.id,
      providerName: user!.name,
      businessName: user!.businessName || user!.name,
      businessType: user!.businessType,
      title: finalTitle,
      description: finalDescription,
      category: form.category as Category,
      tags: form.tags,
      price: finalPrice,
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      quantity: Number(form.quantity),
      pickupAddress: form.pickupAddress,
      pickupCity: form.pickupCity,
      pickupZip: form.pickupZip,
      pickupStartTime: form.pickupStartTime,
      pickupEndTime: form.pickupEndTime,
      pickupInstructions: form.pickupInstructions,
      imageUrl: form.imageUrl,
      expiresAt,
      distance: 0.2,
      isSurpriseBox,
      surpriseBoxSize: isSurpriseBox ? surpriseBoxSize : undefined,
    });

    setSaving(false);
    setSuccessOpen(true);
  };

  return (
    <div className="px-4 pt-12 md:pt-0 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 md:hidden"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Listing</h1>
          <p className="text-xs text-gray-400 mt-0.5">Share surplus food with your community</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo picker */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Photo</p>
          <button
            type="button"
            onClick={() => setImagePickerOpen(true)}
            className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200 hover:border-brand-400 transition-colors"
          >
            {form.imageUrl ? (
              <>
                <Image src={form.imageUrl} alt="Listing photo" fill className="object-cover" sizes="100vw" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 rounded-xl px-3 py-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <ImagePlus size={15} /> Change Photo
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <ImagePlus size={28} />
                <span className="text-sm">Choose a photo</span>
              </div>
            )}
          </button>
        </div>

        {/* Surprise box toggle */}
        <div>
          <button
            type="button"
            onClick={() => setIsSurpriseBox(!isSurpriseBox)}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left',
              isSurpriseBox
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              isSurpriseBox ? 'bg-purple-100' : 'bg-gray-100'
            )}>
              <Gift size={20} className={isSurpriseBox ? 'text-purple-600' : 'text-gray-400'} />
            </div>
            <div className="flex-1">
              <p className={cn('font-semibold text-sm', isSurpriseBox ? 'text-purple-700' : 'text-gray-700')}>
                Create as Surprise Box
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Consumers won&apos;t see what&apos;s inside — just the box size
              </p>
            </div>
            <div className={cn(
              'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0',
              isSurpriseBox ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
            )}>
              {isSurpriseBox && <CheckCircle size={12} className="text-white" />}
            </div>
          </button>
        </div>

        {/* Surprise box size selector */}
        {isSurpriseBox && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Box Size & Price</p>
            <div className="space-y-2">
              {SURPRISE_BOX_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSurpriseBoxSize(size)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left',
                    surpriseBoxSize === size
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white'
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{SURPRISE_BOX_LABELS[size]}</span>
                      <span className="text-sm font-bold text-purple-600">${SURPRISE_BOX_PRICES[size]}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{SURPRISE_BOX_DESCRIPTIONS[size]}</p>
                  </div>
                  {surpriseBoxSize === size && <CheckCircle size={18} className="text-purple-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Basic info */}
        {!isSurpriseBox && (
          <>
            <Input
              label="Listing Title"
              placeholder="e.g. Fresh Croissant Bundle (6 pcs)"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              error={errors.title}
            />

            <Textarea
              label="Description"
              placeholder="Describe what you're offering, freshness, any notes…"
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              error={errors.description}
            />
          </>
        )}

        {/* Category */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-400">*</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => set('category', cat)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left',
                  form.category === cat
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-white text-gray-600'
                )}
              >
                <span>{CATEGORY_EMOJI[cat]}</span>
                <span className="truncate">{cat}</span>
              </button>
            ))}
          </div>
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
        </div>

        {/* Cuisine tags */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Cuisine Tags (optional)</p>
          <div className="flex flex-wrap gap-2">
            {CUISINE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag as CuisineTag)}
                className={cn(
                  'px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
                  form.tags.includes(tag as CuisineTag)
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-white text-gray-600'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing */}
        {!isSurpriseBox && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Your Price ($)"
              type="number"
              placeholder="5.00"
              min="0.50"
              step="0.50"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              error={errors.price}
            />
            <Input
              label="Original Price ($)"
              type="number"
              placeholder="15.00"
              min="0"
              step="0.50"
              value={form.originalPrice}
              onChange={(e) => set('originalPrice', e.target.value)}
              hint="Optional"
            />
          </div>
        )}

        <Input
          label="Quantity Available"
          type="number"
          placeholder="1"
          min="1"
          max="100"
          value={form.quantity}
          onChange={(e) => set('quantity', e.target.value)}
          error={errors.quantity}
        />

        {/* Pickup */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Pickup Details</p>
          <Input
            label="Pickup Address"
            placeholder="e.g. 123 Main St"
            value={form.pickupAddress}
            onChange={(e) => set('pickupAddress', e.target.value)}
            error={errors.pickupAddress}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="San Francisco"
              value={form.pickupCity}
              onChange={(e) => set('pickupCity', e.target.value)}
              error={errors.pickupCity}
            />
            <Input
              label="ZIP Code"
              placeholder="94105"
              value={form.pickupZip}
              onChange={(e) => set('pickupZip', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Pickup From"
              type="time"
              value={form.pickupStartTime}
              onChange={(e) => set('pickupStartTime', e.target.value)}
            />
            <Input
              label="Pickup Until"
              type="time"
              value={form.pickupEndTime}
              onChange={(e) => set('pickupEndTime', e.target.value)}
            />
          </div>
          <Textarea
            label="Pickup Instructions (optional)"
            placeholder="e.g. Come to the side entrance, ask for John…"
            rows={2}
            value={form.pickupInstructions}
            onChange={(e) => set('pickupInstructions', e.target.value)}
          />
        </div>

        <Button type="submit" fullWidth size="lg" loading={saving} className="mt-2">
          Publish Listing
        </Button>
      </form>

      {/* Image picker modal */}
      <Modal open={imagePickerOpen} onClose={() => setImagePickerOpen(false)} title="Choose a Photo">
        <div className="grid grid-cols-3 gap-2">
          {SAMPLE_IMAGES.map(({ url, label }) => (
            <button
              key={url}
              onClick={() => { set('imageUrl', url); setImagePickerOpen(false); }}
              className={cn(
                'relative aspect-square rounded-xl overflow-hidden border-2 transition-all',
                form.imageUrl === url ? 'border-brand-500' : 'border-transparent'
              )}
            >
              <Image src={url} alt={label} fill className="object-cover" sizes="120px" />
              {form.imageUrl === url && (
                <div className="absolute inset-0 bg-brand-600/20 flex items-center justify-center">
                  <CheckCircle size={20} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">
          In production, you&apos;ll be able to upload your own photos
        </p>
      </Modal>

      {/* Success modal */}
      <Modal open={successOpen} onClose={() => { setSuccessOpen(false); router.push('/listings'); }}>
        <div className="text-center py-2">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-brand-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Listing Published!</h2>
          <p className="text-sm text-gray-400 mb-5">
            Your listing is now live and visible to nearby consumers.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => { setSuccessOpen(false); setForm({ ...form, title: '', description: '', price: '', originalPrice: '', pickupInstructions: '' }); }}>
              Add Another
            </Button>
            <Button fullWidth onClick={() => { setSuccessOpen(false); router.push('/listings'); }}>
              View Listings
            </Button>
          </div>
        </div>
      </Modal>

      {/* Food Safety Waiver modal */}
      <Modal open={waiverOpen} onClose={() => router.push('/dashboard')} title="Food Safety Waiver">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">Required before posting</p>
            <p className="text-xs text-amber-600">
              You must read and agree to our food safety waiver before creating your first listing.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto text-xs text-gray-600 leading-relaxed space-y-3">
            <p className="font-semibold text-gray-800">ShareBite Provider Food Safety Agreement</p>

            <p>
              By signing this waiver, I agree to the following terms and conditions as a food provider on the ShareBite platform:
            </p>

            <p>
              <strong>1. Food Safety Standards.</strong> I confirm that all food and grocery items I list on ShareBite are safe for human consumption and have been stored, handled, and prepared in accordance with applicable local health and safety regulations.
            </p>

            <p>
              <strong>2. Accurate Listings.</strong> I agree to provide accurate and truthful descriptions of all items listed, including ingredients, allergens, freshness status, and expiration information where applicable.
            </p>

            <p>
              <strong>3. Freshness & Expiration.</strong> I will not list any food items that have passed their expiration date or pose a health risk due to spoilage, contamination, or improper storage.
            </p>

            <p>
              <strong>4. Consumer Inspection Right.</strong> I acknowledge that consumers have the right to inspect items in person at the time of pickup and may confirm or cancel their reservation based on the condition of the food.
            </p>

            <p>
              <strong>5. Liability.</strong> I understand that I am solely responsible for the safety and quality of the food items I provide. ShareBite serves as a marketplace platform and does not guarantee the safety of listed items.
            </p>

            <p>
              <strong>6. Compliance.</strong> I agree to comply with all local, state, and federal food safety laws and regulations. I understand that violation of these terms may result in removal from the platform.
            </p>

            <p>
              <strong>7. Recall & Removal.</strong> I agree to promptly remove any listing that may pose a health risk and to notify ShareBite of any food safety concerns.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={waiverChecked}
              onChange={(e) => setWaiverChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs text-gray-600">
              I have read and agree to the ShareBite Food Safety Waiver. I understand my responsibilities as a food provider on this platform.
            </span>
          </label>

          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => router.push('/dashboard')}
            >
              Go Back
            </Button>
            <Button
              fullWidth
              disabled={!waiverChecked}
              loading={waiverSigning}
              onClick={async () => {
                setWaiverSigning(true);
                await new Promise((r) => setTimeout(r, 600));
                updateProfile({ waiverSigned: true, waiverSignedAt: new Date().toISOString() });
                setWaiverSigning(false);
                setWaiverOpen(false);
              }}
            >
              Sign & Continue
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
