import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
  lat: number;
  lng: number;
}

interface NearbyPlace {
  name: string;
  address: string;
  distance: string;
  specialty: string;
  lat: number;
  lng: number;
  rating?: number;
  isOpen?: boolean;
}

interface LeafletMapProps {
  userLocation: Location | null;
  places: NearbyPlace[];
  onPlaceClick?: (place: NearbyPlace) => void;
  className?: string;
}

// Custom icon for user location
const createUserIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
        <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
      </div>
    `,
    className: 'user-location-marker',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

// Custom icon for places
const createPlaceIcon = (isOpen?: boolean) => {
  const color = isOpen === false ? '#6b7280' : '#059669';
  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg" style="background-color: ${color}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      </div>
    `,
    className: 'place-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export function LeafletMap({ userLocation, places, onPlaceClick, className = '' }: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Default center (will be updated when user location is available)
    const defaultCenter: L.LatLngExpression = [28.6139, 77.2090]; // Delhi as default
    const defaultZoom = 13;

    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: true,
      attributionControl: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    setIsMapReady(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map when user location changes
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    // Center on user location
    mapRef.current.setView([userLocation.lat, userLocation.lng], 14);

    // Add user location marker
    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: createUserIcon(),
    })
      .addTo(mapRef.current)
      .bindPopup('<strong>Your Location</strong>');

    return () => {
      userMarker.remove();
    };
  }, [userLocation, isMapReady]);

  // Update markers when places change
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add place markers
    places.forEach((place) => {
      if (!mapRef.current) return;

      const marker = L.marker([place.lat, place.lng], {
        icon: createPlaceIcon(place.isOpen),
      })
        .addTo(mapRef.current)
        .bindPopup(`
          <div class="p-2 min-w-[200px]">
            <h3 class="font-semibold text-sm mb-1">${place.name}</h3>
            <p class="text-xs text-gray-600 mb-1">${place.address}</p>
            <div class="flex items-center gap-2 text-xs">
              <span>${place.distance}</span>
              ${place.rating ? `<span class="text-yellow-500">★ ${place.rating}</span>` : ''}
              ${place.isOpen !== undefined ? `<span class="${place.isOpen ? 'text-green-600' : 'text-gray-500'}">${place.isOpen ? 'Open' : 'Closed'}</span>` : ''}
            </div>
          </div>
        `);

      marker.on('click', () => {
        onPlaceClick?.(place);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if we have places and user location
    if (places.length > 0 && userLocation) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        ...places.map(p => [p.lat, p.lng] as [number, number])
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [places, userLocation, isMapReady, onPlaceClick]);

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-48 rounded-xl overflow-hidden border border-border ${className}`}
      style={{ minHeight: '192px' }}
    />
  );
}
