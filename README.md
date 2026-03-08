# NibbleNet

> **A network for sharing extra food.**

NibbleNet is a mobile-first, web-based social impact marketplace that reduces food waste while making food and groceries more affordable and accessible. It connects approved local food providers with nearby consumers looking for discounted surplus meals, baked goods, produce, groceries, and more.

---

## Why NibbleNet

| Stat | Source |
|---|---|
| 80 million tons of food wasted per year in the US | USDA |
| $408 billion worth of food waste annually | ReFED |
| 40 million Americans food insecure | Feeding America |
| 8% of global greenhouse gas emissions from food waste | UNEP |
| Average restaurant wastes ~$10,000 of food per year | Waste360 |

Every NibbleNet transaction simultaneously reduces food waste, makes food more affordable, and decreases the carbon footprint of food decomposition.

---

## What Makes NibbleNet Different

| Feature | NibbleNet | Typical Surplus Apps |
|---|---|---|
| Unified account (consumer + provider) | ✓ | Usually separate |
| Household provider support | ✓ | Rarely |
| 4-step provider safety approval | ✓ | Usually none |
| Allergen-aware auto-filtering | ✓ Built into account | Filter afterthought |
| Pickup confirm-or-cancel right | ✓ Consumer right | Usually none |
| Community Pantry / free listings | ✓ | Rarely |
| Local impact metrics | ✓ | Rarely |
| AI chatbot assistant | ✓ | Rarely |

---

## Prototype Status

This is a **lightweight hackathon MVP**. All data is mocked and persisted via `localStorage`. No backend or server is required to run the prototype.

**Production path:** Supabase (auth + database) → Cloudinary (images) → Mapbox (maps) → Stripe + Stripe Identity (payments + verification) → React Native / Expo (iOS)

---

## Account Model

NibbleNet uses a **single unified account system**. There are no separate "consumer" or "provider" account types.

- Every user signs up with one account
- All accounts can browse, search, and reserve listings by default
- Any account can begin the **Become a Provider** application
- Provider capabilities are unlocked after completing a formal 4-step safety and verification process
- The same account retains all consumer features after becoming a provider

### Provider Status

| Status | Description |
|---|---|
| `none` | Standard consumer access (default for all new accounts) |
| `pending` | Application submitted, under review |
| `approved` | Full provider capabilities unlocked |
| `rejected` | Application denied; can resubmit |

---

## Supported Provider Types

- Restaurant / Food Service
- Grocery Store / Market
- Bakery / Café / Juice Bar
- **Household / Home Cook** — unique to NibbleNet, with the same safety compliance framework as businesses
- Other Food Business

---

## Provider Onboarding Flow (4 Steps)

Provider access is a gated capability — not a separate account type.

1. **Identity authentication** — legal name, date of birth, ID type (placeholder for Stripe Identity / Persona in production)
2. **Provider type selection** — restaurant, grocery, household, bakery/café, other
3. **Integrity and safety agreement** — required acknowledgment of prohibited items (drugs, unsafe food, fraudulent or non-food listings, tampered goods)
4. **Food safety fine print** — covers cooked, uncooked, packaged, and perishable food standards; allergen disclosure requirements; and the consumer's right to inspect and cancel at pickup

---

## Trust and Safety

NibbleNet treats food safety as a first-class product feature — not an afterthought.

- **Provider gating:** Listing creation is locked until the 4-step approval is complete
- **Integrity agreement:** Every provider explicitly acknowledges prohibited items (drugs, unsafe food, deceptive listings, non-food items)
- **Food safety acknowledgment:** Every provider accepts food handling standards covering all food types
- **Pickup inspection right:** Consumers have the formal right to inspect food at pickup and cancel on the spot if the item doesn't match the listing or appears unsafe
- **Allergen tags:** Required on all listings containing common allergens; suppressed automatically from sensitive users' feeds
- **One-tap reporting:** Any listing can be reported with type selection and description; creates a moderation record

---

## Allergen-Aware Filtering

Users save allergy and sensitivity preferences in their profile:

`Peanuts · Tree Nuts · Dairy · Eggs · Shellfish · Soy · Gluten · Sesame`

- The home feed **automatically suppresses** any listing containing a saved allergen
- A banner tells users how many listings were hidden, with a link to manage preferences
- When a user intentionally **searches**, allergen suppression is lifted so discovery is never blocked by the filter system

---

## Demo Credentials

One shared demo account covers both the consumer and provider experience. No separate logins needed.

| Field | Value |
|---|---|
| Email | `demo@nibblen.com` |
| Password | `demo123` |

The demo account has `providerStatus: 'approved'` pre-configured. You can browse the consumer feed, manage reservations, and access the provider dashboard from the same login.

On the provider-pending page, a **"Simulate Approval"** button is available for demo purposes.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| State | React Context + useReducer |
| Persistence | localStorage (MVP) |
| Geolocation | Browser API + Haversine distance |
| AI Chatbot | Featherless AI — Llama 3.1-8B-Instruct |
| Images | Unsplash CDN |

---

## Local Setup

```bash
git clone https://github.com/as4ntosa/nibblenet.git
cd nibblenet
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Other commands:

```bash
npm run build    # Production build
npm run lint     # ESLint
```

---

## Project Structure

```
src/
├── app/
│   ├── (consumer)/        # Home feed, search, listing detail, reservations, profile
│   ├── (provider)/        # Dashboard, listings, create listing
│   ├── become-a-provider/ # Provider landing page
│   ├── provider-apply/    # 4-step provider onboarding form
│   ├── provider-pending/  # Pending approval status page
│   ├── login/             # Unified sign in / sign up
│   └── onboarding/        # City + zip setup after sign-up
├── components/
│   ├── ui/                # Button, Input, Badge, Modal primitives
│   ├── layout/            # IPhoneFrame, BottomNav
│   ├── listing/           # ListingCard, AllergenChips
│   ├── reservation/       # ReservationCard
│   └── ChatBot.tsx        # AI assistant (Featherless API)
├── context/
│   ├── AuthContext.tsx    # User session, provider status, localStorage
│   └── DataContext.tsx    # Listings, reservations, filtering, pickup actions
├── lib/
│   ├── mock-data.ts       # Demo users, listings, reservations
│   └── utils.ts           # Allergens, distances, formatters
└── types/
    └── index.ts           # Shared TypeScript types
```

---

## Roadmap

### Now (MVP — Hackathon)
- Unified account with provider capability gating
- 4-step provider safety approval flow
- Consumer feed with allergen-aware auto-filtering
- Location-based listing discovery (Haversine distance)
- Reservation system with confirm-or-cancel pickup
- Rescue Bundles and Surprise Boxes
- Impact counter (meals rescued, CO₂ saved)
- AI chatbot assistant (NibbleNet Assistant)

### Next (Post-MVP)
- Supabase backend (auth + real-time database)
- Real identity verification (Stripe Identity or Persona)
- Stripe Connect payment processing
- Provider reviews and ratings
- Map view with listing pins
- Community Pantry mode (free/donation listings)
- Sponsor-a-Meal (philanthropic pledge layer)
- Provider analytics dashboard
- Pro subscription tier ($19/mo)

### Later (Mobile)
- React Native / Expo iOS app sharing business logic
- Push notifications (Expo Push + Web Push)
- Multi-language support
- Multi-city impact dashboard

---

## Impact Metrics

NibbleNet tracks and displays local impact on the home screen:

- **Meals rescued** — total confirmed pickups in the city this week
- **CO₂ saved** — meals × 2.5 kg average per meal equivalent
- **Active providers** — verified providers with live listings
- **Community pantry meals** — free/donation listings claimed

---

## License

MIT

---

*NibbleNet — A network for sharing extra food.*
