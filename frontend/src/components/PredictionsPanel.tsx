import { motion, AnimatePresence } from 'framer-motion';
import type { FacilityPrediction } from '../data/facilities';
import { getRiskColor, getRiskGradient } from '../data/facilities';
import { formatNumber } from '../utils';

interface PredictionsPanelProps {
  facilities: FacilityPrediction[];
  selectedFacility: string | null;
  onSelectFacility: (id: string) => void;
  onClose: () => void;
}

export default function PredictionsPanel({
  facilities,
  selectedFacility,
  onSelectFacility,
  onClose,
}: PredictionsPanelProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const selected = facilities.find((f) => f.facility_id === selectedFacility);

  return (
    <motion.div
        id="predictions-panel"
        className="glass-panel absolute top-4 right-4 z-[1000] w-[380px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] flex flex-col md:max-h-[calc(100vh-2rem)]"
        initial={isMobile ? { y: '100%', opacity: 0 } : { x: 80, opacity: 0 }}
        animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
        exit={isMobile ? { y: '100%', opacity: 0 } : { x: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
      >
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0039A6, #1a5cd6)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">XGBoost Predictions</h2>
            <p className="text-sm text-[var(--text-secondary)] font-medium">Traffic Volume Forecast</p>
          </div>
        </div>
        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors bg-transparent border-0 cursor-pointer p-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Facility list or detail */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 scrollbar-thin">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Back button */}
              <button
                onClick={() => onSelectFacility('')}
                className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors mb-3 bg-transparent border-0 cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                All Facilities
              </button>

              <FacilityDetail facility={selected} />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-2"
            >
              {facilities.map((f, i) => (
                <FacilityCard
                  key={f.facility_id}
                  facility={f}
                  index={i}
                  onClick={() => onSelectFacility(f.facility_id)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function FacilityCard({ facility, index, onClick }: { facility: FacilityPrediction; index: number; onClick: () => void }) {
  const riskColor = getRiskColor(facility.risk_level);

  return (
    <motion.button
      className="glass-panel-sm p-3 w-full text-left transition-all hover:scale-[1.01] cursor-pointer border-0 bg-transparent"
      onClick={onClick}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{facility.facility_type === 'bridge' ? '🌉' : '🚇'}</span>
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)]">{facility.facility_short}</p>
            <p className="text-sm text-[var(--text-secondary)]">{facility.facility_type === 'bridge' ? 'Bridge' : 'Tunnel'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: riskColor }} />
          <span className="text-xs font-bold tabular-nums" style={{ color: riskColor }}>{facility.risk_percentage}%</span>
        </div>
      </div>

      {/* Mini volume bar */}
      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: getRiskGradient(facility.risk_level) }}
          initial={{ width: '0%' }}
          animate={{ width: `${facility.risk_percentage}%` }}
          transition={{ delay: 0.3 + index * 0.05, duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-[var(--text-secondary)]">{formatNumber(facility.current_volume)} / {formatNumber(facility.capacity)} veh</span>
        <span className="text-sm text-[var(--text-secondary)]">~{facility.avg_wait_minutes}min wait</span>
      </div>
    </motion.button>
  );
}

function FacilityDetail({ facility }: { facility: FacilityPrediction }) {
  const riskColor = getRiskColor(facility.risk_level);
  const hourlyData = [
    { label: 'Now', value: facility.current_volume },
    { label: '+1h', value: facility.predicted_volume_1h },
    { label: '+2h', value: facility.predicted_volume_2h },
    { label: '+4h', value: facility.predicted_volume_4h },
  ];

  const maxVol = Math.max(...hourlyData.map((d) => d.value), facility.capacity);

  return (
    <div className="flex flex-col gap-3">
      {/* Title Row */}
      <div className="glass-panel-sm p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{facility.facility_type === 'bridge' ? '🌉' : '🚇'}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[var(--text-secondary)] truncate">{facility.facility_name}</h3>
            <p className="text-sm text-[var(--text-secondary)] truncate">{facility.lanes} lanes · {facility.length_miles} mi</p>
          </div>
        </div>

        {/* Risk Gauge */}
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="14"
                fill="none"
                stroke={riskColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${facility.risk_percentage * 0.88} 88`}
                style={{ filter: `drop-shadow(0 0 4px ${riskColor}50)` }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black tabular-nums" style={{ color: riskColor }}>{facility.risk_percentage}%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-0.5">Capacity Risk</p>
            <p className="text-sm font-bold capitalize" style={{ color: riskColor }}>{facility.risk_level} Risk</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Best time: {facility.best_time}</p>
          </div>
        </div>
      </div>

      {/* Volume Forecast Chart */}
      <div className="glass-panel-sm p-4">
        <p className="text-sm text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-3">Volume Forecast</p>
        <div className="flex items-end gap-2 h-24">
          {hourlyData.map((d, i) => {
            const heightPct = (d.value / maxVol) * 100;
            const isOverCapacity = d.value > facility.capacity * 0.8;
            return (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold tabular-nums text-[var(--text-secondary)]">{formatNumber(d.value)}</span>
                <motion.div
                  className="w-full rounded-t-lg min-h-[4px]"
                  style={{
                    background: isOverCapacity
                      ? 'linear-gradient(to top, #FF5252, #FF8A80)'
                      : i === 0
                        ? 'linear-gradient(to top, #0039A6, #1a5cd6)'
                        : 'linear-gradient(to top, rgba(0,57,166,0.5), rgba(26,92,214,0.5))',
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                />
                <span className="text-xs text-[var(--text-secondary)]">{d.label}</span>
              </div>
            );
          })}
        </div>
        {/* Capacity line */}
        <div className="relative mt-1">
          <div className="w-full border-t border-dashed border-white/10" />
          <span className="absolute right-0 -top-2 text-[8px] text-[var(--text-secondary)]">Capacity: {formatNumber(facility.capacity)}</span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2">
        <InfoCard label="Toll Cost" value={`$${facility.toll_cost.toFixed(2)}`} icon="💰" />
        <InfoCard label="Avg Wait" value={`${facility.avg_wait_minutes} min`} icon="⏱️" />
        <InfoCard label="Peak Hours" value={facility.peak_hours} icon="📊" />
        <InfoCard label="Best Time" value={facility.best_time} icon="✅" />
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="glass-panel-sm p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className="text-xs font-bold text-[var(--text-secondary)] truncate">{value}</p>
    </div>
  );
}
