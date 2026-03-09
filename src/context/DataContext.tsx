'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { Listing, Reservation, ListingFilters, ReservationStatus } from '@/types';
import { MOCK_LISTINGS, MOCK_RESERVATIONS } from '@/lib/mock-data';
import { generateId, generateCode } from '@/lib/utils';

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
  refreshListings: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, {
    listings: MOCK_LISTINGS,
    reservations: MOCK_RESERVATIONS,
  });
  const listingsFetchStatus: ListingsFetchStatus = 'mock';

  const refreshListings = useCallback(async () => {
    // No-op in mock mode
  }, []);

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
    state.listings.filter((l) => l.providerId === providerId);

  const getConsumerReservations = (consumerId: string) =>
    state.reservations.filter((r) => r.consumerId === consumerId);

  // ── Mutations ──────────────────────────────────────────────────────────

  const createListing = async (
    data: Omit<Listing, 'id' | 'createdAt' | 'quantityReserved' | 'status'>
  ): Promise<Listing> => {
    const now = new Date().toISOString();
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
  };

  const deleteListing = async (id: string) => {
    dispatch({ type: 'DELETE_LISTING', id });
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

    const newReserved = listing.quantityReserved + qty;
    const newStatus = newReserved >= listing.quantity ? 'sold_out' : 'available';
    dispatch({ type: 'ADD_RESERVATION', reservation });
    dispatch({
      type: 'UPDATE_LISTING',
      id: listing.id,
      data: { quantityReserved: newReserved, status: newStatus },
    });

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
  };

  const confirmPickup = (id: string) => {
    dispatch({ type: 'UPDATE_RESERVATION', id, status: 'picked_up' });
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
