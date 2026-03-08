'use client';

import { useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { formatDistance } from '@/lib/utils';

interface PickupMapProps {
  lat: number;
  lng: number;
  address: string;
  /** Optional: user's current location to show distance and a second pin */
  userLat?: number;
  userLng?: number;
  /** Allow zoom and pan (default: false for compact views) */
  interactive?: boolean;
  /** Height in px (default: 200) */
  height?: number;
}

const buildOptions = (interactive: boolean): google.maps.MapOptions => ({
  disableDefaultUI: true,
  zoomControl: interactive,
  scrollwheel: interactive,
  draggable: interactive,
  clickableIcons: false,
  gestureHandling: interactive ? 'cooperative' : 'none',
  styles: [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  ],
});

function makeProviderPin() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24C32 7.163 24.837 0 16 0z" fill="#16a34a"/>
    <circle cx="16" cy="16" r="7" fill="white"/>
  </svg>`.trim();
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: 32, height: 40 } as google.maps.Size,
    anchor: { x: 16, y: 40 } as google.maps.Point,
  };
}

function makeUserPin() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#2563eb" opacity="0.18"/>
    <circle cx="12" cy="12" r="6" fill="#2563eb"/>
    <circle cx="12" cy="12" r="3" fill="white"/>
  </svg>`.trim();
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: 24, height: 24 } as google.maps.Size,
    anchor: { x: 12, y: 12 } as google.maps.Point,
  };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function PickupMap({
  lat, lng, address,
  userLat, userLng,
  interactive = false,
  height = 200,
}: PickupMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const hasUser = userLat != null && userLng != null;
  const distanceKm = hasUser ? haversineKm(userLat!, userLng!, lat, lng) : null;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: 'nibblenet-map-script',
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    if (hasUser) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat, lng });
      bounds.extend({ lat: userLat!, lng: userLng! });
      map.fitBounds(bounds, 60);
    } else {
      map.setCenter({ lat, lng });
      map.setZoom(15);
    }
  }, [lat, lng, userLat, userLng, hasUser]);

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return (
      <div className="mt-3 rounded-2xl overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MapPin size={13} className="text-brand-500 shrink-0" />
            <span className="truncate font-medium">{address}</span>
          </div>
          {distanceKm !== null && (
            <span className="text-xs font-bold text-brand-600 ml-2 shrink-0">
              {formatDistance(distanceKm)}
            </span>
          )}
        </div>
        <div className="bg-gray-100 flex items-center justify-center" style={{ height: height - 44 }}>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline"
          >
            <ExternalLink size={12} />
            Open in Google Maps
          </a>
        </div>
      </div>
    );
  }

  if (loadError || !isLoaded) {
    return (
      <div className="rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center mt-3" style={{ height }}>
        {loadError
          ? <p className="text-xs text-red-400">Map unavailable</p>
          : <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        }
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl overflow-hidden relative" style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat, lng }}
        zoom={15}
        options={buildOptions(interactive)}
        onLoad={onLoad}
      >
        {/* Provider pickup pin — green */}
        <Marker
          position={{ lat, lng }}
          icon={makeProviderPin()}
          title="Pickup location"
          zIndex={20}
        />

        {/* User location pin — blue dot */}
        {hasUser && (
          <Marker
            position={{ lat: userLat!, lng: userLng! }}
            icon={makeUserPin()}
            title="Your location"
            zIndex={10}
          />
        )}
      </GoogleMap>

      {/* Distance badge overlay */}
      {distanceKm !== null && (
        <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm shadow rounded-xl px-2.5 py-1 flex items-center gap-1.5">
          <Navigation size={11} className="text-blue-600 fill-blue-600" />
          <span className="text-[11px] font-bold text-gray-800">{formatDistance(distanceKm)} away</span>
        </div>
      )}

      {/* Get Directions button */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white shadow-md rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <ExternalLink size={11} className="text-brand-600" />
        Directions
      </a>
    </div>
  );
}
