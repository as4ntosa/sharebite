import { MOCK_LISTINGS } from '@/lib/mock-data';
import ListingDetailClient from './ListingDetailClient';

/**
 * Pre-generate a static page for every mock listing at build time.
 * This converts the route from ƒ (Dynamic / SSR) to ○ (Static),
 * eliminating all timing and context-hydration issues on Vercel.
 */
export function generateStaticParams() {
  return MOCK_LISTINGS.map((l) => ({ id: l.id }));
}

export default function ListingDetailPage() {
  return <ListingDetailClient />;
}
