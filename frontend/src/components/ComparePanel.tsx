import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FacilityPrediction } from '../data/facilities';
import { getRiskColor } from '../data/facilities';
import { formatNumber } from '../utils';

interface ComparePanelProps {
  facilities: FacilityPrediction[];
  distances: Map<string, { km: number; eta: number }>;
  onClose: () => void;
}

export default function ComparePanel({ facilities, distances, onClose }: ComparePanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([
    facilities[0]?.facility_id ?? '',
    facilities[3]?.facility_id ?? '',
  ]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const selected = facilities.filter((f) => selectedIds.includes(f.facility_id));

  return (
    <motion.div
      id="compare-panel"
      className="glass-panel absolute top-4 right-4 z-[1000] w-[420px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] flex flex-col"
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Compare Facilities</h2>
            <p className="text-sm text-[var(--text-secondary)] font-medium">Select up to 3</p>
          </div>
        </div>
        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors bg-transparent border-0 cursor-pointer p-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {/* Selection chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {facilities.map((f) => {
            const isSelected = selectedIds.includes(f.facility_id);
            return (
              <button
                key={f.facility_id}
                className="text-sm font-semibold px-2.5 py-1.5 rounded-full cursor-pointer border transition-all"
                style={{
                  background: isSelected ? `${getRiskColor(f.risk_level)}15` : 'transparent',
                  borderColor: isSelected ? getRiskColor(f.risk_level) : 'var(--glass-border)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
                onClick={() => toggleSelect(f.facility_id)}
              >
                {f.facility_short}
              </button>
            );
          })}
        </div>

        {/* Comparison Table */}
        <AnimatePresence>
          {selected.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="glass-panel-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-xs text-[var(--text-secondary)] font-semibold uppercase p-2.5">Metric</th>
                      {selected.map((f) => (
                        <th key={f.facility_id} className="text-xs text-[var(--text-secondary)] font-bold uppercase p-2.5 text-center">
                          {f.facility_short}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        label: 'Risk',
                        values: selected.map((f) => ({
                          text: `${f.risk_percentage}%`,
                          color: getRiskColor(f.risk_level),
                        })),
                      },
                      {
                        label: 'Volume',
                        values: selected.map((f) => ({
                          text: formatNumber(f.current_volume),
                          color: 'var(--text-primary)',
                        })),
                      },
                      {
                        label: 'Capacity',
                        values: selected.map((f) => ({
                          text: formatNumber(f.capacity),
                          color: 'var(--text-secondary)',
                        })),
                      },
                      {
                        label: '+1h Forecast',
                        values: selected.map((f) => ({
                          text: formatNumber(f.predicted_volume_1h),
                          color: f.predicted_volume_1h > f.capacity * 0.8 ? '#FF5252' : 'var(--text-primary)',
                        })),
                      },
                      {
                        label: '+2h Forecast',
                        values: selected.map((f) => ({
                          text: formatNumber(f.predicted_volume_2h),
                          color: f.predicted_volume_2h > f.capacity * 0.8 ? '#FF5252' : 'var(--text-primary)',
                        })),
                      },
                      {
                        label: 'Toll',
                        values: selected.map((f) => ({
                          text: `$${f.toll_cost.toFixed(2)}`,
                          color: '#FFD600',
                        })),
                      },
                      {
                        label: 'Avg Wait',
                        values: selected.map((f) => ({
                          text: `${f.avg_wait_minutes} min`,
                          color: f.avg_wait_minutes > 15 ? '#FF5252' : '#00E676',
                        })),
                      },
                      {
                        label: 'Distance',
                        values: selected.map((f) => {
                          const d = distances.get(f.facility_id);
                          return {
                            text: d ? `${d.km.toFixed(1)} mi` : '—',
                            color: 'var(--text-secondary)',
                          };
                        }),
                      },
                      {
                        label: 'ETA',
                        values: selected.map((f) => {
                          const d = distances.get(f.facility_id);
                          return {
                            text: d ? `${d.eta} min` : '—',
                            color: '#0039A6',
                          };
                        }),
                      },
                    ].map((row, ri) => (
                      <motion.tr
                        key={row.label}
                        className="border-b border-white/[0.03]"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: ri * 0.03 }}
                      >
                        <td className="text-sm text-[var(--text-secondary)] font-medium p-2.5">{row.label}</td>
                        {row.values.map((v, vi) => (
                          <td key={vi} className="text-sm font-bold tabular-nums p-2.5 text-center" style={{ color: v.color }}>
                            {v.text}
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Visual risk comparison */}
              <div className="mt-3 glass-panel-sm p-3">
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-2">Risk Comparison</p>
                <div className="flex flex-col gap-2">
                  {selected.map((f) => {
                    const isBest = f.risk_percentage === Math.min(...selected.map((s) => s.risk_percentage));
                    return (
                      <div key={f.facility_id} className="flex items-center gap-2">
                        <span className="text-sm text-[var(--text-secondary)] font-medium w-20 truncate">{f.facility_short}</span>
                        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: getRiskColor(f.risk_level) }}
                            initial={{ width: '0%' }}
                            animate={{ width: `${f.risk_percentage}%` }}
                            transition={{ duration: 0.6 }}
                          />
                        </div>
                        <span className="text-sm font-bold tabular-nums w-8 text-right" style={{ color: getRiskColor(f.risk_level) }}>
                          {f.risk_percentage}%
                        </span>
                        {isBest && <span className="text-[8px]">✅</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {selected.length < 2 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="text-4xl opacity-50">📊</span>
            <p className="text-xs text-[var(--text-secondary)]">Select at least 2 facilities to compare</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
