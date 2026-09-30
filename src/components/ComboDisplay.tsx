import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame } from 'lucide-react';
import { getComboMultiplier } from '../utils/scoring';

interface ComboDisplayProps {
  combo: number;
}

export const ComboDisplay: React.FC<ComboDisplayProps> = ({ combo }) => {
  if (combo <= 0) return null;

  const multiplier = getComboMultiplier(combo);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={combo}
        initial={{ scale: 0.7, opacity: 0, y: -6 }}
        animate={{ scale: [1.2, 1], opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 450, damping: 20 }}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/40 shadow-lg shadow-amber-500/10 text-amber-300 select-none"
      >
        <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
        <span className="text-xs font-black tracking-wider uppercase">
          COMBO x{combo}
        </span>
        <span className="text-[10px] font-bold text-amber-200/90 font-mono">
          ({multiplier}x)
        </span>
      </motion.div>
    </AnimatePresence>
  );
};
