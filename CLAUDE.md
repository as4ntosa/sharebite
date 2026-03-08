# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
```

No test runner is configured beyond Playwright (no `npm test` script). Playwright tests can be run with `npx playwright test`.

## Architecture

**NibbleNet** is a food surplus marketplace — a client-side Next.js app (App Router) with no backend. All data is mocked and persisted via `localStorage`.

### State Management

Two React Contexts power the app:

- `AuthContext` (`src/context/AuthContext.tsx`) — user session, provider status, localStorage persistence. Methods: `login`, `signup`, `logout`, `updateProfile`, `setRole`, `applyForProvider`, `approveProvider`.
- `DataContext` (`src/context/DataContext.tsx`) — listings and reservations via `useReducer`. All filtering/searching is done in-memory on the client. Supports allergen exclusion filtering.

### User Model

All users start as standard consumers. Provider access requires completing a separate approval flow:

- `providerStatus: 'none'` — default, browse only
- `providerStatus: 'pending'` — application submitted, awaiting review
- `providerStatus: 'approved'` — full provider access
- `providerStatus: 'rejected'` — application denied

### Route Groups

- **Consumer** routes under `src/app/(consumer)/` — accessible to all logged-in users
- **Provider** routes under `src/app/(provider)/` — gated to `providerStatus === 'approved'` only
- **Auth routes**: `/login`, `/onboarding`
- **Provider flow**: `/become-a-provider`, `/provider-apply`, `/provider-pending`

### Key Conventions

- Path alias `@/*` maps to `src/*`
- Tailwind utility classes merged via `cn()` from `src/lib/utils.ts` (wraps `clsx` + `tailwind-merge`)
- Custom green brand palette defined in `tailwind.config.js`
- Mobile-first layout; `iPhoneFrame` component wraps content for desktop preview
- Remote images only from `images.unsplash.com` (configured in `next.config.js`)
- Mock data lives in `src/lib/mock-data.ts`; shared types in `src/types/index.ts`
- localStorage key: `nibblen_user`
- Confirmation codes prefixed `NN-`
