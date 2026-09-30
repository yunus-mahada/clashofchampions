import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, ArrowRight, Zap, BookOpen } from 'lucide-react';
import { Question } from '../types/game';
import { formatScore } from '../utils/scoring';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface QuestionFeedbackProps {
  question: Question;
  isCorrect: boolean;
  pointsEarned: number;
  baseScore: number;
  multiplier: number;
  onNext: () => void;
}

export const QuestionFeedback: React.FC<QuestionFeedbackProps> = ({
  question,
  isCorrect,
  pointsEarned,
  baseScore,
  multiplier,
  onNext,
}) => {
  const getCorrectAnswerDisplay = (): string => {
    if (Array.isArray(question.correctAnswer)) {
      return question.correctAnswer.join(' ➔ ');
    }
    return String(question.correctAnswer);
  };

  const handleNextClick = () => {
    audioManager.playClick();
    Haptics.click();
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`w-full rounded-2xl border p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col gap-3.5 ${
        isCorrect
          ? 'bg-gradient-to-b from-emerald-950/70 via-slate-900/90 to-slate-950 border-emerald-500/40 shadow-emerald-950/40'
          : 'bg-gradient-to-b from-rose-950/70 via-slate-900/90 to-slate-950 border-rose-500/40 shadow-rose-950/40'
      }`}
    >
      {/* Header status */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          {isCorrect ? (
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <XCircle className="w-6 h-6" />
            </div>
          )}

          <div>
            <h3
              className={`text-lg sm:text-xl font-black tracking-wide ${
                isCorrect ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {isCorrect ? '🎉 BENAR!' : '💡 BELUM TEPAT'}
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {isCorrect ? 'Jawaban kamu sangat tepat!' : 'Jangan berkecil hati, pelajari penjelasannya.'}
            </span>
          </div>
        </div>

        {isCorrect && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-emerald-400" /> +{formatScore(pointsEarned)} PT
            </span>
            {multiplier > 1 && (
              <span className="text-[10px] text-amber-300 font-mono">
                {baseScore} × {multiplier}x combo
              </span>
            )}
          </div>
        )}
      </div>

      {/* If wrong, display correct answer */}
      {!isCorrect && (
        <div className="rounded-xl bg-slate-900/80 border border-slate-700/60 p-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Jawaban yang benar:
          </span>
          <span className="text-sm sm:text-base font-bold text-amber-300">
            {getCorrectAnswerDisplay()}
          </span>
        </div>
      )}

      {/* Explanation */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Penjelasan Edukasi:</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
          {question.explanation}
        </p>
      </div>

      {/* Next Button */}
      <button
        onClick={handleNextClick}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-98 transition-all mt-1"
      >
        <span>LANJUT</span>
        <ArrowRight className="w-4 h-4 stroke-[3]" />
      </button>
    </motion.div>
  );
};
