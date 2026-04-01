'use client';

import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { Listing, Reservation, ListingFilters, ReservationStatus } from '@/types';
import { MOCK_LISTINGS, MOCK_RESERVATIONS } from '@/lib/mock-data';
import { generateCode } from '@/lib/utils';
import { supabase, isSupabaseEnabled, dbListingToListing, listingToDb, dbReservationToReservation } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

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
  listingsFetchStatus: ListingsFetchStatus;
  getListings: (filters?: ListingFilters) => Listing[];
  getListing: (id: string) => Listing | undefined;
  getProviderListings: (providerId: string) => Listing[];
  getConsumerReservations: (consumerId: string) => Reservation[];
  createListing: (data: Omit<Listing, 'id' | 'createdAt' | 'quantityReserved' | 'status'>) => Promise<Listing>;
  updateListing: (id: string, data: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  reserveListing: (listing: Listing, consumerId: string, consumerName: string, qty: number) => Promise<Reservation>;
  cancelReservation: (id: string) => void;
  confirmPickup: (id: string) => void;
  cancelAtPickup: (id: string) => void;
  refreshListings: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth();

  const [state, dispatch] = useReducer(dataReducer, {
    listings: isSupabaseEnabled ? [] : MOCK_LISTINGS,
    reservations: isSupabaseEnabled ? [] : MOCK_RESERVATIONS,
  });

  const [listingsFetchStatus, setListingsFetchStatus] = useState<ListingsFetchStatus>(
    isSupabaseEnabled ? 'loading' : 'mock'
  );

  // ── Supabase data loading ──────────────────────────────────────

  const refreshListings = async () => {
    if (!isSupabaseEnabled || !supabase) return;
    setListingsFetchStatus('loading');
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'available')
      .eq('is_sample', false)
      .order('created_at', { ascending: false });
    if (error) { setListingsFetchStatus('error'); return; }
    dispatch({ type: 'SET_LISTINGS', listings: data.map(dbListingToListing) });
    setListingsFetchStatus('live');
  };

  // Load public listings on mount
  useEffect(() => {
    if (isSupabaseEnabled) refreshListings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load provider's own listings (all statuses) when in provider mode
  useEffect(() => {
    if (!isSupabaseEnabled || !supabase || !user || user.currentMode !== 'provider') return;
    supabase
      .from('listings')
      .select('*')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const providerListings = data.map(dbListingToListing);
        const ids = new Set(providerListings.map((l) => l.id));
        dispatch({
          type: 'SET_LISTINGS',
          listings: [...providerListings, ...state.listings.filter((l) => !ids.has(l.id))],
        });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.currentMode, user?.id]);

  // Load user's reservations when logged in
  useEffect(() => {
    if (!isSupabaseEnabled || !supabase || !user?.id) return;
    supabase
      .from('reservations')
      .select('*')
      .eq('consumer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) dispatch({ type: 'SET_RESERVATIONS', reservations: data.map(dbReservationToReservation) });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Queries ───────────────────────────────────────────────────

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
    if (filters.category) results = results.filter((l) => l.category === filters.category);
    if (filters.city) results = results.filter((l) => l.pickupCity.toLowerCase().includes(filters.city!.toLowerCase()));
    if (filters.minPrice !== undefined) results = results.filter((l) => l.price >= filters.minPrice!);
    if (filters.maxPrice !== undefined) results = results.filter((l) => l.price <= filters.maxPrice!);
    if (filters.tags && filters.tags.length > 0) results = results.filter((l) => filters.tags!.some((t) => l.tags.includes(t)));
    if (filters.excludeAllergens && filters.excludeAllergens.length > 0) {
      results = results.filter((l) => !filters.excludeAllergens!.some((a) => l.allergens?.includes(a)));
    }
    return results;
  };

  const getListing = (id: string) => state.listings.find((l) => l.id === id);

  const getProviderListings = (providerId: string) =>
    state.listings.filter((l) => l.providerId === providerId && !l.isSample);

  const getConsumerReservations = (consumerId: string) =>
    state.reservations.filter((r) => r.consumerId === consumerId);

  // ── Mutations ──────────────────────────────────────────────────

  const createListing = async (
    data: Omit<Listing, 'id' | 'createdAt' | 'quantityReserved' | 'status'>
  ): Promise<Listing> => {
    if (isSupabaseEnabled && supabase) {
      if (!accessToken) throw new Error('Not authenticated. Please sign in again.');

      const dbRow = listingToDb(data);
      const res = await fetch('/api/listings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(dbRow),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error ?? 'Failed to create listing');
      }
      const inserted = await res.json();
      const listing = dbListingToListing(inserted);
      dispatch({ type: 'ADD_LISTING', listing });
      return listing;
    }

    const listing: Listing = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      quantityReserved: 0,
      status: 'available',
    };
    dispatch({ type: 'ADD_LISTING', listing });
    return listing;
  };

  const updateListing = async (id: string, data: Partial<Listing>) => {
    if (isSupabaseEnabled && supabase) {
      // Convert camelCase partial to snake_case for DB
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbData: Record<string, any> = {};
      if ('title' in data) dbData.title = data.title;
      if ('description' in data) dbData.description = data.description;
      if ('price' in data) dbData.price = data.price;
      if ('originalPrice' in data) dbData.original_price = data.originalPrice;
      if ('quantity' in data) dbData.quantity = data.quantity;
      if ('quantityReserved' in data) dbData.quantity_reserved = data.quantityReserved;
      if ('status' in data) dbData.status = data.status;
      if ('allergens' in data) dbData.allergens = data.allergens;
      if ('tags' in data) dbData.tags = data.tags;
      if ('expiresAt' in data) dbData.expires_at = data.expiresAt;
      if ('pickupInstructions' in data) dbData.pickup_instructions = data.pickupInstructions;
      if ('imageUrl' in data) dbData.image_url = data.imageUrl;
      if (Object.keys(dbData).length > 0) {
        await supabase.from('listings').update(dbData).eq('id', id);
      }
    }
    dispatch({ type: 'UPDATE_LISTING', id, data });
  };

  const deleteListing = async (id: string) => {
    if (isSupabaseEnabled && supabase) {
      await supabase.from('listings').delete().eq('id', id);
    }
    dispatch({ type: 'DELETE_LISTING', id });
  };

  const reserveListing = async (
    listing: Listing,
    consumerId: string,
    consumerName: string,
    qty: number
  ): Promise<Reservation> => {
    const newReserved = listing.quantityReserved + qty;
    const newStatus = newReserved >= listing.quantity ? 'sold_out' : 'available';
    const confirmationCode = `NN-${generateCode()}`;

    if (isSupabaseEnabled && supabase) {
      const { data: resRow, error: resErr } = await supabase
        .from('reservations')
        .insert({
          listing_id: listing.id,
          listing_snapshot: listing,
          consumer_id: consumerId,
          consumer_name: consumerName,
          quantity: qty,
          total_price: listing.price * qty,
          status: 'confirmed',
          confirmation_code: confirmationCode,
        })
        .select()
        .single();
      if (resErr) throw new Error(resErr.message);

      await supabase
        .from('listings')
        .update({ quantity_reserved: newReserved, status: newStatus })
        .eq('id', listing.id);

      const reservation: Reservation = {
        id: resRow.id,
        listingId: listing.id,
        listing,
        consumerId,
        consumerName,
        quantity: qty,
        totalPrice: listing.price * qty,
        status: 'confirmed',
        confirmationCode,
        createdAt: resRow.created_at,
      };
      dispatch({ type: 'ADD_RESERVATION', reservation });
      dispatch({ type: 'UPDATE_LISTING', id: listing.id, data: { quantityReserved: newReserved, status: newStatus } });
      return reservation;
    }

    const reservation: Reservation = {
      id: crypto.randomUUID(),
      listingId: listing.id,
      listing,
      consumerId,
      consumerName,
      quantity: qty,
      totalPrice: listing.price * qty,
      status: 'confirmed',
      confirmationCode,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_RESERVATION', reservation });
    dispatch({ type: 'UPDATE_LISTING', id: listing.id, data: { quantityReserved: newReserved, status: newStatus } });
    return reservation;
  };

  const cancelReservation = async (id: string) => {
    const res = state.reservations.find((r) => r.id === id);
    if (!res) return;
    const restored = Math.max(0, res.listing.quantityReserved - res.quantity);
    if (isSupabaseEnabled && supabase) {
      await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id);
      await supabase.from('listings').update({ quantity_reserved: restored, status: 'available' }).eq('id', res.listingId);
    }
    dispatch({ type: 'UPDATE_RESERVATION', id, status: 'cancelled' });
    dispatch({ type: 'UPDATE_LISTING', id: res.listingId, data: { quantityReserved: restored, status: 'available' } });
  };

  const confirmPickup = async (id: string) => {
    if (isSupabaseEnabled && supabase) {
      await supabase.from('reservations').update({ status: 'picked_up' }).eq('id', id);
    }
    dispatch({ type: 'UPDATE_RESERVATION', id, status: 'picked_up' });
  };

  const cancelAtPickup = async (id: string) => {
    const res = state.reservations.find((r) => r.id === id);
    if (!res) return;
    const restored = Math.max(0, res.listing.quantityReserved - res.quantity);
    if (isSupabaseEnabled && supabase) {
      await supabase.from('reservations').update({ status: 'cancelled_at_pickup' }).eq('id', id);
      await supabase.from('listings').update({ quantity_reserved: restored, status: 'available' }).eq('id', res.listingId);
    }
    dispatch({ type: 'UPDATE_RESERVATION', id, status: 'cancelled_at_pickup' });
    dispatch({ type: 'UPDATE_LISTING', id: res.listingId, data: { quantityReserved: restored, status: 'available' } });
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
