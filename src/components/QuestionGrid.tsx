import React from 'react';
import { motion } from 'motion/react';
import { Play, Check, X, RotateCcw } from 'lucide-react';
import { CategoryId, QuestionProgress, Question } from '../types/game';
import { CATEGORIES } from '../data/categories';
import { QUESTIONS } from '../data/questions';
import { QuestionCard } from './QuestionCard';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface QuestionGridProps {
  categoryId: CategoryId;
  completedMap: Record<number, QuestionProgress>;
  activeQuestionId: number | null;
  questions?: Question[];
  onSelectQuestion: (id: number) => void;
  onRestartCategory: () => void;
}

export const QuestionGrid: React.FC<QuestionGridProps> = ({
  categoryId,
  completedMap,
  activeQuestionId,
  questions = QUESTIONS,
  onSelectQuestion,
  onRestartCategory,
}) => {
  const category = CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];
  const catQuestions = questions.filter((q) => q.category === categoryId);

  let correctCount = 0;
  let wrongCount = 0;
  catQuestions.forEach((q) => {
    const prog = completedMap[q.id];
    if (prog?.answered) {
      if (prog.isCorrect) correctCount++;
      else wrongCount++;
    }
  });

  const total = catQuestions.length;
  const answeredCount = correctCount + wrongCount;
  const percentage = Math.round((answeredCount / total) * 100);

  // Find first unplayed question
  const nextUnplayed = catQuestions.find((q) => !completedMap[q.id]?.answered);

  const handlePlayNext = () => {
    audioManager.playClick();
    Haptics.click();
    if (nextUnplayed) {
      onSelectQuestion(nextUnplayed.id);
    } else if (catQuestions.length > 0) {
      onSelectQuestion(catQuestions[0].id);
    }
  };

  return (
    <div className="flex-1 w-full max-w-xl mx-auto flex flex-col p-4 overflow-y-auto no-scrollbar pb-8">
      {/* Category Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full p-4 rounded-3xl bg-gradient-to-br ${category.gradient} border ${category.borderGlow} shadow-xl mb-4`}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{category.icon}</span>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              KATEGORI {category.number}
            </span>
            <h2 className="text-lg font-black text-slate-100">{category.name}</h2>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Progress Kategori</span>
            <span className="font-mono font-bold text-amber-300">
              {answeredCount} / {total} ({percentage}%)
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-amber-400 to-emerald-400"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold pt-1">
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="w-3.5 h-3.5 stroke-[3]" /> {correctCount} Benar
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <X className="w-3.5 h-3.5 stroke-[3]" /> {wrongCount} Salah
            </span>
          </div>
        </div>
      </motion.div>

      {/* Action button: Mainkan Soal Berikutnya */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handlePlayNext}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-extrabold shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>{nextUnplayed ? `Lanjut Soal ${catQuestions.indexOf(nextUnplayed) + 1}` : 'Ulangi Kategori'}</span>
        </button>

        {answeredCount > 0 && (
          <button
            onClick={onRestartCategory}
            className="flex items-center justify-center w-12 h-12 rounded-2xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-750 active:scale-95 transition-all"
            aria-label="Reset Kategori Ini"
            title="Reset Kategori Ini"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3 x 5 Grid of Questions */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
        {catQuestions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={idx}
            progress={completedMap[q.id]}
            isCurrent={activeQuestionId === q.id}
            onSelect={onSelectQuestion}
          />
        ))}
      </div>
    </div>
  );
};
