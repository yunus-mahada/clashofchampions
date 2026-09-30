import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp, ArrowDown, RotateCcw, Check } from 'lucide-react';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface ArrangeQuestionProps {
  initialPieces: string[];
  disabled: boolean;
  onSubmit: (arranged: string[]) => void;
}

export const ArrangeQuestion: React.FC<ArrangeQuestionProps> = ({
  initialPieces,
  disabled,
  onSubmit,
}) => {
  // Start with shuffled copy
  const [items, setItems] = useState<string[]>(() => {
    const copy = [...initialPieces];
    // Deterministic slight shuffle if initial matches
    return copy.reverse();
  });

  const moveUp = (index: number) => {
    if (disabled || index === 0) return;
    audioManager.playClick();
    Haptics.click();
    const updated = [...items];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setItems(updated);
  };

  const moveDown = (index: number) => {
    if (disabled || index === items.length - 1) return;
    audioManager.playClick();
    Haptics.click();
    const updated = [...items];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setItems(updated);
  };

  const handleReset = () => {
    if (disabled) return;
    audioManager.playClick();
    Haptics.click();
    setItems([...initialPieces].reverse());
  };

  const handleCheck = () => {
    if (disabled) return;
    audioManager.playClick();
    Haptics.click();
    onSubmit(items);
  };

  return (
    <div className="flex flex-col gap-3.5 w-full">
      <div className="text-xs text-slate-400 font-medium">
        Gunakan tombol panah untuk menyusun potongan urutan dari atas ke bawah:
      </div>

      <div className="flex flex-col gap-2 w-full">
        <AnimatePresence>
          {items.map((item, idx) => (
            <motion.div
              layout
              key={item}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="flex items-center justify-between gap-3 min-h-[52px] px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm sm:text-base font-semibold text-slate-100 truncate">
                  {item}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={disabled || idx === 0}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-700 active:scale-95"
                  aria-label="Geser ke atas"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={disabled || idx === items.length - 1}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-700 active:scale-95"
                  aria-label="Geser ke bawah"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2.5 mt-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-300 hover:bg-slate-750 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Ulangi</span>
        </button>

        <button
          type="button"
          onClick={handleCheck}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-extrabold shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>PERIKSA JAWABAN</span>
        </button>
      </div>
    </div>
  );
};
