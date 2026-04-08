import { motion, AnimatePresence } from 'framer-motion';

interface ErrorToastProps {
  message: string | null;
  onDismiss: () => void;
}

export default function ErrorToast({ message, onDismiss }: ErrorToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          id="error-toast"
          className="glass-panel absolute bottom-6 left-1/2 z-[1000] max-w-[calc(100vw-2rem)] w-[420px] px-5 py-4 flex items-start gap-3"
          initial={{ y: 40, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: 40, opacity: 0, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ borderColor: 'rgba(255, 82, 82, 0.25)' }}
        >
          <div className="flex-shrink-0 mt-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-0.5">
              GPS Error
            </p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer bg-transparent border-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
