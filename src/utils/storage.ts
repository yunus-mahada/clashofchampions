import { PersistedGameData, Question } from '../types/game';
import { QUESTIONS } from '../data/questions';

export const STORAGE_KEY = 'math_game_master__2d_odyssey_highscore';
export const QUESTIONS_STORAGE_KEY = 'clash_of_champions_questions_v1';

const DEFAULT_DATA: PersistedGameData = {
  highScore: 0,
  currentScore: 0,
  combo: 0,
  bestCombo: 0,
  totalCorrect: 0,
  totalWrong: 0,
  completedQuestions: {},
  soundEnabled: true,
  musicEnabled: true,
  soundVolume: 0.8,
  musicVolume: 0.35,
  currentCategory: null,
  activeQuestionId: null,
};

let memoryFallback: PersistedGameData = { ...DEFAULT_DATA };
let questionsMemoryFallback: Question[] = [...QUESTIONS];

export const Storage = {
  load(): PersistedGameData {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            ...DEFAULT_DATA,
            ...parsed,
          };
        }
      }
    } catch {
      // Return memory fallback if storage is restricted
      return memoryFallback;
    }
    return DEFAULT_DATA;
  },

  save(data: Partial<PersistedGameData>): void {
    try {
      const current = this.load();
      const updated = { ...current, ...data };
      memoryFallback = updated;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {
      // Storage quota or permission blocked
    }
  },

  reset(): void {
    try {
      memoryFallback = {
        ...DEFAULT_DATA,
        highScore: memoryFallback.highScore, // Retain high score on progress reset
      };
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryFallback));
      }
    } catch {}
  },

  clearAll(): void {
    try {
      memoryFallback = { ...DEFAULT_DATA };
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  },

  loadQuestions(): Question[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(QUESTIONS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            questionsMemoryFallback = parsed;
            return parsed;
          }
        }
      }
    } catch {
      return questionsMemoryFallback;
    }
    return QUESTIONS;
  },

  saveQuestions(questions: Question[]): void {
    questionsMemoryFallback = questions;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(questions));
      }
    } catch {}
  },

  saveSingleQuestion(updatedQ: Question): Question[] {
    const list = this.loadQuestions();
    const index = list.findIndex((q) => q.id === updatedQ.id);
    let updatedList: Question[];
    if (index >= 0) {
      updatedList = [...list];
      updatedList[index] = updatedQ;
    } else {
      updatedList = [...list, updatedQ];
    }
    this.saveQuestions(updatedList);
    return updatedList;
  },

  deleteQuestion(id: number): Question[] {
    const list = this.loadQuestions();
    const updatedList = list.filter((q) => q.id !== id);
    this.saveQuestions(updatedList);
    return updatedList;
  },

  resetQuestionsToDefault(): Question[] {
    questionsMemoryFallback = [...QUESTIONS];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(QUESTIONS_STORAGE_KEY);
      }
    } catch {}
    return QUESTIONS;
  },
};

