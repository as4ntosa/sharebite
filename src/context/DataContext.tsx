'use client';

import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { Listing, Reservation, ListingFilters, ReservationStatus } from '@/types';
import { MOCK_LISTINGS, MOCK_RESERVATIONS } from '@/lib/mock-data';
import { generateId, generateCode } from '@/lib/utils';
import {
  supabase,
  isSupabaseEnabled,
  dbListingToListing,
  listingToDb,
  reservationToDb,
} from '@/lib/supabase';

// ─── Reducer ──────────────────────────────────────────────────────────────

interface DataState {
  listings: Listing[];
  reservations: Reservation[];
}

type DataAction =
  | { type: 'SET_LISTINGS'; listings: Listing[] }
  | { type: 'ADD_LISTING'; listing: Listing }
  | { type: 'UPDATE_LISTING'; id: string; data: Partial<Listing> }
  | { type: 'DELETE_LISTING'; id: string }
  | { type: 'SET_RESERVATIONS'; reservations: Reservation[] }
  | { type: 'ADD_RESERVATION'; reservation: Reservation }
  | { type: 'UPDATE_RESERVATION'; id: string; status: ReservationStatus };

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_LISTINGS':
      return { ...state, listings: action.listings };
    case 'ADD_LISTING':
      return { ...state, listings: [action.listing, ...state.listings] };
    case 'UPDATE_LISTING':
      return {
        ...state,
        listings: state.listings.map((l) =>
          l.id === action.id ? { ...l, ...action.data } : l
        ),
      };
    case 'DELETE_LISTING':
      return { ...state, listings: state.listings.filter((l) => l.id !== action.id) };
    case 'SET_RESERVATIONS':
      return { ...state, reservations: action.reservations };
    case 'ADD_RESERVATION':
      return { ...state, reservations: [action.reservation, ...state.reservations] };
    case 'UPDATE_RESERVATION':
      return {
        ...state,
        reservations: state.reservations.map((r) =>
          r.id === action.id ? { ...r, status: action.status } : r
        ),
      };
    default:
      return state;
  }
}

// ─── Context type ──────────────────────────────────────────────────────────

export type ListingsFetchStatus = 'loading' | 'live' | 'mock' | 'error';

interface DataContextValue {
  listings: Listing[];
  reservations: Reservation[];
  /** Whether the feed is showing live DB data, mock data, or still loading. */
  listingsFetchStatus: ListingsFetchStatus;
  getListings: (filters?: ListingFilters) => Listing[];
  getListing: (id: string) => Listing | undefined;
  getProviderListings: (providerId: string) => Listing[];
  getConsumerReservations: (consumerId: string) => Reservation[];
  createListing: (
    data: Omit<Listing, 'id' | 'createdAt' | 'quantityReserved' | 'status'>
  ) => Promise<Listing>;
  updateListing: (id: string, data: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  reserveListing: (
    listing: Listing,
    consumerId: string,
    consumerName: string,
    qty: number
  ) => Promise<Reservation>;
  cancelReservation: (id: string) => void;
  confirmPickup: (id: string) => void;
  cancelAtPickup: (id: string) => void;
  /** Refresh live listings from the database (no-op in mock mode). */
  refreshListings: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Mock listings tagged as sample so the UI can optionally distinguish them. */
const SAMPLE_LISTINGS: Listing[] = MOCK_LISTINGS.map((l) => ({ ...l, isSample: true }));

/**
 * Merge real (live) listings with sample/mock ones.
 * Real listings come first. Sample listings fill the feed when real ones are sparse.
 */
function mergeWithSamples(live: Listing[]): Listing[] {
  return [...live, ...SAMPLE_LISTINGS];
}

// ─── Provider ─────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, {
    listings: MOCK_LISTINGS, // Start with mock; replaced after Supabase fetch
    reservations: MOCK_RESERVATIONS,
  });
  const [listingsFetchStatus, setListingsFetchStatus] =
    React.useState<ListingsFetchStatus>(isSupabaseEnabled ? 'loading' : 'mock');

  // ── Fetch live listings from Supabase ─────────────────────────────────
  const refreshListings = useCallback(async () => {
    if (!isSupabaseEnabled || !supabase) return;
    setListingsFetchStatus('loading');
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .in('status', ['available', 'reserved', 'sold_out'])
      .order('created_at', { ascending: false });

    if (error || !data) {
      setListingsFetchStatus('error');
      // Keep whatever is in state (mock data on first load)
      return;
    }

    const liveListings = (data as Record<string, unknown>[]).map(dbListingToListing) as Listing[];
    // Show live listings + sample listings as a padding fallback
    dispatch({ type: 'SET_LISTINGS', listings: mergeWithSamples(liveListings) });
    setListingsFetchStatus('live');
  }, []);

  // Fetch reservations for the current consumer (best-effort; not critical)
  const refreshReservations = useCallback(async (consumerId: string) => {
    if (!isSupabaseEnabled || !supabase) return;
    const { data } = await supabase
      .from('reservations')
      .select('*, listing:listings(*)')
      .eq('consumer_id', consumerId)
      .order('created_at', { ascending: false });

    if (!data) return;

    const reservations: Reservation[] = (data as Record<string, unknown>[]).map((row) => ({
      id: row.id as string,
      listingId: row.listing_id as string,
      listing: dbListingToListing(row.listing) as Listing,
      consumerId: row.consumer_id as string,
      consumerName: row.consumer_name as string,
      quantity: Number(row.quantity),
      totalPrice: Number(row.total_price),
      status: row.status as ReservationStatus,
      confirmationCode: row.confirmation_code as string,
      createdAt: row.created_at as string,
    }));
    dispatch({ type: 'SET_RESERVATIONS', reservations });
  }, []);

  useEffect(() => {
    refreshListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Expose reservations refresh to listing detail page via context ─────
  // (Called from reserveListing after writing to DB)
  const _refreshReservationsFor = refreshReservations;

  // ── Queries ───────────────────────────────────────────────────────────

  const getListings = (filters?: ListingFilters): Listing[] => {
    let results = state.listings.filter((l) => l.status === 'available');
    if (!filters) return results;

    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.businessName.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
      );
    }
    if (filters.category) {
      results = results.filter((l) => l.category === filters.category);
    }
    if (filters.city) {
      results = results.filter((l) =>
        l.pickupCity.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }
    if (filters.minPrice !== undefined) {
      results = results.filter((l) => l.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      results = results.filter((l) => l.price <= filters.maxPrice!);
    }
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((l) => filters.tags!.some((t) => l.tags.includes(t)));
    }
    if (filters.excludeAllergens && filters.excludeAllergens.length > 0) {
      results = results.filter(
        (l) => !filters.excludeAllergens!.some((a) => l.allergens?.includes(a))
      );
    }
    return results;
  };

  const getListing = (id: string) => state.listings.find((l) => l.id === id);

  const getProviderListings = (providerId: string) =>
    state.listings.filter((l) => l.providerId === providerId && !l.isSample);

  const getConsumerReservations = (consumerId: string) =>
    state.reservations.filter((r) => r.consumerId === consumerId);

  // ── Mutations ──────────────────────────────────────────────────────────

  const createListing = async (
    data: Omit<Listing, 'id' | 'createdAt' | 'quantityReserved' | 'status'>
  ): Promise<Listing> => {
    const now = new Date().toISOString();

    if (isSupabaseEnabled && supabase) {
      const dbRow = listingToDb(data);
      const { data: inserted, error } = await supabase
        .from('listings')
        .insert(dbRow)
        .select()
        .single();

      if (error || !inserted) {
        throw new Error(error?.message ?? 'Failed to save listing');
      }

      const listing = dbListingToListing(inserted as Record<string, unknown>) as Listing;
      // Prepend to local state (optimistic — real data already in DB)
      dispatch({ type: 'ADD_LISTING', listing });
      return listing;
    }

    // Mock mode — local state only
    const listing: Listing = {
      ...data,
      id: generateId(),
      createdAt: now,
      quantityReserved: 0,
      status: 'available',
    };
    dispatch({ type: 'ADD_LISTING', listing });
    return listing;
  };

  const updateListing = async (id: string, data: Partial<Listing>) => {
    dispatch({ type: 'UPDATE_LISTING', id, data });

    if (isSupabaseEnabled && supabase) {
      // Only update fields that map to DB columns (skip frontend-only fields)
      const { isSample: _s, distance: _d, ...rest } = data as Listing;
      const dbFields: Record<string, unknown> = {};
      if (rest.status) dbFields.status = rest.status;
      if (rest.quantity !== undefined) dbFields.quantity = rest.quantity;
      if (rest.quantityReserved !== undefined) dbFields.quantity_reserved = rest.quantityReserved;
      if (rest.title) dbFields.title = rest.title;
      if (rest.description) dbFields.description = rest.description;
      if (rest.price !== undefined) dbFields.price = rest.price;
      if (Object.keys(dbFields).length > 0) {
        await supabase.from('listings').update(dbFields).eq('id', id);
      }
    }
  };

  const deleteListing = async (id: string) => {
    dispatch({ type: 'DELETE_LISTING', id });
    if (isSupabaseEnabled && supabase) {
      await supabase.from('listings').delete().eq('id', id);
    }
  };

  const reserveListing = async (
    listing: Listing,
    consumerId: string,
    consumerName: string,
    qty: number
  ): Promise<Reservation> => {
    const code = `NN-${generateCode()}`;
    const now = new Date().toISOString();

    const reservation: Reservation = {
      id: generateId(),
      listingId: listing.id,
      listing,
      consumerId,
      consumerName,
      quantity: qty,
      totalPrice: listing.price * qty,
      status: 'confirmed',
      confirmationCode: code,
      createdAt: now,
    };

    // Update quantity locally (optimistic)
    const newReserved = listing.quantityReserved + qty;
    const newStatus = newReserved >= listing.quantity ? 'sold_out' : 'available';
    dispatch({ type: 'ADD_RESERVATION', reservation });
    dispatch({
      type: 'UPDATE_LISTING',
      id: listing.id,
      data: { quantityReserved: newReserved, status: newStatus },
    });

    if (isSupabaseEnabled && supabase && !listing.isSample) {
      // Persist reservation to DB
      const dbRow = reservationToDb({
        listingId: listing.id,
        consumerId,
        consumerName,
        quantity: qty,
        totalPrice: listing.price * qty,
        confirmationCode: code,
      });
      await supabase.from('reservations').insert(dbRow);

      // Update listing quantity in DB
      await supabase
        .from('listings')
        .update({ quantity_reserved: newReserved, status: newStatus })
        .eq('id', listing.id);
    }

    return reservation;
  };

  const cancelReservation = async (id: string) => {
    const res = state.reservations.find((r) => r.id === id);
    if (!res) return;
    dispatch({ type: 'UPDATE_RESERVATION', id, status: 'cancelled' });
    const restored = Math.max(0, res.listing.quantityReserved - res.quantity);
    dispatch({
      type: 'UPDATE_LISTING',
      id: res.listingId,
      data: { quantityReserved: restored, status: 'available' },
    });
    if (isSupabaseEnabled && supabase) {
      await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id);
      await supabase
        .from('listings')
        .update({ quantity_reserved: restored, status: 'available' })
        .eq('id', res.listingId);
    }
  };

  const confirmPickup = (id: string) => {
    dispatch({ type: 'UPDATE_RESERVATION', id, status: 'picked_up' });
    if (isSupabaseEnabled && supabase) {
      supabase.from('reservations').update({ status: 'picked_up' }).eq('id', id);
    }
  };

  const cancelAtPickup = (id: string) => {
    const res = state.reservations.find((r) => r.id === id);
    if (!res) return;
    dispatch({ type: 'UPDATE_RESERVATION', id, status: 'cancelled_at_pickup' });
    const restored = Math.max(0, res.listing.quantityReserved - res.quantity);
    dispatch({
      type: 'UPDATE_LISTING',
      id: res.listingId,
      data: { quantityReserved: restored, status: 'available' },
    });
    if (isSupabaseEnabled && supabase) {
      supabase.from('reservations').update({ status: 'cancelled_at_pickup' }).eq('id', id);
      supabase
        .from('listings')
        .update({ quantity_reserved: restored, status: 'available' })
        .eq('id', res.listingId);
    }
  };

  return (
    <DataContext.Provider
      value={{
        listings: state.listings,
        reservations: state.reservations,
        listingsFetchStatus,
        getListings,
        getListing,
        getProviderListings,
        getConsumerReservations,
        createListing,
        updateListing,
        deleteListing,
        reserveListing,
        cancelReservation,
        confirmPickup,
        cancelAtPickup,
        refreshListings,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
