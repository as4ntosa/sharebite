# NibbleNet

> **A network for sharing extra food.**
> Built by **Fantastic Fantosa Corporations**

NibbleNet is a mobile-first, web-based social impact marketplace that reduces food waste while making food and groceries more affordable and accessible. It connects approved local food providers with nearby consumers looking for discounted surplus meals, baked goods, produce, groceries, and more.

---

## Team

| Name | Role |
|---|---|
| Alexis Santosa | Full-stack development, product design, architecture, Supabase integration, location/mapping, listing detail experience |
| Siyu Fan | Full-stack development, provider analytics engine, AI insights dashboard, AI chatbot assistant, UI/UX improvements |

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
| Real cloud database (Supabase) | ✓ Live | Usually none |
| Unified account (consumer + provider) | ✓ | Usually separate |
| Household provider support | ✓ | Rarely |
| 4-step provider safety approval | ✓ | Usually none |
| Real admin review + AI verification | ✓ | Usually none |
| Allergen-aware auto-filtering | ✓ Built into account | Filter afterthought |
| Live distance-sorted feed | ✓ Haversine + geolocation | Rarely |
| Food condition + freshness data | ✓ | Rarely |
| Pickup confirm-or-cancel right | ✓ Consumer right | Usually none |
| Community Pantry / free listings | ✓ | Rarely |
| Provider analytics + AI insights | ✓ | Rarely |
| AI chatbot assistant | ✓ | Rarely |
| Google Maps pickup integration | ✓ | Rarely |

---

## Screenshots

| Consumer Home | Listing Detail | Provider Reports |
|---|---|---|
| ![Consumer Home](public/screenshots/03-consumer-home.png) | ![Listing Detail](public/screenshots/05-listing-detail.png) | ![Provider Dashboard](public/screenshots/08-provider-dashboard.png) |

---

## Live Database

NibbleNet is connected to a **real Supabase backend** (PostgreSQL + Auth). Real user accounts and live food listings are stored in the cloud.

| Detail | Value |
|---|---|
| Provider | Supabase |
| Project | `nibblenet` — West US (North California) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth — email/password |
| Tables | `profiles`, `listings`, `reservations` |
| Dashboard | [supabase.com/dashboard/project/mankfjoscqgghddhhmnv](https://supabase.com/dashboard/project/mankfjoscqgghddhhmnv) |

### Data Mode

The app operates in two modes depending on environment configuration:

| Mode | Condition | Behavior |
|---|---|---|
| **Live mode** | `NEXT_PUBLIC_SUPABASE_URL` is set | Real sign-up/login, listings saved to DB, feed shows live data first |
| **Mock mode** | Env vars absent | All data from `src/lib/mock-data.ts`, no DB or network required |

In live mode the consumer feed shows **real listings first**, then a "Sample Listings · Demo" section with mock data so the feed never appears empty before providers post.

### Database Schema

See [`supabase-schema.sql`](./supabase-schema.sql) for the full schema:
- `profiles` — extends Supabase auth, stores provider status + approval state
- `listings` — all food listing fields, linked to `auth.users`
- `reservations` — consumer reservations with confirmation codes
- Row Level Security (RLS) on all tables
- Auto-create profile trigger on user sign-up
- Indexes on `status`, `provider_id`, `created_at`

---

## Account Model

NibbleNet uses a **single unified account system**. There are no separate "consumer" or "provider" account types.

- Every user signs up with one account
- All accounts can browse, search, and reserve listings by default
- Any account can begin the **Become a Provider** application
- Provider capabilities are unlocked after completing a 4-step safety and verification process
- The same account retains all consumer features after becoming a provider
- Approved providers can switch between **Consumer Mode** and **Provider Mode** via a mode switcher strip

### Provider Status

| Status | Description |
|---|---|
| `none` | Standard consumer access (default for all new accounts) |
| `pending` | Application submitted, under review |
| `approved` | Full provider capabilities unlocked; mode switching enabled |
| `rejected` | Application denied; can resubmit |

---

## Supported Provider Types

- **Restaurant / Food Service**
- **Grocery Store / Market**
- **Household / Home Cook** — unique to NibbleNet, with the same safety compliance framework as businesses

---

## Provider Onboarding Flow

Provider access is a gated capability — not a separate account type.

1. **Identity authentication** — legal name, date of birth, ID type
2. **Provider type selection** — restaurant, grocery, or household
3. **Integrity and safety agreement** — acknowledgment of prohibited items
4. **Food safety fine print** — food handling standards, allergen disclosure, consumer inspection right
5. **Admin review** — application reviewed by a NibbleNet admin via the `/admin` panel; admin can optionally run AI verification before approving or rejecting

---

## Trust & Safety

- **Provider gating** — listing creation locked until 4-step approval completes
- **Admin review** — every provider application is reviewed by a human admin before approval
- **AI verification** — admins can run an AI analysis (Featherless AI) on each application to surface risk level, positives, and concerns before deciding
- **Integrity agreement** — every provider explicitly acknowledges prohibited items
- **Food safety acknowledgment** — covers all food types and handling standards
- **Pickup inspection right** — consumers can inspect and cancel at pickup
- **Allergen tags** — required on all listings; auto-suppressed for sensitive users
- **Food condition + freshness** — providers specify condition, prep time, and handling notes
- **One-tap reporting** — any listing can be reported; creates a moderation record

---

## Allergen-Aware Filtering

Users save allergy and sensitivity preferences in their profile:

`Peanuts · Tree Nuts · Dairy · Eggs · Shellfish · Soy · Gluten · Sesame`

- The home feed **automatically suppresses** listings containing a saved allergen
- A banner shows how many listings were hidden, with a link to manage preferences
- Search lifts allergen suppression so discovery is never fully blocked

---

## Provider Analytics & AI Insights *(built by Siyu Fan)*

Approved providers have access to a **Reports dashboard** at `/reports` in Provider Mode:

- **Revenue metrics** — total revenue, order count, items sold, average order value
- **Daily revenue chart** — 7-day bar chart with revenue and order counts
- **Top-selling items** — ranked by revenue with progress bars
- **Peak pickup hours** — hourly order distribution to identify busy windows
- **AI-generated insights** via Featherless AI (Llama 3.1-8B-Instruct):
  - Business performance overview
  - 4 data-driven insight bullets
  - 2 actionable recommendations
- Graceful fallback insights when the AI API is unavailable

### How to access:
1. Log in with the demo account (`demo@nibblen.com` / `demo123`)
2. Tap **Provider** in the mode switcher strip at the bottom
3. Tap **Reports** in the provider nav bar

---

## AI Chatbot Assistant *(built by Siyu Fan)*

A floating chat bubble appears inside the app frame on every screen:

- Powered by **Featherless AI** (Llama 3.1-8B-Instruct)
- Auto-greeting after 5 seconds on first load
- Answers questions about NibbleNet, food listings, and reservations
- Built-in contact shortcut (`support@nibblenet.com`)
- **Draggable** — drag the bubble to any of 4 corners; snaps with smooth animation
- Tap to open/close; drag threshold distinguishes taps from drags

---

## Demo Credentials

One shared demo account covers both consumer and provider experiences.

| Field | Value |
|---|---|
| Email | `demo@nibblen.com` |
| Password | `demo123` |

The demo account has `providerStatus: 'approved'` pre-configured. You can browse the consumer feed, manage reservations, switch to provider mode, post listings, and view the analytics dashboard — all from a single login.

> **Note:** The demo account always uses local mock data (not the live database), so it works without Supabase configured.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Auth + Database | Supabase (PostgreSQL + Auth) |
| State | React Context + useReducer |
| Persistence | Supabase (live) / localStorage (mock fallback) |
| Maps | Google Maps JavaScript API (`@react-google-maps/api`) |
| Geolocation | Browser API + Haversine distance formula |
| AI Chatbot | Featherless AI — Llama 3.1-8B-Instruct *(Siyu Fan)* |
| AI Insights | Featherless AI — provider analytics recommendations *(Siyu Fan)* |
| AI Verification | Featherless AI — provider application risk analysis *(Alexis)* |
| Images | Unsplash CDN |

---

## Local Setup

```bash
git clone https://github.com/as4ntosa/nibblenet.git
cd nibblenet
npm install
```

### Option A — Mock mode (no database required)

```bash
npm run dev
```

Runs entirely on local mock/sample data. No environment setup needed. Use `demo@nibblen.com` / `demo123` to log in.

### Option B — Live mode (real accounts + live listings)

```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Get your credentials from **supabase.com → Project Settings → API**.
To set up a new project, run [`supabase-schema.sql`](./supabase-schema.sql) in the Supabase SQL editor.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Enables live auth + database |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Required for server-side API routes (listings, profile, admin actions) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional | Enables map views (falls back gracefully) |

Open [http://localhost:3000](http://localhost:3000)

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
│   ├── (provider)/        # Dashboard, listings CRUD, create listing, reports
│   ├── admin/             # Admin panel — pending applications, AI verify, approve/reject
│   ├── api/
│   │   ├── admin/         # approve, reject, ai-verify — service role, JWT auth
│   │   ├── listings/      # create — service role, bypasses Supabase JS client
│   │   ├── profile/       # update — service role, bypasses Supabase JS client
│   │   └── report/        # AI insights (Featherless) — Siyu Fan
│   ├── become-a-provider/ # Provider landing page
│   ├── provider-apply/    # 4-step provider onboarding form
│   ├── provider-pending/  # Pending approval status with Realtime sync
│   ├── login/             # Unified sign-in / sign-up (Supabase + mock)
│   └── onboarding/        # City + zip setup after sign-up
├── components/
│   ├── ui/                # Button, Input, Badge, Modal primitives
│   ├── layout/            # IPhoneFrame, BottomNav, ProviderNav, ModeSwitcher
│   ├── listing/           # ListingCard, ListingCardSkeleton, AllergenChips
│   ├── map/               # ListingsMap, PickupMap (Google Maps)
│   ├── reservation/       # ReservationCard
│   └── ChatBot.tsx        # AI assistant (Featherless API) — Siyu Fan
├── context/
│   ├── AuthContext.tsx    # Supabase auth + localStorage fallback
│   └── DataContext.tsx    # Live listings (Supabase) + mock fallback, reservations
├── hooks/
│   └── useGeolocation.ts  # Browser geolocation with permission state
├── lib/
│   ├── supabase.ts        # Supabase client + DB↔type converters
│   ├── mock-data.ts       # Demo users, listings, reservations
│   ├── mock-orders.ts     # Mock order history for analytics — Siyu Fan
│   ├── analytics.ts       # Revenue, trends, peak hours engine — Siyu Fan
│   └── utils.ts           # Distances, formatters, constants
├── types/
│   └── index.ts           # Shared TypeScript types
└── supabase-schema.sql    # Full DB schema with RLS + triggers
```

---

## Roadmap

### ✅ Shipped (MVP)
- Real Supabase database — live sign-up, login, and listing storage *(Alexis)*
- Unified account with consumer/provider mode switching *(Alexis)*
- 4-step provider safety approval flow *(Alexis)*
- Real admin approval panel (`/admin`) — human review before providers go live *(Alexis)*
- AI verification for provider applications — risk level, positives, concerns *(Alexis)*
- Admin Panel link in profile (visible only to admins) *(Alexis)*
- Server-side API routes (service role key) — fix Supabase JS client mutation hang *(Alexis)*
- Realtime profile sync — provider approval reflected instantly without re-login *(Alexis)*
- Consumer feed with allergen-aware auto-filtering *(Alexis)*
- Location-based listing discovery (Haversine + geolocation) *(Alexis)*
- Food condition + freshness data on every listing *(Alexis)*
- Live distance + freshness age on listing cards *(Alexis)*
- Listing detail with food info first, Google Maps, Get Directions *(Alexis)*
- Reservation system with confirm-or-cancel pickup *(Alexis)*
- Skeleton loading state while Supabase fetches *(Alexis)*
- Impact counter (meals rescued, CO₂ saved) *(Alexis)*
- Provider analytics dashboard with revenue, trends, peak hours *(Siyu Fan)*
- AI-generated insights and recommendations via Featherless AI *(Siyu Fan)*
- AI chatbot assistant (NibbleNet Assistant) — draggable, snaps to corners *(Siyu Fan)*
- Bottom nav clipping fix + phone frame containment *(Siyu Fan)*
- iOS-style preview frame on desktop *(Alexis)*

### 🔜 Next (Post-MVP)
- Real identity verification (Stripe Identity or Persona)
- Stripe Connect payment processing
- Provider reviews and ratings
- Community Pantry mode (free / donation listings)
- Sponsor-a-Meal philanthropic pledge layer
- Pro subscription tier ($19/mo)
- Image uploads (Cloudinary)

### 📱 Later (Mobile)
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
*Fantastic Fantosa Corporations · 2026*
