import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { FacilityPrediction } from '../data/facilities';
import { getRiskColor } from '../data/facilities';
import LocationSearch from './LocationSearch';
import { haversineDistance, calculateEta } from '../utils';

interface RoutingSuggestionsPanelProps {
  facilities: FacilityPrediction[];
  userLat: number | null;
  userLng: number | null;
  distances: Map<string, { km: number; eta: number }>;
  onClose: () => void;
  onSelectFacility: (id: string) => void;
}

export default function RoutingSuggestionsPanel({
  facilities,
  userLat,
  userLng,
  onClose,
  onSelectFacility,
}: RoutingSuggestionsPanelProps) {
  const [origin, setOrigin] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number; label: string } | null>(null);

  const startLat = origin ? origin.lat : userLat;
  const startLng = origin ? origin.lng : userLng;

  // Recalculate distances if destination is set or if we use custom origin
  const scored = useMemo(() => {
    if (!startLat || !startLng) return [];

    return facilities
      .map((f) => {
        let distMeters = 0;
        let eta = 0;
        
        // Distance from start to facility
        distMeters += haversineDistance(
          { lat: startLat, lng: startLng },
          { lat: f.coordinates[0], lng: f.coordinates[1] }
        );

        // Distance from facility to destination (if set)
        if (destination) {
          distMeters += haversineDistance(
            { lat: f.coordinates[0], lng: f.coordinates[1] },
            { lat: destination.lat, lng: destination.lng }
          );
        }

        const distKm = distMeters / 1609.344;
        eta = calculateEta(distMeters);
        
        // Add wait time
        eta += f.avg_wait_minutes;

        const riskScore = f.risk_percentage / 100;
        const distScore = Math.min(distKm / 50, 1);
        const composite = riskScore * 0.6 + distScore * 0.4;

        return { ...f, distKm, etaMin: eta, composite };
      })
      .sort((a, b) => a.composite - b.composite);
  }, [facilities, startLat, startLng, destination]);

  const fastest = scored[0];
  const alternatives = scored.slice(1, 4);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <motion.div
      id="routing-panel"
      className="glass-panel absolute top-4 right-4 z-[1000] w-[380px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto p-5 md:max-h-[calc(100vh-2rem)]"
      initial={isMobile ? { y: '100%', opacity: 0 } : { x: 80, opacity: 0 }}
      animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
      exit={isMobile ? { y: '100%', opacity: 0 } : { x: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6319, #ff8a50)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 10H3M21 6H3M21 14H3M21 18H3" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Smart Routing</h2>
            <p className="text-sm text-[var(--text-secondary)] font-medium">AI-Optimized Routes</p>
          </div>
        </div>
        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors bg-transparent border-0 cursor-pointer p-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Google Maps Style Route Planner Inputs */}
      <div className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.2)] mb-4 overflow-hidden">
        <div className="flex p-3 pr-2 border-b border-gray-100">
          {/* Icons column */}
          <div className="flex flex-col items-center justify-between py-3 mr-3 mt-0.5">
            <div className="w-3.5 h-3.5 rounded-full border-[2.5px] border-[#5F6368]" />
            <div className="flex flex-col gap-[3px]">
              <div className="w-[3px] h-[3px] bg-[#9AA0A6] rounded-full" />
              <div className="w-[3px] h-[3px] bg-[#9AA0A6] rounded-full" />
              <div className="w-[3px] h-[3px] bg-[#9AA0A6] rounded-full" />
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          
          {/* Inputs column */}
          <div className="flex-1 flex flex-col gap-2">
            <LocationSearch
              placeholder="Your location"
              onSelect={(res) => setOrigin(res)}
              initialValue={origin?.label || (userLat ? 'Current Location' : '')}
              hideIcon={true}
            />
            <LocationSearch
              placeholder="Choose destination"
              onSelect={(res) => setDestination(res)}
              initialValue={destination?.label || ''}
              hideIcon={true}
            />
          </div>

          {/* Swap icon column */}
          <div className="flex items-center ml-1 pl-1 border-l border-transparent">
            <button className="text-[#5F6368] hover:text-black cursor-pointer bg-transparent border-none p-1.5 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l-4-4M17 20l4-4" /></svg>
            </button>
          </div>
        </div>
        
        {/* Add destination button */}
        <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-white hover:bg-gray-50 border-none cursor-pointer transition-colors text-left group">
          <div className="flex items-center justify-center w-5 h-5 ml-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A73E8" strokeWidth="2" className="group-hover:stroke-[#174EA6]"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </div>
          <span className="text-[14px] text-[#1A73E8] font-medium group-hover:text-[#174EA6]">Add destination</span>
        </button>
      </div>

      {(!startLat || !startLng) ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center bg-[rgba(255,255,255,0.02)] rounded-xl border border-[rgba(255,255,255,0.05)]">
          <span className="text-4xl">📍</span>
          <p className="text-xs text-[var(--text-secondary)] px-4">Enable GPS tracking or search for an origin to get personalized route suggestions.</p>
        </div>
      ) : fastest ? (
        <>
          {/* Recommended route */}
          <div className="p-3 mb-4 rounded-xl relative" style={{ background: 'var(--glass-highlight)' }}>
            <p className="text-sm leading-tight text-[var(--text-secondary)] font-medium">
              <span className="font-bold text-[var(--text-primary)]">AI Analysis: </span>
              We highly recommend taking the <b>{fastest.facility_name}</b>{destination ? " to your destination" : " right now"}. With an ETA of <b>{fastest.etaMin} min</b>, it bypasses significant congestion.
            </p>
          </div>

          <motion.div
            className="p-4 rounded-2xl mb-4 relative overflow-hidden"
            style={{ border: `1px solid ${getRiskColor(fastest.risk_level)}30`, background: `${getRiskColor(fastest.risk_level)}08` }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="absolute top-2 right-3">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{
                background: `${getRiskColor(fastest.risk_level)}20`,
                color: getRiskColor(fastest.risk_level),
              }}>
                ⚡ Recommended
              </span>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{fastest.facility_type === 'bridge' ? '🌉' : '🚇'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--text-secondary)] truncate">{fastest.facility_name}</p>
                <p className="text-sm text-[var(--text-secondary)] truncate">{fastest.facility_type}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-xs font-bold text-[var(--text-secondary)]">{fastest.distKm.toFixed(1)} mi</p>
                <p className="text-xs text-[var(--text-secondary)]">Total Dist</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-[var(--text-secondary)]">{fastest.etaMin} min</p>
                <p className="text-xs text-[var(--text-secondary)]">Total ETA</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold" style={{ color: getRiskColor(fastest.risk_level) }}>{fastest.risk_percentage}%</p>
                <p className="text-xs text-[var(--text-secondary)]">Risk</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className="text-sm text-[var(--text-secondary)]">Toll: <span className="text-[var(--text-secondary)] font-bold">${fastest.toll_cost.toFixed(2)}</span></span>
              <span className="text-sm text-[var(--text-secondary)]">Wait: <span className="text-[var(--text-secondary)] font-bold">~{fastest.avg_wait_minutes} min</span></span>
            </div>

            <motion.button
              className="w-full mt-3 py-2.5 rounded-xl font-bold text-xs cursor-pointer border-0"
              style={{ background: 'linear-gradient(135deg, #0039A6, #1a5cd6)', color: 'white' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectFacility(fastest.facility_id)}
            >
              View Details →
            </motion.button>
          </motion.div>

          {/* Alternative routes */}
          <p className="text-sm text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-2">Alternative Routes</p>
          <div className="flex flex-col gap-2">
            {alternatives.map((f, i) => (
              <motion.button
                key={f.facility_id}
                className="glass-panel-sm p-3 flex items-center justify-between text-left w-full border-0 bg-transparent cursor-pointer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelectFacility(f.facility_id)}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{f.facility_type === 'bridge' ? '🌉' : '🚇'}</span>
                  <div>
                    <p className="text-xs font-bold text-[var(--text-secondary)]">{f.facility_short}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{f.distKm.toFixed(1)} mi · {f.etaMin} min · ${f.toll_cost.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: getRiskColor(f.risk_level) }} />
                  <span className="text-xs font-bold tabular-nums" style={{ color: getRiskColor(f.risk_level) }}>{f.risk_percentage}%</span>
                </div>
              </motion.button>
            ))}
          </div>
        </>
      ) : null}
    </motion.div>
  );
}
