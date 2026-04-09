import { motion, AnimatePresence } from 'framer-motion';
import type { FacilityPrediction } from '../data/facilities';
import { getRiskColor } from '../data/facilities';
import { formatNumber } from '../utils';

interface StatsCardsProps {
  facilities: FacilityPrediction[];
  userLat: number | null;
  userLng: number | null;
  nearestFacility: FacilityPrediction | null;
  nearestDistance: number;
  nearestEta: number;
}

export default function StatsCards({
  facilities,
  userLat,
  userLng,
  nearestFacility,
  nearestDistance,
  nearestEta,
}: StatsCardsProps) {
  const avgRisk = facilities.length > 0
    ? Math.round(facilities.reduce((sum, f) => sum + f.risk_percentage, 0) / facilities.length)
    : 0;

  const highRiskCount = facilities.filter((f) => f.risk_level === 'high').length;
  const totalVolume = facilities.reduce((sum, f) => sum + f.current_volume, 0);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const cards = [
    {
      id: 'location',
      icon: '📍',
      label: 'Your Location',
      value: userLat && userLng ? `${userLat.toFixed(4)}, ${userLng.toFixed(4)}` : 'GPS Off',
      color: '#6C63FF',
    },
    {
      id: 'nearest',
      icon: '🏗️',
      label: 'Nearest Facility',
      value: nearestFacility ? `${nearestFacility.facility_short}` : '—',
      sub: nearestFacility ? `${nearestDistance.toFixed(1)} mi · ${nearestEta} min ETA` : '',
      color: '#0039A6',
    },
    {
      id: 'congestion',
      icon: '🚦',
      label: 'Nearest Congestion',
      value: nearestFacility ? `${nearestFacility.risk_percentage}% ${nearestFacility.risk_level}` : '—',
      color: nearestFacility ? getRiskColor(nearestFacility.risk_level) : '#666',
    },
    {
      id: 'departure',
      icon: '🕐',
      label: 'Recommended Departure',
      value: nearestFacility ? nearestFacility.best_time : '—',
      sub: `Current: ${timeStr}`,
      color: '#FF6319',
    },
    {
      id: 'volume',
      icon: '🚗',
      label: 'Network Volume',
      value: formatNumber(totalVolume),
      sub: `${highRiskCount} high-risk · Avg risk: ${avgRisk}%`,
      color: highRiskCount > 3 ? '#FF5252' : '#FFD600',
    },
  ];

  return (
    <div id="stats-container" className="absolute bottom-4 left-4 right-4 z-[999]">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <AnimatePresence>
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              className="glass-panel-sm stats-card flex-shrink-0 p-3 min-w-[155px] max-w-[200px]"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm">{card.icon}</span>
                <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold truncate">{card.label}</span>
              </div>
              <motion.p
                className="text-xs font-bold text-[var(--text-secondary)] truncate"
                key={card.value}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {card.value}
              </motion.p>
              {card.sub && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{card.sub}</p>
              )}
              <div className="w-full h-0.5 rounded-full bg-white/5 mt-2 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: card.color }}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.8 }}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
