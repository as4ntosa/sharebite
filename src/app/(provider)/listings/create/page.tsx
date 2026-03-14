'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ImagePlus, CheckCircle, Gift, Sparkles, Loader2, Heart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Category, CuisineTag, SurpriseBoxSize, Allergen } from '@/types';
import { CATEGORIES, CUISINE_TAGS, CATEGORY_EMOJI, cn, SURPRISE_BOX_SIZES, SURPRISE_BOX_LABELS, SURPRISE_BOX_PRICES, SURPRISE_BOX_DESCRIPTIONS, ALLERGENS, ALLERGEN_LABEL } from '@/lib/utils';
import { askAI } from '@/lib/ai';

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
  const [selectedAllergens, setSelectedAllergens] = useState<Allergen[]>([]);
  const [isDonation, setIsDonation] = useState(false);
  const [isEvent, setIsEvent] = useState(false);
  const [eventDate, setEventDate] = useState('');

  const toggleAllergen = (a: Allergen) =>
    setSelectedAllergens((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

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

  // AI features
  const [priceSuggestion, setPriceSuggestion] = useState<string | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [qualityScore, setQualityScore] = useState<{ score: number; tip: string } | null>(null);
  const [loadingQuality, setLoadingQuality] = useState(false);
  const [loadingRewrite, setLoadingRewrite] = useState(false);

  const suggestPrice = async () => {
    if (!form.originalPrice || !form.category) return;
    setLoadingPrice(true);
    setPriceSuggestion(null);
    try {
      const reply = await askAI(
        'You are a food marketplace pricing expert. Reply with ONLY a JSON object: {"price": <number>, "reason": "<one sentence>"}. No markdown.',
        `originalPrice=$${form.originalPrice}, category=${form.category}, foodCondition=cooked, city=${user?.city || 'unknown'}. Suggest an optimal surplus sale price to maximize pickup chance.`,
        120,
      );
      const parsed = JSON.parse(reply.replace(/```json|```/g, '').trim());
      setPriceSuggestion(`Suggested: $${Number(parsed.price).toFixed(2)} — ${parsed.reason}`);
    } catch {
      setPriceSuggestion('Could not generate suggestion. Try adding a category and original price first.');
    } finally {
      setLoadingPrice(false);
    }
  };

  const checkQuality = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setLoadingQuality(true);
    try {
      const reply = await askAI(
        'You are a food listing quality reviewer. Reply with ONLY a JSON object: {"score": <1-10>, "tip": "<one actionable improvement sentence>"}. No markdown.',
        `title="${form.title}", description="${form.description}"`,
        100,
      );
      const parsed = JSON.parse(reply.replace(/```json|```/g, '').trim());
      setQualityScore({ score: Number(parsed.score), tip: parsed.tip });
    } catch {
      setQualityScore({ score: 0, tip: 'Could not analyze listing quality right now.' });
    } finally {
      setLoadingQuality(false);
    }
  };

  const rewriteWithAI = async () => {
    if (!form.title.trim() && !form.description.trim()) return;
    setLoadingRewrite(true);
    try {
      const reply = await askAI(
        'You are a professional food listing copywriter. Reply with ONLY a JSON object: {"title": "<improved title>", "description": "<improved description 1-2 sentences>"}. No markdown.',
        `title="${form.title}", description="${form.description}", category=${form.category || 'food'}. Make it more enticing and clear while keeping it honest.`,
        180,
      );
      const parsed = JSON.parse(reply.replace(/```json|```/g, '').trim());
      setForm((f) => ({ ...f, title: parsed.title || f.title, description: parsed.description || f.description }));
      setQualityScore(null);
    } catch {
      // silently fail
    } finally {
      setLoadingRewrite(false);
    }
  };

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
      if (!isDonation && (!form.price || Number(form.price) <= 0)) e.price = 'Enter a valid price';
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

    const expiresAt = new Date(
      Date.now() + (new Date(`1970-01-01T${form.pickupEndTime}:00`).getTime() - new Date(`1970-01-01T${form.pickupStartTime}:00`).getTime() + 8 * 3600000)
    ).toISOString();

    const finalPrice = isDonation ? 0 : isSurpriseBox ? SURPRISE_BOX_PRICES[surpriseBoxSize] : Number(form.price);
    const finalTitle = isSurpriseBox ? `Surprise ${SURPRISE_BOX_LABELS[surpriseBoxSize]}` : form.title;
    const finalDescription = isSurpriseBox
      ? `A surprise ${SURPRISE_BOX_LABELS[surpriseBoxSize].toLowerCase()} filled with a mystery assortment from ${user!.businessName || user!.name}. Contents vary — that's the fun!`
      : form.description;

    try {
      await createListing({
        providerId: user!.id,
        providerName: user!.name,
        businessName: user!.businessName || user!.name,
        businessType: user!.businessType,
        title: finalTitle,
        description: finalDescription,
        category: form.category as Category,
        tags: form.tags,
        allergens: selectedAllergens,
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
        isSurpriseBox,
        surpriseBoxSize: isSurpriseBox ? surpriseBoxSize : undefined,
        isDonation: isDonation || undefined,
        isEvent: isEvent || undefined,
        eventDate: isEvent && eventDate ? new Date(eventDate).toISOString() : undefined,
      });
      setSuccessOpen(true);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to publish listing. Please try again.' });
    } finally {
      setSaving(false);
    }
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

        {/* Donation toggle */}
        <button
          type="button"
          onClick={() => { setIsDonation(!isDonation); if (!isDonation) { setIsSurpriseBox(false); setIsEvent(false); } }}
          className={cn(
            'w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left',
            isDonation ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', isDonation ? 'bg-teal-100' : 'bg-gray-100')}>
            <Heart size={20} className={isDonation ? 'text-teal-600' : 'text-gray-400'} />
          </div>
          <div className="flex-1">
            <p className={cn('font-semibold text-sm', isDonation ? 'text-teal-700' : 'text-gray-700')}>Donate This Food (Free)</p>
            <p className="text-xs text-gray-400 mt-0.5">List at $0 — consumers pick up at no charge</p>
          </div>
          <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0', isDonation ? 'border-teal-500 bg-teal-500' : 'border-gray-300')}>
            {isDonation && <CheckCircle size={12} className="text-white" />}
          </div>
        </button>

        {/* Event toggle */}
        <div>
          <button
            type="button"
            onClick={() => { setIsEvent(!isEvent); if (!isEvent) { setIsDonation(false); setIsSurpriseBox(false); } }}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left',
              isEvent ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', isEvent ? 'bg-pink-100' : 'bg-gray-100')}>
              <Calendar size={20} className={isEvent ? 'text-pink-600' : 'text-gray-400'} />
            </div>
            <div className="flex-1">
              <p className={cn('font-semibold text-sm', isEvent ? 'text-pink-700' : 'text-gray-700')}>Event Surplus</p>
              <p className="text-xs text-gray-400 mt-0.5">Food left over from a special event or function</p>
            </div>
            <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0', isEvent ? 'border-pink-500 bg-pink-500' : 'border-gray-300')}>
              {isEvent && <CheckCircle size={12} className="text-white" />}
            </div>
          </button>
          {isEvent && (
            <div className="mt-2">
              <Input
                label="Event Date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                hint="Optional — when did/will the event take place?"
              />
            </div>
          )}
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

            <div>
              <Textarea
                label="Description"
                placeholder="Describe what you're offering, freshness, any notes…"
                rows={3}
                value={form.description}
                onChange={(e) => { set('description', e.target.value); setQualityScore(null); }}
                error={errors.description}
              />
              {/* AI Quality Score */}
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={checkQuality}
                    disabled={loadingQuality || !form.title || !form.description}
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors disabled:opacity-40"
                  >
                    {loadingQuality ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Check Quality
                  </button>
                  {qualityScore && (
                    <div className={cn(
                      'flex-1 flex items-start gap-2 rounded-lg px-3 py-2 text-xs',
                      qualityScore.score >= 7 ? 'bg-green-50 text-green-700' :
                      qualityScore.score >= 4 ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    )}>
                      <span className="font-bold shrink-0">{qualityScore.score}/10</span>
                      <span className="leading-relaxed">{qualityScore.tip}</span>
                    </div>
                  )}
                </div>
                {qualityScore && qualityScore.score < 7 && (
                  <button
                    type="button"
                    onClick={rewriteWithAI}
                    disabled={loadingRewrite}
                    className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-40"
                  >
                    {loadingRewrite ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    ✨ Rewrite with AI
                  </button>
                )}
              </div>
            </div>
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

        {/* Allergen tagging */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Allergens</p>
          <p className="text-xs text-gray-400 mb-2">Select all that apply. Consumers rely on this to filter safely.</p>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAllergen(a as Allergen)}
                className={cn(
                  'px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
                  selectedAllergens.includes(a as Allergen)
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : 'border-gray-200 bg-white text-gray-500'
                )}
              >
                {ALLERGEN_LABEL[a]}
              </button>
            ))}
          </div>
          {selectedAllergens.length === 0 && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              ⚠ If this listing contains no allergens, leave all unselected.
            </p>
          )}
        </div>

        {/* Pricing */}
        {!isSurpriseBox && !isDonation && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Your Price ($)"
                type="number"
                placeholder="5.00"
                min="0.50"
                step="0.50"
                value={form.price}
                onChange={(e) => { set('price', e.target.value); setPriceSuggestion(null); }}
                error={errors.price}
              />
              <Input
                label="Original Price ($)"
                type="number"
                placeholder="15.00"
                min="0"
                step="0.50"
                value={form.originalPrice}
                onChange={(e) => { set('originalPrice', e.target.value); setPriceSuggestion(null); }}
                hint="Optional"
              />
            </div>
            {/* AI Price Suggestion */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={suggestPrice}
                disabled={loadingPrice || !form.originalPrice || !form.category}
                className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-40"
              >
                {loadingPrice ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                AI Suggest Price
              </button>
              {priceSuggestion && (
                <p className="text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-lg px-3 py-1.5 flex-1">
                  {priceSuggestion}
                </p>
              )}
              {!form.originalPrice && !form.category && (
                <p className="text-[11px] text-gray-400">Add original price &amp; category to unlock AI suggestion</p>
              )}
            </div>
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

        {errors.submit && (
          <p className="text-xs text-red-500 text-center">{errors.submit}</p>
        )}
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
            <p className="font-semibold text-gray-800">NibbleNet Provider Food Safety Agreement</p>

            <p>
              By signing this waiver, I agree to the following terms and conditions as a food provider on the NibbleNet platform:
            </p>

            <p>
              <strong>1. Food Safety Standards.</strong> I confirm that all food and grocery items I list on NibbleNet are safe for human consumption and have been stored, handled, and prepared in accordance with applicable local health and safety regulations.
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
              <strong>5. Liability.</strong> I understand that I am solely responsible for the safety and quality of the food items I provide. NibbleNet serves as a marketplace platform and does not guarantee the safety of listed items.
            </p>

            <p>
              <strong>6. Compliance.</strong> I agree to comply with all local, state, and federal food safety laws and regulations. I understand that violation of these terms may result in removal from the platform.
            </p>

            <p>
              <strong>7. Recall & Removal.</strong> I agree to promptly remove any listing that may pose a health risk and to notify NibbleNet of any food safety concerns.
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
              I have read and agree to the NibbleNet Food Safety Waiver. I understand my responsibilities as a food provider on this platform.
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
