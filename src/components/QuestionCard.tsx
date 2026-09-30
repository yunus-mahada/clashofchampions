import React from 'react';
import { motion } from 'motion/react';
import { Check, X, HelpCircle } from 'lucide-react';
import { Question, QuestionProgress } from '../types/game';

interface QuestionCardProps {
  question: Question;
  index: number;
  progress?: QuestionProgress;
  isCurrent?: boolean;
  onSelect: (id: number) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  progress,
  isCurrent = false,
  onSelect,
}) => {
  const isAnswered = progress?.answered;
  const isCorrect = progress?.isCorrect;
  const numStr = String(index + 1).padStart(2, '0');

  let bgClass = 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600';
  let badgeColor = 'bg-slate-800 text-slate-400';

  if (isAnswered) {
    if (isCorrect) {
      bgClass = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-950/20';
      badgeColor = 'bg-emerald-500 text-slate-950';
    } else {
      bgClass = 'bg-rose-950/40 border-rose-500/50 text-rose-300 shadow-md shadow-rose-950/20';
      badgeColor = 'bg-rose-500 text-white';
    }
  } else if (isCurrent) {
    bgClass = 'bg-amber-950/30 border-amber-400 text-amber-300 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 animate-pulse';
    badgeColor = 'bg-amber-400 text-slate-950';
  }

  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={() => onSelect(question.id)}
      className={`relative flex flex-col items-center justify-between p-3 min-h-[96px] rounded-2xl border transition-all ${bgClass}`}
    >
      {/* Top Number */}
      <span className="font-mono text-xs font-black tracking-wider opacity-80">
        {numStr}
      </span>

      {/* Center Status Icon */}
      <div className="flex items-center justify-center my-1">
        {isAnswered ? (
          isCorrect ? (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <X className="w-5 h-5 stroke-[3]" />
            </div>
          )
        ) : (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800/80 text-slate-500 border border-slate-700/60">
            <HelpCircle className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Difficulty tag indicator */}
      <div className="text-[10px] font-semibold tracking-wide uppercase opacity-75">
        {question.difficulty === 'hard' ? 'Hard' : question.difficulty === 'medium' ? 'Med' : 'Easy'}
      </div>
    </motion.button>
  );
};
