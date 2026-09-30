import { useState, useEffect, useCallback, useRef } from 'react';
import { CategoryId, GameState, QuestionProgress, PersistedGameData, Question } from '../types/game';
import { QuizRoom, QuizPlayer } from '../utils/supabase';
import { Storage } from '../utils/storage';
import { audioManager } from '../game/AudioManager';
import { particleSystem } from '../game/ParticleSystem';
import { Haptics } from '../utils/haptics';
import { calculateQuestionScore } from '../utils/scoring';

export function useGameState() {
  const [data, setData] = useState<PersistedGameData>(() => Storage.load());
  const [questions, setQuestions] = useState<Question[]>(() => Storage.loadQuestions());
  const [screen, setScreen] = useState<GameState>('menu');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);

  // Multiplayer Live Room State
  const [multiplayerRoom, setMultiplayerRoom] = useState<QuizRoom | null>(null);
  const [multiplayerPlayer, setMultiplayerPlayer] = useState<QuizPlayer | null>(null);
  const [multiplayerFinalResult, setMultiplayerFinalResult] = useState<{
    finalScore: number;
    correctCount: number;
    wrongCount: number;
  } | null>(null);

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Last answered result for feedback screen
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    pointsEarned: number;
    baseScore: number;
    multiplier: number;
    timeTaken: number;
    userAnswer: string | string[];
  } | null>(null);

  // Native phone back button exit toast state
  const [exitToast, setExitToast] = useState(false);
  const exitToastTimerRef = useRef<number | null>(null);
  const exitAttemptsRef = useRef(0);

  // Sync audioManager preferences
  useEffect(() => {
    audioManager.setSoundEnabled(data.soundEnabled);
    audioManager.setMusicEnabled(data.musicEnabled);
    audioManager.setSoundVolume(data.soundVolume);
    audioManager.setMusicVolume(data.musicVolume);
  }, [data.soundEnabled, data.musicEnabled, data.soundVolume, data.musicVolume]);

  // Keep references to current screen and modals for popstate event listener
  const screenRef = useRef(screen);
  screenRef.current = screen;

  const modalsRef = useRef({
    showSettings,
    showHowToPlay,
    showResetConfirm,
  });
  modalsRef.current = {
    showSettings,
    showHowToPlay,
    showResetConfirm,
  };

  // Hardware Back Button & Mobile Swipe-Back (Android & iPhone Safari/Chrome)
  useEffect(() => {
    // Initial dummy state trap to prevent accidental app close
    try {
      window.history.replaceState({ screen: 'menu', step: 0 }, '', window.location.href);
      window.history.pushState({ screen: 'menu', step: 1 }, '', window.location.href);
    } catch {}

    const handlePopState = () => {
      // 1. If any modal is open, close it first instead of navigating
      const { showSettings: sSettings, showHowToPlay: sHow, showResetConfirm: sReset } = modalsRef.current;
      if (sSettings || sHow || sReset) {
        setShowSettings(false);
        setShowHowToPlay(false);
        setShowResetConfirm(false);
        audioManager.playClick();
        Haptics.click();
        try {
          window.history.pushState({ screen: screenRef.current, step: 1 }, '', window.location.href);
        } catch {}
        return;
      }

      const current = screenRef.current;

      // 2. If user is at root menu, prompt "Tekan sekali lagi untuk keluar" (standard Android/iOS UX)
      if (current === 'menu') {
        if (exitAttemptsRef.current === 0) {
          exitAttemptsRef.current = 1;
          setExitToast(true);
          Haptics.click();
          try {
            window.history.pushState({ screen: 'menu', step: 1 }, '', window.location.href);
          } catch {}

          if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
          exitToastTimerRef.current = window.setTimeout(() => {
            exitAttemptsRef.current = 0;
            setExitToast(false);
          }, 2500);
          return;
        } else {
          // Double back pressed within 2.5s: allow user to exit application
          exitAttemptsRef.current = 0;
          setExitToast(false);
          window.history.back();
          return;
        }
      }

      // 3. If on any other screen, navigate back to previous screen
      audioManager.playClick();
      Haptics.click();
      exitAttemptsRef.current = 0;
      setExitToast(false);

      if (
        current === 'question-manager' ||
        current === 'multiplayer-menu' ||
        current === 'game-complete' ||
        current === 'player-live-finish'
      ) {
        setScreen('menu');
      } else if (current === 'host-lobby' || current === 'host-scoreboard' || current === 'player-join') {
        setScreen('multiplayer-menu');
      } else if (current === 'player-lobby' || current === 'player-live-game') {
        setScreen('player-join');
      } else if (current === 'pause') {
        setScreen('playing');
      } else if (current === 'playing' || current === 'result') {
        setScreen('question-list');
      } else if (current === 'question-list') {
        setScreen('category');
      } else if (current === 'category-complete') {
        setScreen('category');
      } else if (current === 'category') {
        setScreen('menu');
      } else {
        setScreen('menu');
      }

      // Re-push history trap to keep subsequent back presses protected
      try {
        window.history.pushState({ screen: screenRef.current, step: 1 }, '', window.location.href);
      } catch {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
    };
  }, []);

  const navigateTo = useCallback((nextScreen: GameState) => {
    setScreen(nextScreen);
    exitAttemptsRef.current = 0;
    setExitToast(false);
    try {
      window.history.pushState({ screen: nextScreen, step: 1 }, '', window.location.href);
    } catch {}
  }, []);

  const goBack = useCallback(() => {
    const { showSettings: sSettings, showHowToPlay: sHow, showResetConfirm: sReset } = modalsRef.current;
    if (sSettings || sHow || sReset) {
      setShowSettings(false);
      setShowHowToPlay(false);
      setShowResetConfirm(false);
      audioManager.playClick();
      Haptics.click();
      return;
    }

    const current = screenRef.current;
    audioManager.playClick();
    Haptics.click();

    if (
      current === 'question-manager' ||
      current === 'multiplayer-menu' ||
      current === 'game-complete' ||
      current === 'player-live-finish'
    ) {
      navigateTo('menu');
    } else if (current === 'host-lobby' || current === 'host-scoreboard' || current === 'player-join') {
      navigateTo('multiplayer-menu');
    } else if (current === 'player-lobby' || current === 'player-live-game') {
      navigateTo('player-join');
    } else if (current === 'pause') {
      navigateTo('playing');
    } else if (current === 'playing' || current === 'result') {
      navigateTo('question-list');
    } else if (current === 'question-list') {
      navigateTo('category');
    } else if (current === 'category-complete') {
      navigateTo('category');
    } else if (current === 'category') {
      navigateTo('menu');
    } else {
      navigateTo('menu');
    }
  }, [navigateTo]);

  // Save changes to storage whenever data changes
  const updateData = useCallback((updates: Partial<PersistedGameData>) => {
    setData((prev) => {
      const next = { ...prev, ...updates };
      Storage.save(next);
      return next;
    });
  }, []);

  const updateQuestion = useCallback((updated: Question) => {
    const nextList = Storage.saveSingleQuestion(updated);
    setQuestions(nextList);
  }, []);

  const resetQuestionsToDefault = useCallback(() => {
    const defaultList = Storage.resetQuestionsToDefault();
    setQuestions(defaultList);
  }, []);

  const openQuestionManager = useCallback(() => {
    audioManager.playClick();
    Haptics.click();
    setShowSettings(false);
    navigateTo('question-manager');
  }, [navigateTo]);

  // Multiplayer Actions
  const openMultiplayerMenu = useCallback(() => {
    audioManager.playClick();
    Haptics.click();
    navigateTo('multiplayer-menu');
  }, [navigateTo]);

  const startHostLobby = useCallback(() => {
    audioManager.playClick();
    Haptics.click();
    navigateTo('host-lobby');
  }, [navigateTo]);

  const startHostScoreboard = useCallback((room: QuizRoom) => {
    setMultiplayerRoom(room);
    navigateTo('host-scoreboard');
  }, [navigateTo]);

  const openPlayerJoin = useCallback(() => {
    audioManager.playClick();
    Haptics.click();
    navigateTo('player-join');
  }, [navigateTo]);

  const handlePlayerJoined = useCallback((room: QuizRoom, player: QuizPlayer) => {
    setMultiplayerRoom(room);
    setMultiplayerPlayer(player);
    navigateTo('player-lobby');
  }, [navigateTo]);

  const handlePlayerStartGame = useCallback(() => {
    navigateTo('player-live-game');
  }, [navigateTo]);

  const handlePlayerFinishGame = useCallback(
    (finalScore: number, correctCount: number, wrongCount: number) => {
      setMultiplayerFinalResult({ finalScore, correctCount, wrongCount });
      navigateTo('player-live-finish');
    },
    [navigateTo]
  );

  const leaveMultiplayer = useCallback(() => {
    audioManager.playClick();
    Haptics.click();
    setMultiplayerRoom(null);
    setMultiplayerPlayer(null);
    setMultiplayerFinalResult(null);
    navigateTo('menu');
  }, [navigateTo]);

  const startNewGame = useCallback(() => {
    audioManager.resume();
    audioManager.playClick();
    Haptics.click();
    Storage.reset();
    setData((prev) => ({
      ...prev,
      currentScore: 0,
      combo: 0,
      totalCorrect: 0,
      totalWrong: 0,
      completedQuestions: {},
      currentCategory: null,
      activeQuestionId: null,
    }));
    setSelectedCategory(null);
    setCurrentQuestionId(null);
    navigateTo('category');
  }, [navigateTo]);

  const continueGame = useCallback(() => {
    audioManager.resume();
    audioManager.playClick();
    Haptics.click();
    if (data.currentCategory) {
      setSelectedCategory(data.currentCategory);
      navigateTo('question-list');
    } else {
      navigateTo('category');
    }
  }, [data.currentCategory, navigateTo]);

  const selectCategory = useCallback((catId: CategoryId) => {
    audioManager.resume();
    audioManager.playClick();
    Haptics.click();
    setSelectedCategory(catId);
    updateData({ currentCategory: catId });
    navigateTo('question-list');
  }, [navigateTo, updateData]);

  const selectQuestion = useCallback((qId: number) => {
    audioManager.resume();
    audioManager.playClick();
    Haptics.click();
    setCurrentQuestionId(qId);
    updateData({ activeQuestionId: qId });
    setLastResult(null);
    navigateTo('playing');
  }, [navigateTo, updateData]);

  const handleAnswer = useCallback(
    (isCorrect: boolean, timeTaken: number, userAnswer: string | string[]) => {
      if (!currentQuestionId) return;

      const q = questions.find((item) => item.id === currentQuestionId);
      if (!q) return;

      let newCombo = 0;
      let pointsEarned = 0;
      let baseScore = 0;
      let multiplier = 1;

      if (isCorrect) {
        newCombo = data.combo + 1;
        const scoreCalc = calculateQuestionScore(q.difficulty, newCombo);
        pointsEarned = scoreCalc.totalScore;
        baseScore = scoreCalc.baseScore;
        multiplier = scoreCalc.multiplier;

        audioManager.playCorrect();
        if (newCombo >= 2) {
          audioManager.playCombo(newCombo);
        }
        Haptics.correct();

        // Emit particles
        if (typeof window !== 'undefined') {
          particleSystem.emitCorrectBurst(window.innerWidth / 2, window.innerHeight * 0.45);
          if (newCombo >= 2) {
            particleSystem.emitComboSparkle(window.innerWidth / 2, window.innerHeight * 0.25, newCombo);
          }
        }
      } else {
        newCombo = 0;
        audioManager.playWrong();
        Haptics.wrong();
      }

      const newScore = data.currentScore + pointsEarned;
      const newHighScore = Math.max(data.highScore, newScore);
      const newBestCombo = Math.max(data.bestCombo, newCombo);

      const qProgress: QuestionProgress = {
        answered: true,
        isCorrect,
        scoreEarned: pointsEarned,
        timeTaken,
      };

      const updatedCompleted = {
        ...data.completedQuestions,
        [currentQuestionId]: qProgress,
      };

      const newTotalCorrect = data.totalCorrect + (isCorrect ? 1 : 0);
      const newTotalWrong = data.totalWrong + (isCorrect ? 0 : 1);

      updateData({
        currentScore: newScore,
        highScore: newHighScore,
        combo: newCombo,
        bestCombo: newBestCombo,
        totalCorrect: newTotalCorrect,
        totalWrong: newTotalWrong,
        completedQuestions: updatedCompleted,
      });

      setLastResult({
        isCorrect,
        pointsEarned,
        baseScore,
        multiplier,
        timeTaken,
        userAnswer,
      });

      setScreen('result');
    },
    [currentQuestionId, data, questions, updateData]
  );

  const nextQuestion = useCallback(() => {
    audioManager.playClick();
    Haptics.click();

    if (!selectedCategory) {
      navigateTo('category');
      return;
    }

    // Filter questions in current category
    const catQuestions = questions.filter((q) => q.category === selectedCategory);
    const catCompletedCount = catQuestions.filter((q) => data.completedQuestions[q.id]?.answered).length;

    // Check if entire game of 60 questions is complete
    const totalAnswered = Object.keys(data.completedQuestions).length;
    if (totalAnswered >= 60) {
      audioManager.playGameComplete();
      Haptics.celebrate();
      particleSystem.emitCelebrationConfetti();
      navigateTo('game-complete');
      return;
    }

    // Check if current category of 15 questions is complete
    if (catCompletedCount >= catQuestions.length) {
      audioManager.playCategoryComplete();
      Haptics.celebrate();
      particleSystem.emitCelebrationConfetti();
      navigateTo('category-complete');
      return;
    }

    // Otherwise find the next unplayed question in this category
    const nextUnplayed = catQuestions.find((q) => !data.completedQuestions[q.id]?.answered);
    if (nextUnplayed) {
      selectQuestion(nextUnplayed.id);
    } else {
      navigateTo('question-list');
    }
  }, [selectedCategory, questions, data.completedQuestions, navigateTo, selectQuestion]);

  const pauseGame = useCallback(() => {
    audioManager.playClick();
    Haptics.click();
    navigateTo('pause');
  }, [navigateTo]);

  const resumeGame = useCallback(() => {
    audioManager.playClick();
    Haptics.click();
    navigateTo('playing');
  }, [navigateTo]);

  const restartCategory = useCallback(() => {
    audioManager.playClick();
    Haptics.click();
    if (!selectedCategory) return;
    const catQuestions = questions.filter((q) => q.category === selectedCategory);
    const updated = { ...data.completedQuestions };
    catQuestions.forEach((q) => {
      delete updated[q.id];
    });
    updateData({ completedQuestions: updated });
    navigateTo('question-list');
  }, [selectedCategory, questions, data.completedQuestions, updateData, navigateTo]);

  const resetAll = useCallback(() => {
    audioManager.playClick();
    Haptics.click();
    Storage.reset();
    setData((prev) => ({
      ...prev,
      currentScore: 0,
      combo: 0,
      bestCombo: 0,
      totalCorrect: 0,
      totalWrong: 0,
      completedQuestions: {},
      currentCategory: null,
      activeQuestionId: null,
    }));
    setSelectedCategory(null);
    setCurrentQuestionId(null);
    setShowResetConfirm(false);
    navigateTo('menu');
  }, [navigateTo]);

  const toggleSound = useCallback(() => {
    const nextVal = !data.soundEnabled;
    audioManager.setSoundEnabled(nextVal);
    updateData({ soundEnabled: nextVal });
    if (nextVal) audioManager.playClick();
  }, [data.soundEnabled, updateData]);

  const toggleMusic = useCallback(() => {
    const nextVal = !data.musicEnabled;
    audioManager.setMusicEnabled(nextVal);
    updateData({ musicEnabled: nextVal });
  }, [data.musicEnabled, updateData]);

  const setSoundVolume = useCallback((val: number) => {
    audioManager.setSoundVolume(val);
    updateData({ soundVolume: val });
  }, [updateData]);

  const setMusicVolume = useCallback((val: number) => {
    audioManager.setMusicVolume(val);
    updateData({ musicVolume: val });
  }, [updateData]);

  return {
    screen,
    selectedCategory,
    currentQuestionId,
    data,
    questions,
    lastResult,
    showSettings,
    showHowToPlay,
    showResetConfirm,
    setShowSettings,
    setShowHowToPlay,
    setShowResetConfirm,
    openQuestionManager,
    updateQuestion,
    resetQuestionsToDefault,
    multiplayerRoom,
    multiplayerPlayer,
    multiplayerFinalResult,
    openMultiplayerMenu,
    startHostLobby,
    startHostScoreboard,
    openPlayerJoin,
    handlePlayerJoined,
    handlePlayerStartGame,
    handlePlayerFinishGame,
    leaveMultiplayer,
    startNewGame,
    continueGame,
    selectCategory,
    selectQuestion,
    handleAnswer,
    nextQuestion,
    pauseGame,
    resumeGame,
    restartCategory,
    resetAll,
    toggleSound,
    toggleMusic,
    setSoundVolume,
    setMusicVolume,
    navigateTo,
    goBack,
    exitToast,
  };
}
