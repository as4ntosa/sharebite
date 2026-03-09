'use client';

import React, { createContext, useContext, useReducer } from 'react';
import { Listing, Reservation, ListingFilters, ReservationStatus } from '@/types';
import { MOCK_LISTINGS, MOCK_RESERVATIONS } from '@/lib/mock-data';
import { generateId, generateCode } from '@/lib/utils';

interface DataState {
  listings: Listing[];
  reservations: Reservation[];
}

type DataAction =
  | { type: 'ADD_LISTING'; listing: Listing }
  | { type: 'UPDATE_LISTING'; id: string; data: Partial<Listing> }
  | { type: 'DELETE_LISTING'; id: string }
  | { type: 'ADD_RESERVATION'; reservation: Reservation }
  | { type: 'UPDATE_RESERVATION'; id: string; status: ReservationStatus };

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
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

interface DataContextValue {
  listings: Listing[];
  reservations: Reservation[];
  getListings: (filters?: ListingFilters) => Listing[];
  getListing: (id: string) => Listing | undefined;
  getProviderListings: (providerId: string) => Listing[];
  getConsumerReservations: (consumerId: string) => Reservation[];
  createListing: (data: Omit<Listing, 'id' | 'createdAt' | 'quantityReserved' | 'status'>) => Listing;
  updateListing: (id: string, data: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  reserveListing: (listing: Listing, consumerId: string, consumerName: string, qty: number) => Reservation;
  cancelReservation: (id: string) => void;
  confirmPickup: (id: string) => void;
  cancelAtPickup: (id: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, {
    listings: MOCK_LISTINGS,
    reservations: MOCK_RESERVATIONS,
  });

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

  const createListing = (
    data: Omit<Listing, 'id' | 'createdAt' | 'quantityReserved' | 'status'>
  ): Listing => {
    const listing: Listing = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      quantityReserved: 0,
      status: 'available',
    };
    dispatch({ type: 'ADD_LISTING', listing });
    return listing;
  };

  const updateListing = (id: string, data: Partial<Listing>) => {
    dispatch({ type: 'UPDATE_LISTING', id, data });
  };

  const deleteListing = (id: string) => {
    dispatch({ type: 'DELETE_LISTING', id });
  };

  const reserveListing = (
    listing: Listing,
    consumerId: string,
    consumerName: string,
    qty: number
  ): Reservation => {
    const reservation: Reservation = {
      id: generateId(),
      listingId: listing.id,
      listing,
      consumerId,
      consumerName,
      quantity: qty,
      totalPrice: listing.price * qty,
      status: 'confirmed',
      confirmationCode: `NN-${generateCode()}`,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_RESERVATION', reservation });
    const newReserved = listing.quantityReserved + qty;
    const newStatus = newReserved >= listing.quantity ? 'sold_out' : 'available';
    dispatch({
      type: 'UPDATE_LISTING',
      id: listing.id,
      data: { quantityReserved: newReserved, status: newStatus },
    });
    return reservation;
  };

  const cancelReservation = (id: string) => {
    const res = state.reservations.find((r) => r.id === id);
    if (!res) return;
    dispatch({ type: 'UPDATE_RESERVATION', id, status: 'cancelled' });
    dispatch({
      type: 'UPDATE_LISTING',
      id: res.listingId,
      data: {
        quantityReserved: Math.max(0, res.listing.quantityReserved - res.quantity),
        status: 'available',
      },
    });
  };

  const confirmPickup = (id: string) => {
    dispatch({ type: 'UPDATE_RESERVATION', id, status: 'picked_up' });
  };

  const cancelAtPickup = (id: string) => {
    const res = state.reservations.find((r) => r.id === id);
    if (!res) return;
    dispatch({ type: 'UPDATE_RESERVATION', id, status: 'cancelled_at_pickup' });
    dispatch({
      type: 'UPDATE_LISTING',
      id: res.listingId,
      data: {
        quantityReserved: Math.max(0, res.listing.quantityReserved - res.quantity),
        status: 'available',
      },
    });
  };

  return (
    <DataContext.Provider
      value={{
        listings: state.listings,
        reservations: state.reservations,
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
