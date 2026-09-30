import React from 'react';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface TrueFalseProps {
  disabled: boolean;
  onSelect: (value: 'BENAR' | 'SALAH') => void;
}

export const TrueFalse: React.FC<TrueFalseProps> = ({ disabled, onSelect }) => {
  const handleClick = (val: 'BENAR' | 'SALAH') => {
    if (disabled) return;
    audioManager.playClick();
    Haptics.click();
    onSelect(val);
  };

  return (
    <div className="grid grid-cols-2 gap-3.5 w-full mt-2">
      <motion.button
        whileTap={{ scale: disabled ? 1 : 0.96 }}
        onClick={() => handleClick('BENAR')}
        disabled={disabled}
        className="flex flex-col items-center justify-center gap-2 min-h-[110px] sm:min-h-[130px] rounded-2xl bg-gradient-to-b from-emerald-900/40 to-slate-900 border-2 border-emerald-500/50 hover:border-emerald-400 hover:from-emerald-900/60 active:bg-emerald-900/80 text-emerald-300 shadow-lg shadow-emerald-950/40 transition-all p-3"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400">
          <Check className="w-7 h-7 stroke-[3]" />
        </div>
        <span className="text-base sm:text-lg font-black tracking-wider uppercase text-emerald-200">
          BENAR
        </span>
      </motion.button>

      <motion.button
        whileTap={{ scale: disabled ? 1 : 0.96 }}
        onClick={() => handleClick('SALAH')}
        disabled={disabled}
        className="flex flex-col items-center justify-center gap-2 min-h-[110px] sm:min-h-[130px] rounded-2xl bg-gradient-to-b from-rose-900/40 to-slate-900 border-2 border-rose-500/50 hover:border-rose-400 hover:from-rose-900/60 active:bg-rose-900/80 text-rose-300 shadow-lg shadow-rose-950/40 transition-all p-3"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-400">
          <X className="w-7 h-7 stroke-[3]" />
        </div>
        <span className="text-base sm:text-lg font-black tracking-wider uppercase text-rose-200">
          SALAH
        </span>
      </motion.button>
    </div>
  );
};
