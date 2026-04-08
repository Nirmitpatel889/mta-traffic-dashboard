export interface GpsPoint {
  lat: number;
  lng: number;
  speed: number | null;       // m/s
  heading: number | null;     // degrees
  altitude: number | null;    // meters
  accuracy: number;           // meters
  timestamp: number;          // ms epoch
}

export interface TrackingState {
  isTracking: boolean;
  currentPosition: GpsPoint | null;
  trail: GpsPoint[];
  distanceMeters: number;
  elapsedMs: number;
  error: string | null;
}

export interface FacilityDistance {
  facilityId: string;
  distanceKm: number;
  etaMinutes: number;
}

export type ActivePanel = 'predictions' | 'routing' | 'compare' | 'insights' | null;
