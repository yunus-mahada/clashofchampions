import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface CountdownOverlayProps {
  count: number | null; // 3, 2, 1, 0, or null (hidden)
  onComplete?: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ count, onComplete }) => {
  useEffect(() => {
    if (count !== null) {
      if (count > 0) {
        audioManager.playCountdownBeep(false);
        Haptics.click();
      } else if (count === 0) {
        audioManager.playCountdownBeep(true);
        Haptics.celebrate();
      }
    }
  }, [count]);

  if (count === null) return null;

  const labels: Record<number, string> = {
    3: 'SIAP-SIAP!',
    2: 'FOKUSKAN ILMU!',
    1: 'BISMILLAH...',
    0: 'MULAI!',
  };

  const colors: Record<number, { text: string; glow: string; bg: string }> = {
    3: { text: 'text-amber-400', glow: 'shadow-amber-500/50 border-amber-400/60', bg: 'from-amber-500/20' },
    2: { text: 'text-cyan-400', glow: 'shadow-cyan-500/50 border-cyan-400/60', bg: 'from-cyan-500/20' },
    1: { text: 'text-emerald-400', glow: 'shadow-emerald-500/50 border-emerald-400/60', bg: 'from-emerald-500/20' },
    0: { text: 'text-yellow-300', glow: 'shadow-yellow-500/70 border-yellow-300', bg: 'from-yellow-500/30' },
  };

  const style = colors[count] || colors[3];
  const label = labels[count] || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md select-none pointer-events-auto">
      {/* Radiant Glow in Background */}
      <div className="absolute w-72 h-72 rounded-full bg-amber-500/10 blur-3xl animate-pulse pointer-events-none" />

      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0.3, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 1.4, opacity: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300, duration: 0.4 }}
          className="flex flex-col items-center text-center relative z-10"
        >
          {/* Circular Countdown Badge */}
          <div
            className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-b ${style.bg} to-slate-900 border-4 ${style.glow} flex items-center justify-center shadow-2xl backdrop-blur-xl mb-4`}
          >
            <span
              className={`font-black font-cinzel tracking-tight ${
                count === 0 ? 'text-4xl sm:text-5xl text-yellow-300' : 'text-6xl sm:text-7xl ' + style.text
              }`}
            >
              {count === 0 ? 'GO!' : count}
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-xl sm:text-2xl font-black font-cinzel tracking-widest uppercase ${style.text}`}
          >
            {label}
          </motion.div>

          <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase mt-2">
            Pertandingan Dimulai Dalam Hitungan Mundur
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
