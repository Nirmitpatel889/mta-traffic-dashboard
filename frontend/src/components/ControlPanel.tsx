import { motion, AnimatePresence } from 'framer-motion';
import {
  formatSpeed,
  formatDistance,
  formatTime,
  formatHeading,
  formatAccuracy,
  getSpeedClass,
  exportGpx,
  downloadFile,
} from '../utils';
import type { GpsPoint } from '../types';

interface ControlPanelProps {
  isTracking: boolean;
  position: GpsPoint | null;
  distanceMeters: number;
  elapsedMs: number;
  trailLength: number;
  trail: GpsPoint[];
  onStart: () => void;
  onStop: () => void;
  onCenter: () => void;
}

export default function ControlPanel({
  isTracking,
  position,
  distanceMeters,
  elapsedMs,
  trailLength,
  trail,
  onStart,
  onStop,
  onCenter,
}: ControlPanelProps) {
  const speed = position?.speed ?? null;
  const speedKmh = formatSpeed(speed);
  const speedClass = getSpeedClass(speed);
  const heading = formatHeading(position?.heading ?? null);
  const altitude = position?.altitude !== null && position?.altitude !== undefined
    ? `${position.altitude.toFixed(0)}m`
    : '—';
  const accuracy = position ? formatAccuracy(position.accuracy) : null;
  const distance = formatDistance(distanceMeters);
  const time = formatTime(elapsedMs);

  const handleExport = () => {
    if (trail.length < 2) return;
    const gpx = exportGpx(trail);
    const filename = `track_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.gpx`;
    downloadFile(gpx, filename, 'application/gpx+xml');
  };

  return (
    <motion.div
      id="control-panel"
      className="glass-panel absolute top-4 left-4 z-[1000] w-[340px] max-w-[calc(100vw-2rem)] p-5 select-none"
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              <circle cx="12" cy="12" r="9" strokeDasharray="3 3" opacity="0.3" />
            </svg>
            <AnimatePresence>
              {isTracking && (
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400"
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  exit={{ scale: 0 }}
                />
              )}
            </AnimatePresence>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight leading-none">GPS Tracker</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-medium tracking-wide uppercase">
              {isTracking ? 'Live Tracking' : 'Ready'}
            </p>
          </div>
        </div>

        {accuracy && (
          <motion.div
            className="glass-panel-sm flex items-center gap-1.5 px-2.5 py-1.5"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: accuracy.color }} />
            <span className="text-sm font-semibold" style={{ color: accuracy.color }}>
              {accuracy.label}
            </span>
          </motion.div>
        )}
      </div>

      {/* Speed display */}
      <AnimatePresence>
        {isTracking && position && (
          <motion.div
            className="mb-4"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="glass-panel-sm p-4 flex items-end gap-2">
              <span className={`text-5xl font-black tabular-nums leading-none ${speedClass}`}>
                {speedKmh}
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-semibold mb-1.5">km/h</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats grid */}
      <AnimatePresence>
        {isTracking && position && (
          <motion.div
            className="grid grid-cols-2 gap-2.5 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              label="Distance"
              value={`${distance} km`}
            />
            <StatCard
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
              label="Elapsed"
              value={time}
            />
            <StatCard
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L12 22M2 12l10-10 10 10" />
                </svg>
              }
              label="Altitude"
              value={altitude}
            />
            <StatCard
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 11l19-9-9 19-2-8-8-2z" />
                </svg>
              }
              label="Heading"
              value={heading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex flex-col gap-2.5">
        <motion.button
          id="tracking-toggle"
          className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer border-0 ${isTracking
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/30'
            : 'bg-[#6C63FF] text-[var(--text-primary)] hover:bg-[#5B52EE] shadow-[0_4px_20px_rgba(108,99,255,0.35)]'
            }`}
          onClick={isTracking ? onStop : onStart}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center justify-center gap-2">
            {isTracking ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                Stop Tracking
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
                Start Tracking
              </>
            )}
          </div>
        </motion.button>

        <div className="flex gap-2.5">
          <motion.button
            id="center-btn"
            className="flex-1 py-2.5 rounded-xl glass-panel-sm text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer border-0 bg-transparent"
            onClick={onCenter}
            whileTap={{ scale: 0.95 }}
            disabled={!position}
            style={{ opacity: position ? 1 : 0.4 }}
          >
            <div className="flex items-center justify-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </svg>
              Center
            </div>
          </motion.button>

          <motion.button
            id="export-btn"
            className="flex-1 py-2.5 rounded-xl glass-panel-sm text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer border-0 bg-transparent"
            onClick={handleExport}
            whileTap={{ scale: 0.95 }}
            disabled={trailLength < 2}
            style={{ opacity: trailLength >= 2 ? 1 : 0.4 }}
          >
            <div className="flex items-center justify-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Export GPX
            </div>
          </motion.button>
        </div>
      </div>

      {/* Trail point count */}
      {trailLength > 0 && (
        <motion.div
          className="mt-3 text-center text-sm text-[var(--text-secondary)] font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {trailLength} points recorded
        </motion.div>
      )}
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-panel-sm p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[var(--text-secondary)]">{icon}</span>
        <span className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-sm font-bold tabular-nums text-[var(--text-secondary)]">{value}</p>
    </div>
  );
}
