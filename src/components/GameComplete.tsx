import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Award, RotateCcw, Home, Target, Zap, Check, X } from 'lucide-react';
import { QuestionProgress } from '../types/game';
import { CATEGORIES } from '../data/categories';
import { QUESTIONS } from '../data/questions';
import { formatScore, getChampionRank } from '../utils/scoring';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface GameCompleteProps {
  score: number;
  bestCombo: number;
  totalCorrect: number;
  totalWrong: number;
  completedMap: Record<number, QuestionProgress>;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export const GameComplete: React.FC<GameCompleteProps> = ({
  score,
  bestCombo,
  totalCorrect,
  totalWrong,
  completedMap,
  onPlayAgain,
  onGoHome,
}) => {
  const rank = getChampionRank(score);
  const total = 60;
  const accuracy = total > 0 ? ((totalCorrect / total) * 100).toFixed(1) : '0';

  return (
    <div className="flex-1 w-full max-w-lg mx-auto flex flex-col p-4 sm:p-6 overflow-y-auto no-scrollbar">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full rounded-3xl bg-slate-900 border border-slate-750 p-6 shadow-2xl flex flex-col items-center text-center gap-4"
      >
        {/* Animated Champion Crown / Trophy */}
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10, stiffness: 220 }}
          className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 text-slate-950 shadow-2xl shadow-amber-500/40"
        >
          <Trophy className="w-12 h-12 drop-shadow" />
        </motion.div>

        <div>
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">
            🏆 CHAMPION ODYSSEY COMPLETE!
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-0.5 tracking-wide font-cinzel">
            SELAMAT, SANG JUARA!
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            Kamu telah menuntaskan seluruh 60 tantangan wawasan Islam dengan gemilang!
          </p>
        </div>

        {/* Rank Badge */}
        <div className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/20 to-amber-500/10 border border-amber-500/40 flex items-center justify-center gap-2">
          <span className="text-2xl">{rank.badge}</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Gelar Juara</span>
            <span className="text-base font-black text-amber-200 tracking-wider">
              {rank.name}
            </span>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400">TOTAL SKOR</span>
            <span className="text-xl font-mono font-black text-amber-300">
              {formatScore(score)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
              <Target className="w-3 h-3 text-sky-400" /> AKURASI
            </span>
            <span className="text-xl font-mono font-black text-sky-300">
              {accuracy}%
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" /> BENAR / SALAH
            </span>
            <span className="text-base font-mono font-black text-slate-200">
              <span className="text-emerald-400">{totalCorrect}</span> / <span className="text-rose-400">{totalWrong}</span>
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

        {/* Category Breakdown */}
        <div className="w-full flex flex-col gap-2 rounded-2xl bg-slate-950/60 border border-slate-800/80 p-3.5 text-left">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <Award className="w-3.5 h-3.5 text-amber-400" /> Hasil Per Kategori:
          </span>

          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => {
              const catQs = QUESTIONS.filter((q) => q.category === cat.id);
              const correct = catQs.filter((q) => completedMap[q.id]?.isCorrect).length;
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                >
                  <span className="text-slate-300 font-medium truncate mr-1">
                    {cat.icon} {cat.name.replace('Bedah Surat ', '')}
                  </span>
                  <span className="font-mono font-bold text-amber-400 shrink-0">
                    {correct}/{catQs.length}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full mt-2">
          <button
            onClick={() => {
              audioManager.playClick();
              Haptics.click();
              onPlayAgain();
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/25 active:scale-98 transition-all"
          >
            <RotateCcw className="w-4 h-4 stroke-[3]" />
            <span>MAIN LAGI DARI AWAL</span>
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              Haptics.click();
              onGoHome();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-200 text-xs font-bold active:scale-98 transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>KEMBALI KE MENU UTAMA</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
