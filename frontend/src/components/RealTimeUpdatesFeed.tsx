import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FacilityPrediction } from '../data/facilities';

interface RealTimeUpdatesFeedProps {
  facilities: FacilityPrediction[];
}

export default function RealTimeUpdatesFeed({ facilities }: RealTimeUpdatesFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [updates, setUpdates] = useState<{ id: string; text: string; type: 'high' | 'moderate' | 'info' }[]>([]);

  // Generate real-time update messages based on live facility data
  useEffect(() => {
    if (facilities.length === 0) return;

    const newUpdates: typeof updates = [];
    
    // Check for high risk facilities
    facilities.filter(f => f.risk_level === 'high').forEach(f => {
      newUpdates.push({
        id: `high-${f.facility_id}`,
        text: `Urgent: Severe congestion at ${f.facility_short}. Expected wait: >${f.avg_wait_minutes} mins.`,
        type: 'high'
      });
    });

    // Check for moderate risk facilities with rising traffic (predicted over 80 in next hours)
    facilities.filter(f => f.risk_level === 'moderate' && f.predicted_volume_1h > f.current_volume).forEach(f => {
      newUpdates.push({
        id: `mod-${f.facility_id}`,
        text: `Traffic building on ${f.facility_short}. Volume up to ${f.current_volume} vehicles.`,
        type: 'moderate'
      });
    });

    // Add info for cleared routes
    const clearFacilities = facilities.filter(f => f.risk_level === 'low');
    if (clearFacilities.length > 0) {
      const randomClear = clearFacilities[Math.floor(Math.random() * clearFacilities.length)];
      newUpdates.push({
        id: `clear-${randomClear.facility_id}`,
        text: `${randomClear.facility_short} is flowing smoothly with low wait times.`,
        type: 'info'
      });
    }

    setUpdates(newUpdates);
  }, [facilities]);

  // Rotate through updates smoothly every 5 seconds
  useEffect(() => {
    if (updates.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % updates.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [updates.length]);

  if (updates.length === 0) return null;

  const currentUpdate = updates[currentIndex];

  const getStyle = (type: string) => {
    switch (type) {
      case 'high': return { bg: 'rgba(234, 67, 53, 0.1)', border: 'rgba(234, 67, 53, 0.3)', icon: '🔴', text: '#EA4335' };
      case 'moderate': return { bg: 'rgba(251, 188, 5, 0.1)', border: 'rgba(251, 188, 5, 0.3)', icon: '🟡', text: '#FBBC05' };
      default: return { bg: 'rgba(52, 168, 83, 0.1)', border: 'rgba(52, 168, 83, 0.3)', icon: '🟢', text: '#34A853' };
    }
  };

  const style = getStyle(currentUpdate.type);

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[90%] max-w-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentUpdate.id}
          initial={{ y: -20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md pointer-events-auto cursor-pointer"
          style={{ background: style.bg, border: `1px solid ${style.border}` }}
        >
          <div className="flex items-center justify-center min-w-[20px]">
            <span className="text-sm animate-pulse">{style.icon}</span>
          </div>
          <div className="flex-1 truncate overflow-hidden">
            <p className="text-[13px] font-semibold tracking-wide truncate" style={{ color: style.text }}>
              LIVE: <span className="font-medium text-[var(--text-primary)]">{currentUpdate.text}</span>
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
