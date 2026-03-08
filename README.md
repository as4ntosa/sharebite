# ShareBite

A food surplus marketplace that connects providers (restaurants, bakeries, grocers) with consumers looking to purchase surplus food at discounted prices. Built as a mobile-first Next.js app with a desktop iPhone preview frame.

## Screenshots

### Consumer
| Landing | Login | Home Feed | Search |
|---------|-------|-----------|--------|
| ![Landing](public/screenshots/01-landing.png) | ![Login](public/screenshots/02-login.png) | ![Home](public/screenshots/03-consumer-home.png) | ![Search](public/screenshots/04-search.png) |

| Listing Detail | Reservations | Profile |
|----------------|--------------|---------|
| ![Listing](public/screenshots/05-listing-detail.png) | ![Reservations](public/screenshots/06-reservations.png) | ![Profile](public/screenshots/07-consumer-profile.png) |

### Provider
| Dashboard | Listings | Create Listing |
|-----------|----------|----------------|
| ![Dashboard](public/screenshots/08-provider-dashboard.png) | ![Listings](public/screenshots/09-provider-listings.png) | ![Create](public/screenshots/10-create-listing.png) |

## Overview

ShareBite helps reduce food waste by letting food businesses list surplus items at 30–70% discounts. Consumers browse nearby listings, filter by category or cuisine, and reserve items for pickup.

## Tech Stack

- **Next.js 16** (App Router)
- **React 18** with Context API + `useReducer`
- **Tailwind CSS 3.4** with custom green brand palette
- **Lucide React** for icons
- **TypeScript**
- No backend — all data is mocked and persisted via `localStorage`

## Getting Started

```bash
npm install
npm run dev       # http://localhost:3000
npm run build
npm run lint
```

### Demo Accounts

| Role     | Email                    | Password  |
|----------|--------------------------|-----------|
| Consumer | alex@example.com         | demo123   |
| Provider | maria@freshbowl.com      | demo123   |
| Provider | james@goldenloaf.com     | demo123   |
| Provider | priya@freshmart.com      | demo123   |

## Features

### Consumer
- Browse nearby food listings with expiry countdowns and distance
- Filter by category (Fruits, Meals, Baked Goods, etc.) and cuisine tags
- Full-text search with price range filters
- Reserve items with quantity picker (1–5)
- View reservations with confirmation codes, pickup windows, and status
- Edit profile (name, location, contact info)

### Provider
- Dashboard with stats: active listings, total reservations, revenue
- Create listings with photos, pricing, pickup windows, and cuisine tags
- Manage listings: edit, toggle availability, delete
- Listings auto-update status to `sold_out` when fully reserved

## Architecture

### Route Groups

```
src/app/
├── (consumer)/
│   ├── home/          # Listing feed with category filters
│   ├── search/        # Advanced search and filtering
│   ├── listing/[id]/  # Listing detail + reservation flow
│   ├── reservations/  # Order history
│   └── profile/       # Consumer profile
├── (provider)/
│   ├── dashboard/     # Stats and recent listings
│   ├── listings/      # Listing management
│   ├── listings/create/
│   └── provider-profile/
├── login/             # Login + signup tabs
└── onboarding/        # Role selection + setup flow
```

### State Management

**`AuthContext`** — user session and role, persisted to `localStorage`
- Methods: `login`, `signup`, `logout`, `updateProfile`, `setRole`

**`DataContext`** — listings and reservations via `useReducer`
- Methods: `getListings`, `getListing`, `getProviderListings`, `getConsumerReservations`, `createListing`, `updateListing`, `deleteListing`, `reserveListing`, `cancelReservation`

### Data Models

```typescript
type UserRole = 'consumer' | 'provider'
type Category = 'Fruits' | 'Vegetables' | 'Baked Goods' | 'Meals' | 'Drinks' | 'Snacks' | 'Dairy' | 'Pantry Goods'
type ListingStatus = 'available' | 'reserved' | 'sold_out' | 'expired'
type ReservationStatus = 'confirmed' | 'picked_up' | 'cancelled'
```

Full types defined in `src/types/index.ts`. Mock data (12 listings, 4 users, 2 reservations) lives in `src/lib/mock-data.ts`.

### Key Conventions

- Path alias `@/*` → `src/*`
- `cn()` utility in `src/lib/utils.ts` wraps `clsx` + `tailwind-merge`
- Remote images only from `images.unsplash.com`
- Mobile-first; `IPhoneFrame` component renders a device mockup on desktop
- Custom green brand palette (`brand-50` through `brand-900`) in `tailwind.config.js`

## Testing

Playwright is configured for E2E tests:

```bash
npx playwright test
```
