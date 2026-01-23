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
  isDemo?: boolean;
}

// Doctor type to OSM healthcare specialization mapping
const doctorTypeToOsmTags: Record<string, string[]> = {
  'cardiologist': ['cardiology', 'heart', 'cardiac'],
  'orthopedic': ['orthopaedics', 'orthopedics', 'bone', 'joint'],
  'dermatologist': ['dermatology', 'skin'],
  'neurologist': ['neurology', 'brain', 'neuro'],
  'pediatrician': ['paediatrics', 'pediatrics', 'children'],
  'ophthalmologist': ['ophthalmology', 'eye', 'optometry'],
  'ent': ['otolaryngology', 'ear', 'nose', 'throat'],
  'psychiatrist': ['psychiatry', 'mental'],
  'gynecologist': ['gynaecology', 'gynecology', 'obstetrics'],
  'urologist': ['urology'],
  'gastroenterologist': ['gastroenterology', 'digestive'],
  'pulmonologist': ['pulmonology', 'respiratory', 'lung'],
  'endocrinologist': ['endocrinology', 'diabetes', 'thyroid'],
  'oncologist': ['oncology', 'cancer'],
  'rheumatologist': ['rheumatology'],
  'general physician': ['general_practice', 'general', 'family'],
  'general practitioner': ['general_practice', 'general', 'family'],
};

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

// Match doctor type with OSM specialty data
function matchesSpecialty(osmTags: Record<string, string>, doctorType: string): boolean {
  if (!doctorType) return true;
  
  const normalizedDoctorType = doctorType.toLowerCase().trim();
  const osmMappings = doctorTypeToOsmTags[normalizedDoctorType] || [];
  
  // Check healthcare:speciality tag
  const specialty = osmTags['healthcare:speciality']?.toLowerCase() || '';
  const name = osmTags['name']?.toLowerCase() || '';
  const description = osmTags['description']?.toLowerCase() || '';
  
  // Check if any mapping matches
  for (const mapping of osmMappings) {
    if (specialty.includes(mapping) || name.includes(mapping) || description.includes(mapping)) {
      return true;
    }
  }
  
  // Also check direct match
  if (specialty.includes(normalizedDoctorType) || name.includes(normalizedDoctorType)) {
    return true;
  }
  
  return false;
}

export function useNearbyPlaces() {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);
  const { toast } = useToast();

  const searchNearbyPlaces = useCallback(async (
    location: Location,
    doctorType: string = 'hospital'
  ): Promise<NearbyPlace[]> => {
    setIsLoading(true);
    setError(null);
    setIsUsingDemoData(false);

    try {
      // Search using Overpass API with 10km radius
      const searchRadius = 10000; // 10km radius
      const query = `
        [out:json][timeout:30];
        (
          node["amenity"="hospital"](around:${searchRadius},${location.lat},${location.lng});
          node["amenity"="clinic"](around:${searchRadius},${location.lat},${location.lng});
          node["amenity"="doctors"](around:${searchRadius},${location.lat},${location.lng});
          node["healthcare"="hospital"](around:${searchRadius},${location.lat},${location.lng});
          node["healthcare"="clinic"](around:${searchRadius},${location.lat},${location.lng});
          node["healthcare"="doctor"](around:${searchRadius},${location.lat},${location.lng});
          node["healthcare"="centre"](around:${searchRadius},${location.lat},${location.lng});
          way["amenity"="hospital"](around:${searchRadius},${location.lat},${location.lng});
          way["amenity"="clinic"](around:${searchRadius},${location.lat},${location.lng});
          way["healthcare"="hospital"](around:${searchRadius},${location.lat},${location.lng});
          way["healthcare"="clinic"](around:${searchRadius},${location.lat},${location.lng});
        );
        out center tags;
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

      // Process results
      let nearbyPlaces: NearbyPlace[] = data.elements
        .filter((el: any) => el.tags?.name)
        .map((el: any) => {
          const lat = el.lat || el.center?.lat;
          const lng = el.lon || el.center?.lon;
          const distanceKm = calculateDistance(location.lat, location.lng, lat, lng);

          // Build address from available tags
          const addressParts = [
            el.tags['addr:street'],
            el.tags['addr:housenumber'],
            el.tags['addr:city'],
            el.tags['addr:postcode']
          ].filter(Boolean);

          return {
            name: el.tags.name,
            address: addressParts.length > 0 ? addressParts.join(', ') : 'Address not available',
            distance: formatDistance(distanceKm),
            distanceKm,
            specialty: el.tags['healthcare:speciality'] || el.tags.healthcare || el.tags.amenity || 'Medical Facility',
            lat,
            lng,
            isOpen: undefined,
            isDemo: false,
            tags: el.tags, // Keep tags for filtering
          };
        })
        .filter((place: any) => place.distanceKm <= 10) // Strict 10km filter
        .sort((a: NearbyPlace, b: NearbyPlace) => a.distanceKm - b.distanceKm);

      // Try to filter by doctor specialization if specified
      if (doctorType && doctorType !== 'hospital') {
        const specializedPlaces = nearbyPlaces.filter((place: any) => 
          matchesSpecialty(place.tags || {}, doctorType)
        );
        
        // If we found specialized places, use them; otherwise fallback to all places
        if (specializedPlaces.length > 0) {
          nearbyPlaces = specializedPlaces;
        }
      }

      // Remove the tags property (not needed in final result)
      nearbyPlaces = nearbyPlaces.map(({ ...place }) => {
        delete (place as any).tags;
        return place;
      });

      // Limit to 15 results
      nearbyPlaces = nearbyPlaces.slice(0, 15);

      if (nearbyPlaces.length === 0) {
        // If no real results, show demo data
        const demoPlaces = generateDemoPlaces(location, doctorType);
        setPlaces(demoPlaces);
        setIsUsingDemoData(true);
        
        toast({
          title: 'Using sample locations',
          description: 'No medical facilities found nearby. Showing sample data for demonstration.',
        });
        
        return demoPlaces;
      }

      setPlaces(nearbyPlaces);
      return nearbyPlaces;
    } catch (err) {
      console.error('Error fetching nearby places:', err);
      setError('Unable to fetch nearby places. Showing demo data.');
      setIsUsingDemoData(true);
      
      // Return demo data on error
      const demoPlaces = generateDemoPlaces(location, doctorType);
      setPlaces(demoPlaces);
      
      toast({
        title: 'Using sample locations',
        description: 'Could not connect to map service. Showing sample data for demonstration.',
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
    isUsingDemoData,
    searchNearbyPlaces,
  };
}

// Generate demo places around a location with realistic medical facility names
function generateDemoPlaces(location: Location, doctorType: string): NearbyPlace[] {
  const specialtyNames: Record<string, string[]> = {
    'cardiologist': ['Heart Care Center', 'Cardiology Clinic', 'Cardiac Specialists'],
    'orthopedic': ['Bone & Joint Center', 'Ortho Care Hospital', 'Sports Medicine Clinic'],
    'dermatologist': ['Skin Care Clinic', 'Dermatology Center', 'Skin Health Hospital'],
    'neurologist': ['Brain & Spine Center', 'Neurology Clinic', 'Neuro Care Hospital'],
    'pediatrician': ['Children\'s Hospital', 'Kids Health Clinic', 'Pediatric Care Center'],
    'ophthalmologist': ['Eye Care Center', 'Vision Clinic', 'Ophthalmology Hospital'],
    'ent': ['ENT Specialists', 'Ear Nose Throat Clinic', 'ENT Care Center'],
    'psychiatrist': ['Mental Health Center', 'Psychiatry Clinic', 'Mind Care Hospital'],
    'gynecologist': ['Women\'s Health Center', 'Gynecology Clinic', 'Maternity Hospital'],
    'general physician': ['City Medical Center', 'Family Health Clinic', 'General Hospital'],
    'hospital': ['City Hospital', 'Medical Center', 'Community Health Clinic', 'Metro Hospital', 'Regional Medical Center'],
  };

  const normalizedType = doctorType?.toLowerCase().trim() || 'hospital';
  const names = specialtyNames[normalizedType] || specialtyNames['hospital'];

  // Create 5 demo locations within 10km
  const demoOffsets = [
    { lat: 0.008, lng: 0.006, dist: 1.2 },
    { lat: -0.015, lng: 0.012, dist: 2.4 },
    { lat: 0.025, lng: -0.010, dist: 3.8 },
    { lat: -0.035, lng: -0.020, dist: 5.5 },
    { lat: 0.050, lng: 0.030, dist: 7.2 },
  ];

  return demoOffsets.map((offset, i) => {
    const lat = location.lat + offset.lat;
    const lng = location.lng + offset.lng;
    const distanceKm = calculateDistance(location.lat, location.lng, lat, lng);

    return {
      name: `${names[i % names.length]} (Demo)`,
      address: `Sample Address ${i + 1}, Medical District`,
      distance: formatDistance(distanceKm),
      distanceKm,
      specialty: normalizedType === 'hospital' ? 'General Medicine' : normalizedType,
      lat,
      lng,
      rating: 3.5 + Math.random() * 1.5,
      isOpen: Math.random() > 0.2,
      isDemo: true,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}
