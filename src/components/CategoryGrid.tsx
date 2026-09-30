import React from 'react';
import { motion } from 'motion/react';
import { CATEGORIES } from '../data/categories';
import { CategoryCard } from './CategoryCard';
import { CategoryId, QuestionProgress } from '../types/game';

interface CategoryGridProps {
  completedMap: Record<number, QuestionProgress>;
  onSelectCategory: (id: CategoryId) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  completedMap,
  onSelectCategory,
}) => {
  const totalCompleted = Object.keys(completedMap).length;

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col p-4 sm:p-6 overflow-y-auto no-scrollbar">
      {/* Title & Info */}
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-wide font-cinzel">
          PILIH KATEGORI
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Selesaikan seluruh 60 soal dalam 4 pilar ilmu untuk menjadi Champion!
        </p>

        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <span className="text-slate-400">Total Progres:</span>
          <span className="font-mono font-bold text-amber-400">{totalCompleted} / 60 Soal</span>
          <div className="flex-1 h-1.5 rounded-full bg-slate-950 overflow-hidden ml-2">
            <div
              className="h-full bg-amber-400 transition-all duration-300"
              style={{ width: `${Math.round((totalCompleted / 60) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Categories */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8"
      >
        {CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            completedMap={completedMap}
            onSelect={onSelectCategory}
          />
        ))}
      </motion.div>
    </div>
  );
};
