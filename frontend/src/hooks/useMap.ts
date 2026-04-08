import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import type { GpsPoint } from '../types';
import type { FacilityPrediction } from '../data/facilities';
import { getRiskColor } from '../data/facilities';

interface UseMapOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useMap({ containerRef }: UseMapOptions) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyRef = useRef<L.Circle | null>(null);
  const trailLineRef = useRef<L.Polyline | null>(null);
  const facilityMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const facilityPulsesRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const [isReady, setIsReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [40.7128, -73.95], // NYC
      zoom: 11,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Use high-detail street map tiles (inverted with CSS for dark mode)
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps',
      maxZoom: 20,
    }).addTo(map);

    // Trail polyline
    const trail = L.polyline([], {
      color: '#0039A6',
      weight: 4,
      opacity: 0.7,
      smoothFactor: 1.5,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Custom pulsing marker icon
    const pulseIcon = L.divIcon({
      className: '',
      html: `
        <div class="pulse-marker">
          <div class="pulse-marker__ring"></div>
          <div class="pulse-marker__ring pulse-marker__ring--delayed"></div>
          <div class="pulse-marker__core"></div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    const marker = L.marker([0, 0], { icon: pulseIcon, zIndexOffset: 1000 });
    const accuracyCircle = L.circle([0, 0], {
      radius: 0,
      className: 'accuracy-circle',
      stroke: true,
      weight: 1,
      fillOpacity: 0.08,
    });

    mapRef.current = map;
    markerRef.current = marker;
    accuracyRef.current = accuracyCircle;
    trailLineRef.current = trail;
    setIsReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [containerRef]);

  const updatePosition = useCallback((pos: GpsPoint, shouldCenter: boolean = false) => {
    const map = mapRef.current;
    const marker = markerRef.current;
    const circle = accuracyRef.current;
    if (!map || !marker || !circle) return;

    const latlng: L.LatLngExpression = [pos.lat, pos.lng];

    if (!map.hasLayer(marker)) {
      marker.addTo(map);
      circle.addTo(map);
      map.setView(latlng, 13, { animate: true });
    }

    marker.setLatLng(latlng);
    circle.setLatLng(latlng);
    circle.setRadius(pos.accuracy);

    if (shouldCenter) {
      map.setView(latlng, map.getZoom(), { animate: true });
    }
  }, []);

  const updateTrail = useCallback((trail: GpsPoint[]) => {
    if (!trailLineRef.current) return;
    const latlngs = trail.map((p) => [p.lat, p.lng] as L.LatLngTuple);
    trailLineRef.current.setLatLngs(latlngs);
  }, []);

  const centerOn = useCallback((pos: GpsPoint) => {
    mapRef.current?.setView([pos.lat, pos.lng], 14, { animate: true });
  }, []);

  const clearTrail = useCallback(() => {
    trailLineRef.current?.setLatLngs([]);
    if (markerRef.current && mapRef.current?.hasLayer(markerRef.current)) {
      mapRef.current?.removeLayer(markerRef.current);
    }
    if (accuracyRef.current && mapRef.current?.hasLayer(accuracyRef.current)) {
      mapRef.current?.removeLayer(accuracyRef.current);
    }
  }, []);

  const updateFacilityMarkers = useCallback((facilities: FacilityPrediction[], onFacilityClick: (id: string) => void) => {
    const map = mapRef.current;
    if (!map) return;

    facilities.forEach((facility) => {
      const riskColor = getRiskColor(facility.risk_level);
      const existingMarker = facilityMarkersRef.current.get(facility.facility_id);
      const existingPulse = facilityPulsesRef.current.get(facility.facility_id);

      const iconHtml = `
        <div class="facility-marker facility-marker--${facility.risk_level}" style="--risk-color: ${riskColor}">
          <div class="facility-marker__icon">
            ${facility.facility_type === 'bridge' ? '🌉' : '🚇'}
          </div>
          <div class="facility-marker__label">${facility.facility_short}</div>
          <div class="facility-marker__risk" style="background: ${riskColor}">${facility.risk_percentage}%</div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'facility-marker-wrapper',
        html: iconHtml,
        // Removed explicit iconSize to allow natural Flexbox expansion
        // We handle centering via CSS translate
      });

      if (existingMarker) {
        existingMarker.setIcon(icon);
      } else {
        const marker = L.marker(facility.coordinates, { icon, zIndexOffset: 500 })
          .addTo(map)
          .on('click', () => onFacilityClick(facility.facility_id));
        facilityMarkersRef.current.set(facility.facility_id, marker);
      }

      // Pulse effect for high-risk facilities
      if (facility.risk_level === 'high') {
        if (!existingPulse) {
          const pulse = L.circleMarker(facility.coordinates, {
            radius: 20,
            color: riskColor,
            fillColor: riskColor,
            fillOpacity: 0.15,
            weight: 1,
            opacity: 0.4,
            className: 'facility-pulse',
          }).addTo(map);
          facilityPulsesRef.current.set(facility.facility_id, pulse);
        }
      } else {
        if (existingPulse) {
          map.removeLayer(existingPulse);
          facilityPulsesRef.current.delete(facility.facility_id);
        }
      }
    });
  }, []);

  const flyToFacility = useCallback((coords: [number, number]) => {
    mapRef.current?.flyTo(coords, 14, { animate: true, duration: 1.2 });
  }, []);

  return {
    map: mapRef,
    isReady,
    updatePosition,
    updateTrail,
    centerOn,
    clearTrail,
    updateFacilityMarkers,
    flyToFacility,
  };
}
