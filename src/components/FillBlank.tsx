import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface FillBlankProps {
  options: string[];
  disabled: boolean;
  onSubmit: (selected: string) => void;
}

export const FillBlank: React.FC<FillBlankProps> = ({
  options,
  disabled,
  onSubmit,
}) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const handleSelectWord = (word: string) => {
    if (disabled) return;
    audioManager.playClick();
    Haptics.click();
    setSelectedWord(word);
  };

  const handleVerify = () => {
    if (disabled || !selectedWord) return;
    audioManager.playClick();
    Haptics.click();
    onSubmit(selectedWord);
  };

  return (
    <div className="flex flex-col gap-3.5 w-full">
      <div className="text-xs text-slate-400 font-medium">
        Pilih kata yang tepat untuk melengkapi bagian kosong:
      </div>

      <div className="grid grid-cols-2 gap-2.5 w-full">
        {options.map((opt) => {
          const isSelected = selectedWord === opt;
          return (
            <motion.button
              key={opt}
              whileTap={{ scale: disabled ? 1 : 0.97 }}
              onClick={() => handleSelectWord(opt)}
              disabled={disabled}
              className={`flex items-center justify-center min-h-[56px] px-3 py-3 rounded-2xl font-bold text-sm sm:text-base border transition-all ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25 scale-[1.02]'
                  : 'bg-slate-900/90 text-slate-200 border-slate-750 hover:border-amber-500/40 hover:bg-slate-850'
              }`}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleVerify}
        disabled={disabled || !selectedWord}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 disabled:opacity-40 disabled:pointer-events-none hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-extrabold shadow-lg shadow-amber-500/20 active:scale-98 transition-all mt-1"
      >
        <Check className="w-4 h-4 stroke-[3]" />
        <span>PERIKSA</span>
      </button>
    </div>
  );
};
