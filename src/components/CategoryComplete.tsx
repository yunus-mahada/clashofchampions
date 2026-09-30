import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Check, X, ArrowRight, Zap, Target } from 'lucide-react';
import { CategoryId, QuestionProgress } from '../types/game';
import { CATEGORIES } from '../data/categories';
import { QUESTIONS } from '../data/questions';
import { formatScore } from '../utils/scoring';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface CategoryCompleteProps {
  categoryId: CategoryId;
  completedMap: Record<number, QuestionProgress>;
  currentScore: number;
  bestCombo: number;
  onContinue: () => void;
}

export const CategoryComplete: React.FC<CategoryCompleteProps> = ({
  categoryId,
  completedMap,
  currentScore,
  bestCombo,
  onContinue,
}) => {
  const category = CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];
  const catQuestions = QUESTIONS.filter((q) => q.category === categoryId);

  let correctCount = 0;
  let wrongCount = 0;
  let categoryScore = 0;

  catQuestions.forEach((q) => {
    const prog = completedMap[q.id];
    if (prog?.answered) {
      if (prog.isCorrect) correctCount++;
      else wrongCount++;
      categoryScore += prog.scoreEarned || 0;
    }
  });

  const total = catQuestions.length;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const handleContinueClick = () => {
    audioManager.playClick();
    Haptics.click();
    onContinue();
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-center items-center p-4 sm:p-6 overflow-y-auto no-scrollbar">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full rounded-3xl bg-slate-900 border border-slate-750 p-6 shadow-2xl flex flex-col items-center text-center gap-4"
      >
        {/* Animated Trophy badge */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
          className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500/20 via-yellow-400/30 to-amber-600/20 border-2 border-amber-400/60 shadow-xl shadow-amber-500/20"
        >
          <Trophy className="w-12 h-12 text-amber-400 drop-shadow" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-dashed border-amber-400/40 pointer-events-none"
          />
        </motion.div>

        <div>
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">
            CATEGORY COMPLETE!
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-0.5 tracking-wide">
            {category.name}
          </h2>
          <span className="text-xs text-slate-400">
            Seluruh 15 tantangan pada kategori ini telah diselesaikan!
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400">POIN KATEGORI</span>
            <span className="text-lg font-mono font-black text-amber-300">
              +{formatScore(categoryScore)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400">TOTAL SKOR</span>
            <span className="text-lg font-mono font-black text-emerald-400">
              {formatScore(currentScore)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
              <Target className="w-3 h-3 text-sky-400" /> AKURASI
            </span>
            <span className="text-base font-mono font-black text-sky-300">
              {accuracy}%
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-orange-400 fill-orange-400" /> BEST COMBO
            </span>
            <span className="text-base font-mono font-black text-orange-400">
              x{bestCombo}
            </span>
          </div>
        </div>

        {/* Breakdown correct vs wrong */}
        <div className="w-full flex items-center justify-around p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Check className="w-4 h-4 stroke-[3]" /> {correctCount} Soal Benar
          </span>
          <div className="w-px h-4 bg-slate-800" />
          <span className="flex items-center gap-1.5 text-rose-400">
            <X className="w-4 h-4 stroke-[3]" /> {wrongCount} Soal Salah
          </span>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleContinueClick}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/25 active:scale-98 transition-all mt-2"
        >
          <span>LANJUT KE KATEGORI LAIN</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </motion.div>
    </div>
  );
};
