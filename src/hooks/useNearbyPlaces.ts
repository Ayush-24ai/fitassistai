import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Location {
  lat: number;
  lng: number;
}

interface NearbyPlace {
  name: string;
  address: string;
  distance: string;
  distanceKm: number;
  specialty: string;
  lat: number;
  lng: number;
  rating?: number;
  isOpen?: boolean;
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export function useNearbyPlaces() {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const searchNearbyPlaces = useCallback(async (
    location: Location,
    specialty: string = 'hospital'
  ): Promise<NearbyPlace[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Search using Overpass API (OpenStreetMap data)
      const searchRadius = 5000; // 5km radius
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:${searchRadius},${location.lat},${location.lng});
          node["amenity"="clinic"](around:${searchRadius},${location.lat},${location.lng});
          node["amenity"="doctors"](around:${searchRadius},${location.lat},${location.lng});
          node["healthcare"="hospital"](around:${searchRadius},${location.lat},${location.lng});
          node["healthcare"="clinic"](around:${searchRadius},${location.lat},${location.lng});
          node["healthcare"="doctor"](around:${searchRadius},${location.lat},${location.lng});
          way["amenity"="hospital"](around:${searchRadius},${location.lat},${location.lng});
          way["amenity"="clinic"](around:${searchRadius},${location.lat},${location.lng});
        );
        out center;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch nearby places');
      }

      const data = await response.json();

      const nearbyPlaces: NearbyPlace[] = data.elements
        .filter((el: any) => el.tags?.name)
        .map((el: any) => {
          const lat = el.lat || el.center?.lat;
          const lng = el.lon || el.center?.lon;
          const distanceKm = calculateDistance(location.lat, location.lng, lat, lng);

          return {
            name: el.tags.name,
            address: [
              el.tags['addr:street'],
              el.tags['addr:city'],
              el.tags['addr:postcode']
            ].filter(Boolean).join(', ') || 'Address not available',
            distance: formatDistance(distanceKm),
            distanceKm,
            specialty: el.tags.healthcare || el.tags.amenity || specialty,
            lat,
            lng,
            isOpen: undefined, // OpenStreetMap doesn't provide real-time open/close status
          };
        })
        .sort((a: NearbyPlace, b: NearbyPlace) => a.distanceKm - b.distanceKm)
        .slice(0, 10); // Limit to 10 results

      if (nearbyPlaces.length === 0) {
        // If no real results, show demo data
        return generateDemoPlaces(location, specialty);
      }

      setPlaces(nearbyPlaces);
      return nearbyPlaces;
    } catch (err) {
      console.error('Error fetching nearby places:', err);
      setError('Unable to fetch nearby places. Showing demo data.');
      
      // Return demo data on error
      const demoPlaces = generateDemoPlaces(location, specialty);
      setPlaces(demoPlaces);
      
      toast({
        title: 'Using demo data',
        description: 'Could not connect to map service. Showing sample locations.',
      });
      
      return demoPlaces;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    places,
    isLoading,
    error,
    searchNearbyPlaces,
  };
}

// Generate demo places around a location
function generateDemoPlaces(location: Location, specialty: string): NearbyPlace[] {
  const demoOffsets = [
    { lat: 0.005, lng: 0.003 },
    { lat: -0.008, lng: 0.006 },
    { lat: 0.012, lng: -0.004 },
    { lat: -0.003, lng: -0.009 },
    { lat: 0.007, lng: 0.011 },
  ];

  const demoNames = [
    'City Medical Center',
    'Central Hospital',
    'Community Health Clinic',
    'Metro Care Hospital',
    'Family Health Center',
  ];

  return demoOffsets.map((offset, i) => {
    const lat = location.lat + offset.lat;
    const lng = location.lng + offset.lng;
    const distanceKm = calculateDistance(location.lat, location.lng, lat, lng);

    return {
      name: demoNames[i],
      address: `Demo Address ${i + 1}, Medical District`,
      distance: formatDistance(distanceKm),
      distanceKm,
      specialty: specialty || 'General Medicine',
      lat,
      lng,
      rating: 4.0 + Math.random() * 0.9,
      isOpen: Math.random() > 0.3,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}
