import React from 'react';
import { motion } from 'motion/react';
import { Check, X, ChevronRight } from 'lucide-react';
import { CategoryInfo, QuestionProgress } from '../types/game';
import { QUESTIONS } from '../data/questions';

interface CategoryCardProps {
  category: CategoryInfo;
  completedMap: Record<number, QuestionProgress>;
  onSelect: (id: CategoryInfo['id']) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  completedMap,
  onSelect,
}) => {
  const catQuestions = QUESTIONS.filter((q) => q.category === category.id);
  const total = catQuestions.length;

  let correctCount = 0;
  let wrongCount = 0;
  catQuestions.forEach((q) => {
    const prog = completedMap[q.id];
    if (prog?.answered) {
      if (prog.isCorrect) correctCount++;
      else wrongCount++;
    }
  });

  const answeredCount = correctCount + wrongCount;
  const percentage = Math.round((answeredCount / total) * 100);
  const isCompleted = answeredCount === total && total > 0;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(category.id)}
      className={`group relative flex flex-col justify-between w-full p-4 sm:p-5 rounded-3xl bg-gradient-to-br ${category.gradient} border ${category.borderGlow} shadow-xl hover:shadow-2xl transition-all text-left overflow-hidden`}
    >
      {/* Decorative top row */}
      <div className="flex items-center justify-between w-full mb-3">
        <span className="font-mono text-xs font-black tracking-widest text-slate-400 group-hover:text-amber-400 transition-colors">
          KATEGORI {category.number}
        </span>
        <span className="text-3xl filter drop-shadow">{category.icon}</span>
      </div>

      {/* Title & Description */}
      <div className="mb-4">
        <h3 className="text-lg sm:text-xl font-black text-slate-100 group-hover:text-white tracking-wide">
          {category.name}
        </h3>
        <p className="text-xs text-slate-400 font-normal leading-relaxed mt-1 line-clamp-2">
          {category.description}
        </p>
      </div>

      {/* Progress section */}
      <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold">{total} SOAL</span>
          <span className="font-mono font-bold text-slate-300">
            {answeredCount}/{total} ({percentage}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-950/80 overflow-hidden border border-slate-800">
          <div
            className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-amber-400 to-emerald-400"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Correct & Wrong indicators */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="w-3.5 h-3.5 stroke-[3]" /> {correctCount} Benar
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <X className="w-3.5 h-3.5 stroke-[3]" /> {wrongCount} Salah
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
            <span>{isCompleted ? 'Selesai' : 'Mulai'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </motion.button>
  );
};
