import { useCallback, useEffect, useRef, useState } from 'react';
import type { GpsPoint, TrackingState } from '../types';
import { haversineDistance } from '../utils';

const MIN_DISTANCE_THRESHOLD = 2; // meters — ignore jitter

export function useGpsTracking() {
  const [state, setState] = useState<TrackingState>({
    isTracking: false,
    currentPosition: null,
    trail: [],
    distanceMeters: 0,
    elapsedMs: 0,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const trailRef = useRef<GpsPoint[]>([]);
  const distanceRef = useRef<number>(0);

  const handlePosition = useCallback((pos: GeolocationPosition) => {
    const point: GpsPoint = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      speed: pos.coords.speed,
      heading: pos.coords.heading,
      altitude: pos.coords.altitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp,
    };

    const prevTrail = trailRef.current;
    const lastPoint = prevTrail[prevTrail.length - 1];

    let addToTrail = false;
    if (!lastPoint) {
      addToTrail = true;
    } else {
      const dist = haversineDistance(lastPoint, point);
      if (dist >= MIN_DISTANCE_THRESHOLD) {
        distanceRef.current += dist;
        addToTrail = true;
      }
    }

    if (addToTrail) {
      trailRef.current = [...prevTrail, point];
    }

    setState((prev) => ({
      ...prev,
      currentPosition: point,
      trail: addToTrail ? trailRef.current : prev.trail,
      distanceMeters: distanceRef.current,
      error: null,
    }));
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    let message: string;
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = 'Location permission denied. Please enable GPS access in your browser settings.';
        break;
      case err.POSITION_UNAVAILABLE:
        message = 'GPS signal unavailable. Move to an area with better reception.';
        break;
      case err.TIMEOUT:
        message = 'GPS request timed out. Retrying…';
        break;
      default:
        message = `GPS error: ${err.message}`;
    }
    setState((prev) => ({ ...prev, error: message }));
  }, []);

  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by this browser.',
      }));
      return;
    }

    // Reset state
    trailRef.current = [];
    distanceRef.current = 0;
    startTimeRef.current = Date.now();

    setState({
      isTracking: true,
      currentPosition: null,
      trail: [],
      distanceMeters: 0,
      elapsedMs: 0,
      error: null,
    });

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );

    timerRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        elapsedMs: Date.now() - startTimeRef.current,
      }));
    }, 1000);
  }, [handlePosition, handleError]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState((prev) => ({ ...prev, isTracking: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return { ...state, startTracking, stopTracking };
}
