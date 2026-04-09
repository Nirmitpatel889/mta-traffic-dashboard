import { motion } from 'framer-motion';
import type { ActivePanel } from '../types';
import type { GpsPoint } from '../types';
import { formatAccuracy } from '../utils';
import { downloadFile, exportFacilitiesCsv } from '../utils';
import type { FacilityPrediction } from '../data/facilities';

interface DashboardControlPanelProps {
  isTracking: boolean;
  position: GpsPoint | null;
  onStart: () => void;
  onStop: () => void;
  onCenter: () => void;
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  facilities: FacilityPrediction[];
  distances: Map<string, { km: number; eta: number }>;
}

export default function DashboardControlPanel({
  isTracking,
  position,
  onStart,
  onStop,
  onCenter,
  activePanel,
  setActivePanel,
  facilities,
  distances,
}: DashboardControlPanelProps) {
  const accuracy = position ? formatAccuracy(position.accuracy) : null;

  const handleExportCsv = () => {
    const data = facilities.map((f) => {
      const d = distances.get(f.facility_id);
      return {
        name: f.facility_name,
        volume: f.current_volume,
        capacity: f.capacity,
        risk: f.risk_percentage,
        eta: d?.eta ?? 0,
      };
    });
    const csv = exportFacilitiesCsv(data);
    const filename = `mta_traffic_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    downloadFile(csv, filename, 'text/csv');
  };

  const handleShare = () => {
    if (!position) return;
    const text = `🚗 I'm tracking my commute with MTA Traffic Intelligence!\n📍 Location: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}\n🔗 Join The Express Lane`;
    if (navigator.share) {
      navigator.share({ title: 'MTA Traffic Intelligence', text });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  const navButtons = [
    {
      id: 'predictions' as ActivePanel,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
      ),
      label: 'Predictions',
      color: '#0039A6',
    },
    {
      id: 'routing' as ActivePanel,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" />
        </svg>
      ),
      label: 'Routes',
      color: '#FF6319',
    },
    {
      id: 'compare' as ActivePanel,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
      label: 'Compare',
      color: '#9C27B0',
    },
    {
      id: 'insights' as ActivePanel,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      label: 'AI Insights',
      color: '#0A66C2',
    },
  ];

  return (
    <motion.div
      id="dashboard-control"
      className="glass-panel absolute top-4 left-4 z-[1000] w-[300px] max-w-[calc(100vw-2rem)] p-5 select-none"
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0039A6, #FF6319)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
            </div>
            {isTracking && (
              <motion.div
                className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </div>
          <div>
            <h1 className="text-xs font-black tracking-tight leading-none text-[var(--text-primary)]">
              <span style={{ color: '#0A66C2' }}>MTA</span> Traffic Intel
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-semibold tracking-wider uppercase">
              {isTracking ? '● Live' : 'The Express Lane'}
            </p>
          </div>
        </div>

        {accuracy && (
          <motion.div
            className="glass-panel-sm flex items-center gap-1.5 px-2 py-1.5"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: accuracy.color }} />
            <span className="text-sm font-semibold" style={{ color: accuracy.color }}>{accuracy.label}</span>
          </motion.div>
        )}
      </div>

      {/* GPS Toggle */}
      <motion.button
        id="gps-toggle"
        className={`w-full py-3 rounded-2xl font-bold text-xs tracking-wide transition-all duration-300 cursor-pointer border-0 mb-3 ${isTracking
          ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 ring-1 ring-red-500/30'
          : 'text-[var(--text-primary)] hover:opacity-90 shadow-[0_4px_20px_rgba(10,102,194,0.35)]'
          }`}
        style={!isTracking ? { background: 'linear-gradient(135deg, #0A66C2, #4A90E2)' } : undefined}
        onClick={isTracking ? onStop : onStart}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center justify-center gap-2">
          {isTracking ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
              Stop GPS
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
              Enable GPS
            </>
          )}
        </div>
      </motion.button>

      {/* Navigation */}
      <div className="flex flex-col gap-1.5 mb-3">
        {navButtons.map((btn) => (
          <motion.button
            key={btn.id}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border-0 text-left flex items-center gap-2.5"
            style={{
              background: activePanel === btn.id ? `${btn.color}15` : 'transparent',
              color: activePanel === btn.id ? btn.color : 'var(--text-secondary)',
              border: activePanel === btn.id ? `1px solid ${btn.color}30` : '1px solid transparent',
            }}
            onClick={() => setActivePanel(activePanel === btn.id ? null : btn.id)}
            whileHover={{ scale: 1.01, x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            {btn.icon}
            <span className="nav-label">{btn.label}</span>
            {activePanel === btn.id && (
              <motion.div
                className="ml-auto w-1.5 h-1.5 rounded-full"
                style={{ background: btn.color }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Utility buttons */}
      <div className="flex gap-2">
        <motion.button
          className="flex-1 py-2 rounded-xl glass-panel-sm text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer border-0 bg-transparent"
          onClick={onCenter}
          whileTap={{ scale: 0.95 }}
          disabled={!position}
          style={{ opacity: position ? 1 : 0.3 }}
        >
          <div className="flex items-center justify-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
            Center
          </div>
        </motion.button>

        <motion.button
          className="flex-1 py-2 rounded-xl glass-panel-sm text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer border-0 bg-transparent"
          onClick={handleExportCsv}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex items-center justify-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Export CSV
          </div>
        </motion.button>

        <motion.button
          className="flex-1 py-2 rounded-xl glass-panel-sm text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer border-0 bg-transparent"
          onClick={handleShare}
          whileTap={{ scale: 0.95 }}
          disabled={!position}
          style={{ opacity: position ? 1 : 0.3 }}
        >
          <div className="flex items-center justify-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
            Share
          </div>
        </motion.button>
      </div>

      {/* Incident Alert Banner */}
      <motion.div
        className="mt-3 p-2.5 rounded-xl flex items-center gap-2"
        style={{ background: 'rgba(255,99,25,0.08)', border: '1px solid rgba(255,99,25,0.15)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-sm">⚠️</span>
        <div className="flex-1">
          <p className="text-xs font-bold text-[#FF6B00]">INCIDENT ALERT</p>
          <p className="text-xs text-[var(--text-secondary)]">Construction near RFK Bridge — expect delays through April 12</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
