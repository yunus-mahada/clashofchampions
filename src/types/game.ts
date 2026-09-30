export type CategoryId = 'alfatihah' | 'shalat' | 'kisah' | 'umum';

export type QuestionType = 'multiple-choice' | 'true-false' | 'arrange' | 'fill-blank';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameState =
  | 'menu'
  | 'category'
  | 'question-list'
  | 'playing'
  | 'result'
  | 'category-complete'
  | 'game-complete'
  | 'pause'
  | 'question-manager'
  | 'multiplayer-menu'
  | 'host-lobby'
  | 'host-scoreboard'
  | 'player-join'
  | 'player-lobby'
  | 'player-live-game'
  | 'player-live-finish';

export type QuestionStatus = 'unplayed' | 'correct' | 'wrong' | 'current';

export interface Question {
  id: number;
  category: CategoryId;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
  difficulty: Difficulty;
  arabic?: string; // Optional Arabic text for Quran/Prayer verses
}

export interface CategoryInfo {
  id: CategoryId;
  number: string;
  name: string;
  icon: string;
  description: string;
  totalQuestions: number;
  gradient: string;
  borderGlow: string;
  accentColor: string;
}

export interface QuestionProgress {
  answered: boolean;
  isCorrect: boolean;
  scoreEarned: number;
  timeTaken: number;
}

export interface PersistedGameData {
  highScore: number;
  currentScore: number;
  combo: number;
  bestCombo: number;
  totalCorrect: number;
  totalWrong: number;
  completedQuestions: Record<number, QuestionProgress>;
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  currentCategory: CategoryId | null;
  activeQuestionId: number | null;
}
