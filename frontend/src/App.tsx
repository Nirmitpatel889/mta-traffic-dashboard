import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGpsTracking } from './hooks/useGpsTracking';
import { useMap } from './hooks/useMap';
import { AnimatePresence } from 'framer-motion';
import DashboardControlPanel from './components/DashboardControlPanel';
import PredictionsPanel from './components/PredictionsPanel';
import RoutingSuggestionsPanel from './components/RoutingSuggestionsPanel';
import ComparePanel from './components/ComparePanel';
import InsightsPanel from './components/InsightsPanel';
import StatsCards from './components/StatsCards';
import ErrorToast from './components/ErrorToast';
import RealTimeUpdatesFeed from './components/RealTimeUpdatesFeed';
import { getSimulatedPredictions } from './data/facilities';
import type { FacilityPrediction } from './data/facilities';
import type { ActivePanel } from './types';
import { haversineDistance, calculateEta } from './utils';

export default function App() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [autoCenter, setAutoCenter] = useState(true);
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<FacilityPrediction[]>([]);

  const {
    isTracking,
    currentPosition,
    trail,
    error,
    startTracking,
    stopTracking,
  } = useGpsTracking();

  const { updatePosition, updateTrail, centerOn, clearTrail, updateFacilityMarkers, flyToFacility } = useMap({
    containerRef: mapContainerRef,
  });

  // Load & refresh predictions every 30 seconds
  useEffect(() => {
    setFacilities(getSimulatedPredictions());
    const interval = setInterval(() => {
      setFacilities(getSimulatedPredictions());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update facility markers on map
  useEffect(() => {
    if (facilities.length > 0) {
      updateFacilityMarkers(facilities, (id) => {
        setSelectedFacility(id);
        setActivePanel('predictions');
      });
    }
  }, [facilities, updateFacilityMarkers]);

  // Calculate distances from user to each facility
  const distances = useMemo(() => {
    const map = new Map<string, { km: number; eta: number }>();
    if (!currentPosition) return map;

    facilities.forEach((f) => {
      const distMeters = haversineDistance(currentPosition, {
        lat: f.coordinates[0],
        lng: f.coordinates[1],
      });
      const distMi = distMeters / 1609.344;
      const eta = calculateEta(distMeters);
      map.set(f.facility_id, { km: distMi, eta });
    });

    return map;
  }, [currentPosition, facilities]);

  // Find nearest facility
  const { nearestFacility, nearestDistance, nearestEta } = useMemo(() => {
    if (!currentPosition || facilities.length === 0) {
      return { nearestFacility: null, nearestDistance: 0, nearestEta: 0 };
    }

    let nearest: FacilityPrediction | null = null;
    let minDist = Infinity;

    for (const f of facilities) {
      const dist = distances.get(f.facility_id);
      if (dist && dist.km < minDist) {
        minDist = dist.km;
        nearest = f;
      }
    }

    return {
      nearestFacility: nearest,
      nearestDistance: minDist,
      nearestEta: distances.get(nearest ? nearest.facility_id : '')?.eta ?? 0,
    };
  }, [currentPosition, facilities, distances]);

  // Update map marker when position changes
  useEffect(() => {
    if (currentPosition) {
      updatePosition(currentPosition, autoCenter);
    }
  }, [currentPosition, autoCenter, updatePosition]);

  // Update trail polyline
  useEffect(() => {
    updateTrail(trail);
  }, [trail, updateTrail]);

  const handleStart = useCallback(() => {
    clearTrail();
    setAutoCenter(true);
    setDismissedError(null);
    startTracking();
  }, [clearTrail, startTracking]);

  const handleStop = useCallback(() => {
    setAutoCenter(false);
    stopTracking();
  }, [stopTracking]);

  const handleCenter = useCallback(() => {
    if (currentPosition) {
      centerOn(currentPosition);
      setAutoCenter(true);
    }
  }, [currentPosition, centerOn]);

  const handleSelectFacility = useCallback((id: string) => {
    if (!id) {
      setSelectedFacility(null);
      return;
    }
    setSelectedFacility(id);
    setActivePanel('predictions');
    const facility = facilities.find((f) => f.facility_id === id);
    if (facility) {
      flyToFacility(facility.coordinates);
    }
  }, [facilities, flyToFacility]);

  const visibleError = error && error !== dismissedError ? error : null;

  return (
    <div className="relative w-full h-full">
      <RealTimeUpdatesFeed facilities={facilities} />
      
      {/* Map container */}
      <div ref={mapContainerRef} id="map" className="absolute inset-0 z-0" />

      {/* Dashboard Control Panel */}
      <DashboardControlPanel
        isTracking={isTracking}
        position={currentPosition}
        onStart={handleStart}
        onStop={handleStop}
        onCenter={handleCenter}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        facilities={facilities}
        distances={distances}
      />

      {/* Side Panels */}
      <AnimatePresence>
        {activePanel === 'predictions' && (
          <PredictionsPanel
            key="predictions"
            facilities={facilities}
            selectedFacility={selectedFacility}
            onSelectFacility={handleSelectFacility}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === 'routing' && (
          <RoutingSuggestionsPanel
            key="routing"
            facilities={facilities}
            userLat={currentPosition?.lat ?? null}
            userLng={currentPosition?.lng ?? null}
            distances={distances}
            onClose={() => setActivePanel(null)}
            onSelectFacility={handleSelectFacility}
          />
        )}
        {activePanel === 'compare' && (
          <ComparePanel
            key="compare"
            facilities={facilities}
            distances={distances}
            onClose={() => setActivePanel(null)}
          />
        )}

        {activePanel === 'insights' && (
          <InsightsPanel onClose={() => setActivePanel(null)} />
        )}
      </AnimatePresence>

      {/* Bottom Stats Cards */}
      <StatsCards
        facilities={facilities}
        userLat={currentPosition?.lat ?? null}
        userLng={currentPosition?.lng ?? null}
        nearestFacility={nearestFacility}
        nearestDistance={nearestDistance}
        nearestEta={nearestEta}
      />

      {/* Error toast */}
      <ErrorToast
        message={visibleError}
        onDismiss={() => setDismissedError(error)}
      />
    </div>
  );
}
