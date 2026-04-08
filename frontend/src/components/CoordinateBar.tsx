import { motion } from 'framer-motion';

interface CoordinateBarProps {
  lat: number | null;
  lng: number | null;
}

export default function CoordinateBar({ lat, lng }: CoordinateBarProps) {
  if (lat === null || lng === null) return null;

  return (
    <motion.div
      id="coordinate-bar"
      className="glass-panel-sm absolute bottom-4 right-4 z-[1000] px-4 py-2.5 flex items-center gap-4"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-[var(--text-secondary)] font-semibold uppercase">Lat</span>
        <span className="text-xs font-bold tabular-nums text-[var(--text-secondary)]">
          {lat.toFixed(6)}
        </span>
      </div>
      <div className="w-px h-3 bg-white/10" />
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-[var(--text-secondary)] font-semibold uppercase">Lng</span>
        <span className="text-xs font-bold tabular-nums text-[var(--text-secondary)]">
          {lng.toFixed(6)}
        </span>
      </div>
    </motion.div>
  );
}
