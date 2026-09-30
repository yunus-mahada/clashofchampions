import { Difficulty } from '../types/game';

export interface ChampionRank {
  name: string;
  badge: string;
  color: string;
  minScore: number;
}

export const CHAMPION_RANKS: ChampionRank[] = [
  { name: 'CLASH MASTER', badge: '👑', color: 'text-amber-400', minScore: 8001 },
  { name: 'QUIZ CHAMPION', badge: '🏆', color: 'text-yellow-400', minScore: 6001 },
  { name: 'ISLAMIC SCHOLAR', badge: '🌟', color: 'text-emerald-400', minScore: 4001 },
  { name: 'KNOWLEDGE EXPLORER', badge: '🧭', color: 'text-sky-400', minScore: 2001 },
  { name: 'QUIZ ROOKIE', badge: '🌱', color: 'text-slate-300', minScore: 0 },
];

export function getComboMultiplier(combo: number): number {
  if (combo <= 1) return 1.0;
  if (combo === 2) return 1.2;
  if (combo === 3) return 1.5;
  if (combo === 4) return 1.8;
  return 2.0;
}

export function calculateQuestionScore(difficulty: Difficulty, combo: number): {
  baseScore: number;
  multiplier: number;
  totalScore: number;
} {
  let baseScore = 100;
  if (difficulty === 'medium') baseScore = 150;
  if (difficulty === 'hard') baseScore = 200;

  const multiplier = getComboMultiplier(combo);
  const totalScore = Math.round(baseScore * multiplier);

  return { baseScore, multiplier, totalScore };
}

export function getChampionRank(score: number): ChampionRank {
  for (const rank of CHAMPION_RANKS) {
    if (score >= rank.minScore) {
      return rank;
    }
  }
  return CHAMPION_RANKS[CHAMPION_RANKS.length - 1];
}

export function formatScore(score: number): string {
  return new Intl.NumberFormat('id-ID').format(score);
}
