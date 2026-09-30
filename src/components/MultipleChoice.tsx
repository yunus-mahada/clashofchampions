import React from 'react';
import { motion } from 'motion/react';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface MultipleChoiceProps {
  options: string[];
  disabled: boolean;
  onSelect: (option: string) => void;
}

export const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  options,
  disabled,
  onSelect,
}) => {
  const letters = ['A', 'B', 'C', 'D'];

  const handleClick = (opt: string) => {
    if (disabled) return;
    audioManager.playClick();
    Haptics.click();
    onSelect(opt);
  };

  return (
    <div className="grid grid-cols-1 gap-2.5 w-full">
      {options.map((option, index) => {
        const letter = letters[index] || String(index + 1);
        return (
          <motion.button
            key={index}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            onClick={() => handleClick(option)}
            disabled={disabled}
            className="flex items-center gap-3.5 w-full min-h-[58px] px-4 py-3 text-left rounded-2xl bg-slate-900/90 border border-slate-750 hover:border-amber-500/50 hover:bg-slate-850 active:bg-slate-800 text-slate-100 shadow-md transition-all group"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 font-bold text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors shrink-0 text-sm">
              {letter}
            </span>
            <span className="text-sm sm:text-base font-semibold text-slate-200 leading-snug">
              {option}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
